import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { PRICING, activateSubscription, type PlanId } from '@/lib/subscription'
import { db } from '@/lib/db'

// POST /api/payment/webhook
// Razorpay sends webhook events for payment lifecycle changes:
//   - payment.captured (success)
//   - payment.failed
//   - subscription.cancelled (future, for recurring subscriptions)
//
// This is OPTIONAL for our current flow (the client-side /verify call already
// activates the subscription), but it's good practice to also accept webhooks
// in case the user closes their browser before /verify runs.
//
// Setup in Razorpay Dashboard:
//   Settings → Webhooks → Add new webhook
//   URL: https://www.hirebase.in/api/payment/webhook
//   Events: payment.captured, payment.failed
//   Secret: set RAZORPAY_WEBHOOK_SECRET env var

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('[payment/webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification (development mode)')
    } else {
      // Verify webhook signature
      const crypto = await import('crypto')
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      if (expected !== signature) {
        console.error('[payment/webhook] signature mismatch — rejecting')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const eventType = event.event
    const paymentEntity = event.payload?.payment?.entity

    if (!paymentEntity) {
      return NextResponse.json({ received: true, ignored: true })
    }

    const razorpayOrderId = paymentEntity.order_id
    const razorpayPaymentId = paymentEntity.id
    const amount = paymentEntity.amount

    // Find our local payment record
    const payment = await db.payment.findUnique({
      where: { razorpayOrderId: razorpayOrderId },
      include: { user: true },
    })
    if (!payment) {
      console.warn('[payment/webhook] payment record not found for order:', razorpayOrderId)
      return NextResponse.json({ received: true, ignored: true })
    }

    if (eventType === 'payment.captured' && payment.status !== 'paid') {
      // Determine plan from the payment record
      const plan = payment.plan as PlanId
      const result = await activateSubscription(payment.userId, plan)
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          razorpayPaymentId,
        },
      })
      console.log(`[payment/webhook] activated ${plan} for user ${payment.userId}, ends ${result.endsAt.toISOString()}`)
    } else if (eventType === 'payment.failed') {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          razorpayPaymentId,
        },
      })
      console.log(`[payment/webhook] payment failed for order ${razorpayOrderId}`)
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('[payment/webhook] error:', e)
    // Return 200 anyway so Razorpay doesn't retry — we've logged the error
    return NextResponse.json({ received: true, error: e.message }, { status: 200 })
  }
}
