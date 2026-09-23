/**
 * In-memory rate limiter for AI endpoints.
 *
 * User-friendly limits: enough for legitimate use, blocks script-spam.
 *
 * Why in-memory (not Upstash/Redis)?
 * - Zero external dependencies, zero cost
 * - Works on Vercel Hobby plan
 * - Per-instance limit (not global) — slightly less strict, which is GOOD
 *   for user-friendliness. Vercel auto-scales instances, so the effective
 *   limit per user is the per-instance limit × instance count.
 *
 * Limits (per user, per tool, per instance):
 *   - Free users: 10 calls / hour per AI tool (resume-optimize, cover-letter, etc.)
 *   - Pro users: 30 calls / hour per AI tool
 *   - Admin: unlimited
 *
 * This is IN ADDITION to the monthly quota system in subscription.ts.
 * Monthly quota = total budget; rate limit = burst protection.
 *
 * When limit is exceeded, returns 429 with a friendly message.
 */

interface RateBucket {
  count: number
  resetAt: number // epoch ms
}

// Map structure: rateLimitMap[userId][toolName] = RateBucket
const rateLimitMap = new Map<string, Map<string, RateBucket>>()

// Cleanup old entries every 10 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [userId, tools] of rateLimitMap.entries()) {
    for (const [tool, bucket] of tools.entries()) {
      if (now > bucket.resetAt) {
        tools.delete(tool)
      }
    }
    if (tools.size === 0) {
      rateLimitMap.delete(userId)
    }
  }
}

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number // epoch ms
  limit: number
}

/**
 * Check rate limit for a user + tool combination.
 * Returns { ok: true } if allowed, { ok: false, resetAt } if rate-limited.
 *
 * Does NOT increment — call `recordAiUse()` after a successful AI call to
 * increment the counter. This way, failed AI calls don't count against quota.
 */
export function checkRateLimit(
  userId: string,
  toolName: string,
  tier: 'free' | 'pro' | 'recruiter' | 'admin',
): RateLimitResult {
  cleanup()

  // Admin = unlimited
  if (tier === 'admin') {
    return { ok: true, remaining: Infinity, resetAt: 0, limit: Infinity }
  }

  const limit = tier === 'pro' || tier === 'recruiter' ? 30 : 10 // calls per hour
  const windowMs = 60 * 60 * 1000 // 1 hour

  let userMap = rateLimitMap.get(userId)
  if (!userMap) {
    userMap = new Map()
    rateLimitMap.set(userId, userMap)
  }

  const now = Date.now()
  let bucket = userMap.get(toolName)
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs }
    userMap.set(toolName, bucket)
  }

  const remaining = Math.max(0, limit - bucket.count)

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      limit,
    }
  }

  return {
    ok: true,
    remaining: remaining - 1, // preview what will be left after this call
    resetAt: bucket.resetAt,
    limit,
  }
}

/**
 * Record a successful AI call. Call this AFTER the AI call succeeds.
 * Failed calls don't count against the user's rate limit.
 */
export function recordAiUse(userId: string, toolName: string) {
  let userMap = rateLimitMap.get(userId)
  if (!userMap) {
    userMap = new Map()
    rateLimitMap.set(userId, userMap)
  }

  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  let bucket = userMap.get(toolName)
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs }
    userMap.set(toolName, bucket)
  }

  bucket.count++
}

/**
 * Format a friendly error message for the user when rate-limited.
 * Returns minutes until reset.
 */
export function formatRateLimitError(resetAt: number): string {
  const minutesLeft = Math.ceil((resetAt - Date.now()) / 60000)
  if (minutesLeft <= 1) return 'Rate limit reached. Try again in 1 minute.'
  return `Rate limit reached. Try again in ${minutesLeft} minutes (or upgrade to Pro for 3x higher limits).`
}
