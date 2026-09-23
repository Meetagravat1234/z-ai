import { NextResponse } from 'next/server'
import { checkRateLimit, recordAiUse, formatRateLimitError } from './rate-limit'

/**
 * Helper: apply rate limit to an AI endpoint.
 *
 * Usage in your route:
 * ```
 * const user = await getCurrentUser(req)
 * // ... existing paywall check ...
 * const rateLimit = applyRateLimit(user, 'resumeOptimizations')
 * if (rateLimit) return rateLimit  // 429 response
 * // ... proceed with AI call ...
 * recordAiUse(user.id, 'resumeOptimizations')  // call AFTER success
 * ```
 *
 * Returns:
 *   - null if allowed → proceed with the request
 *   - NextResponse (429) if rate-limited → return this immediately
 */
export function applyRateLimit(
  user: { id: string; subscriptionTier?: string | null; role?: string | null } | null,
  toolName: string,
): NextResponse | null {
  // Anonymous users (no login) — use IP or session ID, but we don't have that
  // easily here. Fall back to a shared "anonymous" bucket, which means all
  // anonymous users share a single 10/hour limit. This is acceptable because
  // AI tools require login (paywall check happens first).
  const userId = user?.id || 'anonymous'
  const tier = (user?.role === 'admin'
    ? 'admin'
    : (user?.subscriptionTier as 'free' | 'pro' | 'recruiter' | 'admin')) || 'free'

  const result = checkRateLimit(userId, toolName, tier)
  if (!result.ok) {
    return NextResponse.json(
      {
        error: formatRateLimitError(result.resetAt),
        rateLimited: true,
        retryAfterSeconds: Math.ceil((result.resetAt - Date.now()) / 1000),
        limit: result.limit,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      },
    )
  }

  return null
}
