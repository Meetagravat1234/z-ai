'use client'

import * as React from 'react'
import Link from 'next/link'
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

  // Don't show for anonymous users or demo users
  if (!user || isDemo) return null

  // Check if user has used any AI tool
  const hasUsedAi =
    (user as any).resumeOptimizationsUsed > 0 ||
    (user as any).atsChecksUsed > 0 ||
    (user as any).coverLettersUsed > 0 ||
    (user as any).mockInterviewsUsed > 0 ||
    (user as any).skillGapAnalysesUsed > 0 ||
    (user as any).salaryPredictionsUsed > 0

  if (hasUsedAi || dismissed) return null

  function dismiss() {
    localStorage.setItem('tryAiBannerDismissed', String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className="mx-4 lg:mx-6 mt-4 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border border-primary/30 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">
          🎁 You have 1 FREE resume optimization waiting
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Try our AI tools — tailor your resume, check ATS score, or practice interviews. Free for life.
        </div>
      </div>
      <Link
        href="/ai-tools/resume-optimizer"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shrink-0"
      >
        Try Now
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
      <button
        onClick={dismiss}
        className="p-1.5 rounded-lg hover:bg-muted shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}
