/**
 * Razorpay client + helpers.
 *
 * Razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars.
 * For testing: use the test keys from https://dashboard.razorpay.com/app/keys
 * For production: switch to live keys (you'll need to complete KYC + business verification).
 *
 * Test cards (no real charge):
 *   - Card: 4111 1111 1111 1111, Exp: any future date, CVV: any
 *   - UPI: success@razorpay (test UPI ID)
 */
import Razorpay from 'razorpay'
import crypto from 'crypto'

let _instance: Razorpay | null = null

export function getRazorpay(): Razorpay | null {
  if (_instance) return _instance
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    console.warn('[razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — payments will fail')
    return null
  }
  _instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
  return _instance
}

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

/**
 * Verify the signature returned by Razorpay checkout.
 * Razorpay sends: razorpay_order_id + "|" + razorpay_payment_id
 * Server signs it with: HMAC-SHA256(key_secret, order_id + "|" + payment_id)
 * If signature matches, the payment is authentic.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    console.error('[razorpay] Cannot verify signature — RAZORPAY_KEY_SECRET not set')
    return false
  }
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(orderId + '|' + paymentId)
    .digest('hex')
  // Use timing-safe compare to prevent timing attacks
  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
