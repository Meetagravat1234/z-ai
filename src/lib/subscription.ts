/**
 * Subscription + paywall logic for Hirebase.
 *
 * Two tiers:
 *   - free:      limited AI usage (1 per tool per month), unlimited job browsing
 *   - pro:       10/month per AI tool + premium features (₹299/month or ₹2,499/year)
 *   - recruiter: future (post jobs, see applicants)
 *
 * Usage limits per tier:
 *   - Free:      1 resume optimization, 1 cover letter, 1 mock interview, 1 ATS check, 1 skill gap, 1 salary prediction per month
 *   - Pro:       10 per tool per month (we cap to prevent abuse — can be raised)
 *   - Recruiter: unlimited (treated same as Pro for AI tools)
 *
 * Counters are reset monthly via `usageResetAt` field. The check happens in two places:
 *   1. Server-side (in API routes): authoritatively checks + increments the counter
 *   2. Client-side (in components): shows remaining quota to user + Upgrade CTA
 *
 * Note: Demo users (isDemo = true) are treated as Free users but with NO usage allowed
 * (must sign up to use any AI tool, even the free one).
 */

import { db } from '@/lib/db'

export type Tier = 'free' | 'pro' | 'recruiter'

// ============================================================
// Pricing constants — keep in sync with /upgrade + /pricing pages
// ============================================================
export const PRICING = {
  pro_monthly: {
    amount: 29900, // ₹299 in paise
    label: 'Pro Monthly',
    durationDays: 30,
    description: '10 AI tool uses per tool per month + premium features',
  },
  pro_annual: {
    amount: 249900, // ₹2,499 in paise (saves 30% vs monthly)
    label: 'Pro Annual',
    durationDays: 365,
    description: 'Best value — 12 months for the price of ~8',
  },
  recruiter_monthly: {
    amount: 499900, // ₹4,999 in paise
    label: 'Recruiter Monthly',
    durationDays: 30,
    description: 'Post unlimited jobs + see applicants + featured listings',
  },
} as const

export type PlanId = keyof typeof PRICING

// Free tier monthly limits per AI tool
export const FREE_TIER_LIMITS = {
  resumeOptimizations: 1,
  coverLetters: 1,
  mockInterviews: 1,
  atsChecks: 1,
  skillGapAnalyses: 1,
  salaryPredictions: 1,
}

// Pro tier monthly limits per AI tool
export const PRO_TIER_LIMITS = {
  resumeOptimizations: 10,
  coverLetters: 10,
  mockInterviews: 10,
  atsChecks: 50, // ATS check is quick — give more
  skillGapAnalyses: 10,
  salaryPredictions: 50,
}

// ============================================================
// Tier helpers — read-only
// ============================================================
export function isProUser(user: any): boolean {
  if (!user) return false
  if (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'recruiter') return false
  // Subscription expired?
  if (!user.subscriptionEndsAt) return false
  if (new Date(user.subscriptionEndsAt) < new Date()) return false
  return true
}

export function tierLabel(user: any): string {
  if (!user) return 'Free'
  if (isProUser(user)) {
    return user.subscriptionTier === 'recruiter' ? 'Recruiter Pro' : 'Pro'
  }
  return 'Free'
}

export function daysUntilExpiry(user: any): number | null {
  if (!isProUser(user) || !user.subscriptionEndsAt) return null
  const ms = new Date(user.subscriptionEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

// ============================================================
// Usage helpers — read + increment counters
// ============================================================
type ToolKey =
  | 'resumeOptimizations'
  | 'coverLetters'
  | 'mockInterviews'
  | 'atsChecks'
  | 'skillGapAnalyses'
  | 'salaryPredictions'

// Map tool name → DB field name + free/pro limits
const TOOL_CONFIG: Record<ToolKey, { field: string; label: string }> = {
  resumeOptimizations: { field: 'resumeOptimizationsUsed', label: 'AI Resume Optimizer' },
  coverLetters: { field: 'coverLettersUsed', label: 'AI Cover Letter' },
  mockInterviews: { field: 'mockInterviewsUsed', label: 'AI Mock Interview' },
  atsChecks: { field: 'atsChecksUsed', label: 'ATS Score Checker' },
  skillGapAnalyses: { field: 'skillGapAnalysesUsed', label: 'Skill Gap Analyzer' },
  salaryPredictions: { field: 'salaryPredictionsUsed', label: 'Salary Predictor' },
}

export interface UsageCheckResult {
  allowed: boolean
  reason?: 'unauthenticated' | 'demo_user' | 'limit_reached' | 'expired'
  message?: string
  used: number
  limit: number
  remaining: number
  isPro: boolean
  tool: ToolKey
}

/**
 * Check whether the user can use a given AI tool.
 * Returns full context so the UI can show appropriate messaging.
 *
 * Usage:
 *   const check = await canUseAITool('resumeOptimizations', user)
 *   if (!check.allowed) {
 *     return res.status(403).json({ error: check.message, requiresUpgrade: true })
 *   }
 *   // ... do the AI work ...
 *   await incrementUsage('resumeOptimizations', user.id)
 */
export async function canUseAITool(
  tool: ToolKey,
  user: any,
): Promise<UsageCheckResult> {
  // Unauthenticated — caller should require auth before this is called
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated',
      message: 'Please sign in to use this AI tool.',
      used: 0,
      limit: 0,
      remaining: 0,
      isPro: false,
      tool,
    }
  }

  // Demo users (not signed in via real NextAuth) get zero usage — must sign up first
  if ((user as any).isDemo) {
    return {
      allowed: false,
      reason: 'demo_user',
      message: 'Please create a free account to try this AI tool. Free tier includes 1 use per month.',
      used: 0,
      limit: FREE_TIER_LIMITS[tool],
      remaining: FREE_TIER_LIMITS[tool],
      isPro: false,
      tool,
    }
  }

  const pro = isProUser(user)
  const limit = pro ? PRO_TIER_LIMITS[tool] : FREE_TIER_LIMITS[tool]

  // Fetch fresh usage counter from DB (don't trust potentially-stale session data)
  let used = 0
  try {
    const fresh = await db.user.findUnique({
      where: { id: user.id },
      select: {
        resumeOptimizationsUsed: true,
        coverLettersUsed: true,
        mockInterviewsUsed: true,
        atsChecksUsed: true,
        skillGapAnalysesUsed: true,
        salaryPredictionsUsed: true,
        usageResetAt: true,
        subscriptionTier: true,
        subscriptionEndsAt: true,
      },
    })
    if (!fresh) {
      return {
        allowed: false,
        reason: 'unauthenticated',
        message: 'User not found. Please sign in again.',
        used: 0, limit: 0, remaining: 0, isPro: false, tool,
      }
    }

    // Reset monthly counters if it's a new month
    const now = new Date()
    const resetAt = new Date(fresh.usageResetAt)
    const monthsSinceReset =
      (now.getFullYear() - resetAt.getFullYear()) * 12 +
      (now.getMonth() - resetAt.getMonth())
    if (monthsSinceReset >= 1 || now.getTime() - resetAt.getTime() > 35 * 24 * 60 * 60 * 1000) {
      await db.user.update({
        where: { id: user.id },
        data: {
          resumeOptimizationsUsed: 0,
          coverLettersUsed: 0,
          mockInterviewsUsed: 0,
          atsChecksUsed: 0,
          skillGapAnalysesUsed: 0,
          salaryPredictionsUsed: 0,
          usageResetAt: now,
        },
      })
      used = 0
    } else {
      used = (fresh as any)[TOOL_CONFIG[tool].field] || 0
    }
  } catch (e) {
    console.error('[subscription] canUseAITool: DB fetch failed', e)
    // Fail open (allow use) so DB hiccups don't block paying users
    used = 0
  }

  const remaining = Math.max(0, limit - used)
  const allowed = used < limit

  return {
    allowed,
    reason: allowed ? undefined : 'limit_reached',
    message: allowed
      ? undefined
      : pro
        ? `You have used all ${limit} ${TOOL_CONFIG[tool].label} uses this month. Resets on the 1st of next month.`
        : `You have used your free ${TOOL_CONFIG[tool].label} for this month. Upgrade to Pro for ${PRO_TIER_LIMITS[tool]} uses per month.`,
    used,
    limit,
    remaining,
    isPro: pro,
    tool,
  }
}

/**
 * Increment the usage counter for a tool. Call this AFTER a successful AI call.
 * Skips incrementing if the call failed — caller should only call on success.
 */
export async function incrementUsage(tool: ToolKey, userId: string): Promise<void> {
  const field = TOOL_CONFIG[tool].field
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        [field]: { increment: 1 },
      },
    })
  } catch (e) {
    console.error('[subscription] incrementUsage: DB update failed', e)
    // Don't throw — usage tracking is best-effort. User already used the tool.
  }
}

// ============================================================
// After-payment subscription activation
// ============================================================

/**
 * Activate a Pro/Recruiter subscription after successful payment.
 * Sets subscriptionTier + extends subscriptionEndsAt by the plan duration.
 * If user already has an active subscription, extends it instead of replacing.
 */
export async function activateSubscription(
  userId: string,
  plan: PlanId,
): Promise<{ endsAt: Date; tier: 'pro' | 'recruiter' }> {
  const config = PRICING[plan]
  const tier: 'pro' | 'recruiter' = plan.startsWith('recruiter') ? 'recruiter' : 'pro'

  // Get current state
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionEndsAt: true, subscriptionTier: true },
  })

  // If user is already pro and subscription is still active, EXTEND from current end date
  // Otherwise start fresh from now
  const baseDate =
    user?.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date()
      ? new Date(user.subscriptionEndsAt)
      : new Date()

  const newEndsAt = new Date(baseDate)
  newEndsAt.setDate(newEndsAt.getDate() + config.durationDays)

  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
      subscriptionEndsAt: newEndsAt,
      // Reset usage counters on upgrade
      resumeOptimizationsUsed: 0,
      coverLettersUsed: 0,
      mockInterviewsUsed: 0,
      atsChecksUsed: 0,
      skillGapAnalysesUsed: 0,
      salaryPredictionsUsed: 0,
      usageResetAt: new Date(),
    },
  })

  return { endsAt: newEndsAt, tier }
}
