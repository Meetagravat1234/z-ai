/**
 * Ad-gate system — temporary monetization before Razorpay is set up.
 *
 * How it works:
 * 1. Free user uses AI tool once (free quota)
 * 2. After free quota exhausted, AI route returns 403 with { requiresAd: true }
 * 3. Frontend shows AdGateModal with 15-second countdown
 * 4. User watches "ad" (currently internal promo, will swap to AdSense later)
 * 5. After countdown, frontend calls /api/ad-gate/issue-token to get a signed JWT
 * 6. Frontend retries AI call with ?adToken=xxx
 * 7. Server verifies token signature + expiry → bypasses paywall
 *
 * Token is valid for 5 minutes, single-use per tool (we don't enforce single-use
 * server-side to keep it simple — the 5-min expiry is the safeguard).
 *
 * When AdSense is approved, just swap the AdGateModal content — the rest of the
 * infrastructure stays the same.
 */

import crypto from 'crypto'

const AD_GATE_SECRET =
  process.env.AD_GATE_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'hirebase-ad-gate-dev-secret-change-in-prod-2026'

const AD_GATE_TOKEN_TTL_SECONDS = 300 // 5 minutes
export const AD_GATE_COUNTDOWN_SECONDS = 15 // user watches ad for 15 seconds

// ============================================================
// Token issue / verify — server-side only
// ============================================================

export function issueAdToken(tool: string, userIdentifier: string): string {
  const payload = {
    tool,
    sub: userIdentifier,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + AD_GATE_TOKEN_TTL_SECONDS,
  }
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', AD_GATE_SECRET)
    .update(payloadStr)
    .digest('base64url')
  return `${payloadStr}.${signature}`
}

export function verifyAdToken(
  token: string | undefined | null,
  tool: string,
  userIdentifier: string,
): boolean {
  if (!token) return false
  try {
    const [payloadStr, signature] = token.split('.')
    if (!payloadStr || !signature) return false

    // Verify signature with timing-safe compare
    const expectedSig = crypto
      .createHmac('sha256', AD_GATE_SECRET)
      .update(payloadStr)
      .digest('base64url')
    const a = Buffer.from(expectedSig)
    const b = Buffer.from(signature)
    if (a.length !== b.length) return false
    if (!crypto.timingSafeEqual(a, b)) return false

    // Verify payload
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString())
    if (payload.tool !== tool) return false
    if (payload.sub !== userIdentifier) return false
    if (payload.exp < Math.floor(Date.now() / 1000)) return false

    return true
  } catch {
    return false
  }
}

/**
 * Get a stable user identifier for ad-gate.
 * - Logged-in users: their user ID (so token works across devices)
 * - Anonymous: their IP address (so token can't be shared between users)
 */
export function getUserIdentifier(req: Request): string {
  // Forwarded IP from Vercel/Cloudflare
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    // Take the first IP (client IP)
    return xff.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  // Fallback (local dev)
  return 'anonymous-' + (req.headers.get('user-agent') || 'unknown').slice(0, 50)
}
