'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, ArrowRight, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

/**
 * TryAiBanner — shows a prominent banner for logged-in users who haven't
 * tried any AI tools yet.
 *
 * Shown only when:
 *   - User is logged in (not demo)
 *   - User has 0 AI tool usage across all 6 tools
 *   - User hasn't dismissed the banner (localStorage)
 *
 * Hidden when:
 *   - User is not logged in (anonymous)
 *   - User has used at least 1 AI tool
 *   - User clicked the X button (dismissed for 7 days)
 */
export function TryAiBanner() {
  const { user, isDemo } = useAuth()
  const pathname = usePathname()
  const [dismissed, setDismissed] = React.useState(false)

  // Check localStorage on mount
  React.useEffect(() => {
    const dismissedAt = localStorage.getItem('tryAiBannerDismissed')
    if (dismissedAt) {
      const age = Date.now() - parseInt(dismissedAt, 10)
      // Re-show after 7 days
      if (age < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true)
      }
    }
  }, [])

  // Don't show banner on auth page (feels intrusive when user is already trying to sign up)
  // Don't show on job detail pages (user is focused on applying, not browsing AI tools)
  // Don't show on AI tools pages (user is already there)
  const isHiddenPage = pathname === '/auth' || 
    pathname?.includes('view=auth') ||
    pathname?.startsWith('/jobs/') || 
    pathname?.includes('/ai-tools/') ||
    pathname === '/profile' ||
    pathname === '/tracker'

  // Don't show for demo users (logged in but no session)
  if (isDemo || isHiddenPage) return null

  // Check if logged-in user has used any AI tool
  if (user) {
    const hasUsedAi =
      (user as any).resumeOptimizationsUsed > 0 ||
      (user as any).atsChecksUsed > 0 ||
      (user as any).coverLettersUsed > 0 ||
      (user as any).mockInterviewsUsed > 0 ||
      (user as any).skillGapAnalysesUsed > 0 ||
      (user as any).salaryPredictionsUsed > 0

    if (hasUsedAi || dismissed) return null
  }

  function dismiss() {
    localStorage.setItem('tryAiBannerDismissed', String(Date.now()))
    setDismissed(true)
  }

  // Different copy for logged-in vs anonymous users
  const isAnonymous = !user
  const bannerText = isAnonymous
    ? '🎁 Sign up free to unlock 6 AI tools — resume optimizer, ATS checker, mock interviews + more'
    : '🎁 You have 1 FREE resume optimization waiting'
  const ctaText = isAnonymous ? 'Sign Up Free' : 'Try Now'

  return (
    <div className="mx-2 sm:mx-4 lg:mx-6 mt-2 sm:mt-4 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border border-primary/30 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-xs sm:text-sm">
          {bannerText}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
          {isAnonymous
            ? 'No credit card required. Get 1 free use per tool per month.'
            : 'Try our AI tools — tailor your resume, check ATS score, or practice interviews. Free for life.'}
        </div>
      </div>
      <Link
        href={isAnonymous ? '/?view=auth' : '/ai-tools/resume-optimizer'}
        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-[11px] sm:text-xs font-semibold hover:opacity-90 shrink-0"
      >
        {ctaText}
        <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
      </Link>
      <button
        onClick={dismiss}
        className="p-1 sm:p-1.5 rounded-lg hover:bg-muted shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
      </button>
    </div>
  )
}
