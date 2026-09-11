import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { PRICING, activateSubscription, type PlanId } from '@/lib/subscription'
import { db } from '@/lib/db'

// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
// Returns: { success: true, tier, endsAt } OR { success: false, error }
//
// Verifies the payment signature from Razorpay Checkout, then activates the
// Pro subscription by updating the User's subscriptionTier + subscriptionEndsAt.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields.' },
        { status: 400 },
      )
    }

    if (!(plan in PRICING)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan specified.' },
        { status: 400 },
      )
    }

    // Step 1: Find the payment record by razorpayOrderId
    const payment = await db.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { user: true },
    })
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment order not found. Please contact support.' },
        { status: 404 },
      )
    }
    if (payment.status === 'paid') {
      // Idempotent — payment was already verified
      return NextResponse.json({
        success: true,
        tier: payment.user.subscriptionTier,
        endsAt: payment.user.subscriptionEndsAt,
        alreadyPaid: true,
      })
    }

    // Step 2: Verify the signature cryptographically
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    )
    if (!isValid) {
      // Mark payment as failed
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      })
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Please contact support.' },
        { status: 400 },
      )
    }

    // Step 3: Activate the subscription
    const result = await activateSubscription(payment.userId, plan as PlanId)

    // Step 4: Mark payment as paid
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    })

    return NextResponse.json({
      success: true,
      tier: result.tier,
      endsAt: result.endsAt.toISOString(),
      plan,
      planLabel: PRICING[plan as PlanId].label,
    })
  } catch (e: any) {
    console.error('[payment/verify] error:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to verify payment' },
      { status: 500 },
    )
  }
}
