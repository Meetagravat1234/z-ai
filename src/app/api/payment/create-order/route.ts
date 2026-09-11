import { NextRequest, NextResponse } from 'next/server'
import { getRazorpay, isRazorpayConfigured } from '@/lib/razorpay'
import { PRICING, type PlanId } from '@/lib/subscription'
import { db } from '@/lib/db'

// POST /api/payment/create-order
// Body: { plan: 'pro_monthly' | 'pro_annual' | 'recruiter_monthly' }
// Returns: { orderId, amount, currency, keyId, plan, receipt }
//
// Creates a Razorpay order. The frontend then uses this orderId to open
// Razorpay Checkout. After payment, the user is redirected to a verify
// endpoint that confirms the signature and activates the subscription.
export async function POST(req: NextRequest) {
  try {
    // Step 1: Validate Razorpay is configured
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: 'Payments are not configured yet. Please contact contact@hirebase.in to upgrade.' },
        { status: 503 },
      )
    }

    // Step 2: Get + validate the user from auth cookie
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to upgrade to Pro.', requiresAuth: true },
        { status: 401 },
      )
    }

    // Step 3: Validate plan
    const { plan } = await req.json()
    if (!plan || !(plan in PRICING)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose from: pro_monthly, pro_annual, recruiter_monthly.' },
        { status: 400 },
      )
    }
    const planConfig = PRICING[plan as PlanId]

    // Step 4: Create Razorpay order
    const rzp = getRazorpay()!
    const receipt = `hirebase_${plan}_${user.id.slice(-8)}_${Date.now()}`
    const order = await rzp.orders.create({
      amount: planConfig.amount, // in paise
      currency: 'INR',
      receipt,
      notes: {
        userId: user.id,
        userEmail: user.email,
        plan,
        source: 'hirebase_upgrade_page',
      },
    })

    // Step 5: Save the payment record (status: 'created')
    await db.payment.create({
      data: {
        userId: user.id,
        razorpayOrderId: order.id,
        amount: planConfig.amount,
        currency: 'INR',
        status: 'created',
        plan,
        receipt,
      },
    })

    // Step 6: Return order details to the frontend
    return NextResponse.json({
      orderId: order.id,
      amount: planConfig.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      planLabel: planConfig.label,
      description: planConfig.description,
      receipt,
      prefill: {
        name: user.name || '',
        email: user.email,
      },
    })
  } catch (e: any) {
    console.error('[payment/create-order] error:', e)
    return NextResponse.json(
      { error: e.message || 'Failed to create payment order' },
      { status: 500 },
    )
  }
}

// Lightweight user fetch — calls internal /api/auth/me
async function getCurrentUser(req: NextRequest) {
  try {
    const url = new URL('/api/auth/me', req.nextUrl.origin).toString()
    const res = await fetch(url, {
      headers: { cookie: req.headers.get('cookie') || '' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}
