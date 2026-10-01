/**
 * Subscription + paywall logic for Hirebase.
 *
 * Tiers:
 *   - free:      limited AI usage (3 ATS checks, 1 per other tool per month), unlimited job browsing
 *   - starter:   ₹99/month — 5 uses per tool, basic templates (new tier for price-sensitive Indian market)
 *   - pro:       ₹299/month (or ₹149 first month launch offer) — 10/month per AI tool + all templates
 *   - recruiter: ₹4,999/month — post jobs + see applicants + featured listings
 *
 * Usage limits per tier:
 *   - Free:      3 ATS checks, 1 resume opt, 1 cover letter, 1 mock interview, 1 skill gap, 1 salary prediction per month
 *   - Starter:   5 per tool per month + 2 free templates
 *   - Pro:       10 per tool per month + all 10 templates + unlimited PDF downloads
 *   - Recruiter: Same as Pro + unlimited job posts + candidate search
 */

import { db } from '@/lib/db'
import { verifyAdToken, verifyAdTokenLoose, getUserIdentifier } from '@/lib/ad-gate'
import type { NextRequest } from 'next/server'

export type Tier = 'free' | 'starter' | 'pro' | 'recruiter'

// ============================================================
// Pricing constants — keep in sync with /upgrade + /pricing pages
// ============================================================
export const PRICING = {
  starter_monthly: {
    amount: 9900, // ₹99/month in paise
    label: 'Starter Monthly',
    durationDays: 30,
    description: '5 AI tool uses per tool per month + 2 free templates',
  },
  pro_monthly: {
    amount: 14900, // ₹149/month LAUNCH OFFER (was ₹299) in paise
    originalAmount: 29900, // Show original price for strikethrough
    label: 'Pro Monthly (Launch Offer)',
    durationDays: 30,
    description: '10 AI tool uses per tool per month + all templates + PDF downloads',
  },
  pro_annual: {
    amount: 79900, // ₹799/year LAUNCH OFFER (was ₹2,499) in paise
    originalAmount: 249900, // Show original price for strikethrough
    label: 'Pro Annual (Launch Offer)',
    durationDays: 365,
    description: 'Best value — 12 months for the price of ~5. Save 68%!',
  },
  recruiter_monthly: {
    amount: 499900, // ₹4,999/month in paise
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
  atsChecks: 3, // 3 free ATS checks per month (was 1)
  skillGapAnalyses: 1,
  salaryPredictions: 1,
  // Resume/cover-letter download exports (1 free per month, then ad-gate OR upgrade)
  pdfDownloads: 1,
  docxDownloads: 1,
}

// Starter tier monthly limits per AI tool
export const STARTER_TIER_LIMITS = {
  resumeOptimizations: 5,
  coverLetters: 5,
  mockInterviews: 5,
  atsChecks: 15,
  skillGapAnalyses: 5,
  salaryPredictions: 15,
  pdfDownloads: 10,
  docxDownloads: 10,
}

// Pro tier monthly limits per AI tool
export const PRO_TIER_LIMITS = {
  resumeOptimizations: 10,
  coverLetters: 10,
  mockInterviews: 10,
  atsChecks: 50, // ATS check is quick — give more
  skillGapAnalyses: 10,
  salaryPredictions: 50,
  pdfDownloads: 50, // 50 PDF downloads per month for Pro
  docxDownloads: 50, // 50 DOCX downloads per month for Pro
}

// ============================================================
// Tier helpers — read-only
// ============================================================
export function isPaidUser(user: any): boolean {
  if (!user) return false
  if (user.subscriptionTier !== 'starter' && user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'recruiter') return false
  // Subscription expired?
  if (!user.subscriptionEndsAt) return false
  if (new Date(user.subscriptionEndsAt) < new Date()) return false
  return true
}

export function tierLabel(user: any): string {
  if (!user) return 'Free'
  if (user.subscriptionTier === 'starter' && isPaidUser(user)) return 'Starter'
  if (user.subscriptionTier === 'pro' && isPaidUser(user)) return 'Pro'
  if (user.subscriptionTier === 'recruiter' && isPaidUser(user)) return 'Recruiter'
  return 'Free'
}

// Alias for backward compatibility — isProUser now includes starter + pro + recruiter
export function isProUser(user: any): boolean {
  return isPaidUser(user)
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
  | 'pdfDownloads'
  | 'docxDownloads'

// Map tool name → DB field name + free/pro limits
const TOOL_CONFIG: Record<ToolKey, { field: string; label: string }> = {
  resumeOptimizations: { field: 'resumeOptimizationsUsed', label: 'AI Resume Optimizer' },
  coverLetters: { field: 'coverLettersUsed', label: 'AI Cover Letter' },
  mockInterviews: { field: 'mockInterviewsUsed', label: 'AI Mock Interview' },
  atsChecks: { field: 'atsChecksUsed', label: 'ATS Score Checker' },
  skillGapAnalyses: { field: 'skillGapAnalysesUsed', label: 'Skill Gap Analyzer' },
  salaryPredictions: { field: 'salaryPredictionsUsed', label: 'Salary Predictor' },
  pdfDownloads: { field: 'pdfDownloadsUsed', label: 'PDF Download' },
  docxDownloads: { field: 'docxDownloadsUsed', label: 'Word Document Download' },
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

  const isPaid = isPaidUser(user)
  let limit: number
  if (isPaid) {
    limit = user.subscriptionTier === 'starter' ? STARTER_TIER_LIMITS[tool] : PRO_TIER_LIMITS[tool]
  } else {
    limit = FREE_TIER_LIMITS[tool]
  }
  const pro = isPaid // Keep variable name for compatibility with existing code

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
        pdfDownloadsUsed: true,
        docxDownloadsUsed: true,
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
          pdfDownloadsUsed: 0,
          docxDownloadsUsed: 0,
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
 * Check whether the user can use a given AI tool — with ad-gate fallback.
 *
 * Logic (in order):
 *   1. Pro/Recruiter users → always allowed (no ad, no quota)
 *   2. Free users with remaining monthly quota → allowed (consumes quota)
 *   3. Free users with exhausted quota + valid ad token → allowed (ad-watched = free use, doesn't consume quota)
 *   4. Otherwise → not allowed, returns `requiresAd: true` so frontend can show AdGate modal
 *
 * Usage in API routes:
 *   const user = await getCurrentUser(req)
 *   const adToken = new URL(req.url).searchParams.get('adToken') || undefined
 *   const usage = await canUseAIToolWithAdGate('resumeOptimizations', user, adToken, req)
 *   if (!usage.allowed) {
 *     return res.status(403).json({ error: usage.message, requiresAd: usage.requiresAd })
 *   }
 *   // ... do the AI work ...
 *   // Only increment usage if NOT ad-gated (ad-watched uses don't consume quota)
 *   if (!usage.adWatched && user?.id) {
 *     await incrementUsage('resumeOptimizations', user.id)
 *   }
 */
export async function canUseAIToolWithAdGate(
  tool: ToolKey,
  user: any,
  adToken?: string | null,
  req?: Request,
): Promise<UsageCheckResult & { requiresAd?: boolean; adWatched?: boolean }> {
  // Pro users skip everything
  if (isProUser(user)) {
    const baseCheck = await canUseAITool(tool, user)
    return { ...baseCheck, adWatched: false }
  }

  // Demo users (not signed in via real NextAuth) — must watch ad
  // They don't have a user.id, so we use IP as identifier
  // (Real anonymous users also fall here — they can use ad-gate without signup)

  // Check if ad token is valid
  if (adToken && req) {
    // Use LOOSE verification for everyone (logged-in AND anonymous).
    // The token was issued with IP as identifier (from getUserIdentifier),
    // but on Vercel serverless, the IP can differ between API calls.
    // Strict verification (checking user.id) fails because the token
    // contains IP, not user.id. The 5-minute expiry is sufficient safeguard.
    if (verifyAdTokenLoose(adToken, tool)) {
      return {
        allowed: true,
        used: 0,
        limit: 999,
        remaining: 999,
        isPro: false,
        tool,
        adWatched: true,
      }
    }
  }

  // Fall back to normal usage check
  const baseCheck = await canUseAITool(tool, user)

  // If usage check allows (e.g., user has remaining free quota) → allow without ad
  if (baseCheck.allowed) {
    return { ...baseCheck, requiresAd: false, adWatched: false }
  }

  // If user is unauthenticated or demo — DON'T show the "quota exhausted" modal.
  // Instead, return the "please sign in" message from canUseAITool without
  // setting requiresAd=true. The client will show the error message directly.
  if (baseCheck.reason === 'unauthenticated' || baseCheck.reason === 'demo_user') {
    return {
      ...baseCheck,
      requiresAd: false,  // Don't trigger ProUpsellModal — show error instead
      adWatched: false,
    }
  }

  // Otherwise, the user has used their free quota — show the ad/upgrade modal
  return {
    ...baseCheck,
    requiresAd: true,
    adWatched: false,
    message: 'You have used your free monthly quota for this AI tool. Upgrade to Pro for 10x more uses per month.',
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
      pdfDownloadsUsed: 0,
      docxDownloadsUsed: 0,
      usageResetAt: new Date(),
    },
  })

  return { endsAt: newEndsAt, tier }
}
