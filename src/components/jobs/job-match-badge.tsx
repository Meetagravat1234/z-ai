'use client'

import * as React from 'react'
import { Sparkles, Loader2, Lock, Target, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useNav } from '@/lib/nav-store'
import { cn } from '@/lib/utils'

interface MatchResult {
  score: number
  breakdown: {
    skillsMatch: number
    experienceMatch: number
    locationMatch: number
    roleMatch: number
  }
  matchedSkills: string[]
  missingSkills: string[]
  reasons: string[]
  suggestion: string
}

interface JobMatchBadgeProps {
  jobId: string
  className?: string
}

/**
 * AI-powered match score badge shown on job detail pages.
 * Loads lazily (only when the user scrolls into view OR after a 1.5s delay)
 * so it doesn't block the main job content from rendering.
 *
 * Behavior:
 * - If user is not logged in → show a "Sign in to see match" CTA.
 * - If user has no targetRole / skills → show "Complete profile" CTA.
 * - Otherwise → call /api/ai/job-match and render the score badge.
 *   Clicking the badge opens a popover with breakdown details.
 */
export function JobMatchBadge({ jobId, className }: JobMatchBadgeProps) {
  const { user, isDemo, loading: authLoading } = useAuth()
  const { go } = useNav()
  const [result, setResult] = React.useState<MatchResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [showDetail, setShowDetail] = React.useState(false)
  const fetchedRef = React.useRef(false)

  const canFetch = !!user && !isDemo && (user.targetRole || user.skills)

  React.useEffect(() => {
    if (fetchedRef.current || !canFetch || !jobId) return
    fetchedRef.current = true
    setLoading(true)
    setError('')
    fetch('/api/ai/job-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json()
          throw new Error(d.error || 'Failed to compute match')
        }
        return r.json()
      })
      .then((d) => {
        if (d.requiresAuth || d.needsProfile) return
        if (d.result) setResult(d.result)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [canFetch, jobId])

  // Show nothing while we're still checking auth
  if (authLoading) return null

  // Not logged in → show sign-in CTA
  if (!user || isDemo) {
    return (
      <button
        onClick={() => go('auth')}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/5 text-violet-600 text-xs font-semibold hover:bg-violet-500/10 transition-colors',
          className
        )}
      >
        <Lock className="w-3.5 h-3.5" />
        Sign in for AI match score
      </button>
    )
  }

  // Logged in but profile incomplete
  if (!user.targetRole && !user.skills) {
    return (
      <button
        onClick={() => go('profile')}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs font-semibold hover:bg-amber-500/10 transition-colors',
          className
        )}
      >
        <Target className="w-3.5 h-3.5" />
        Add profile skills for AI match
      </button>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted text-muted-foreground text-xs font-semibold',
          className
        )}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Computing your match…
      </div>
    )
  }

  // Error state
  if (error || !result) {
    return null
  }

  // Render the score badge
  const score = result.score
  const scoreColor =
    score >= 90
      ? 'bg-emerald-500 text-white'
      : score >= 75
      ? 'bg-emerald-500/90 text-white'
      : score >= 60
      ? 'bg-amber-500 text-white'
      : score >= 40
      ? 'bg-orange-500 text-white'
      : 'bg-rose-500 text-white'
  const scoreLabel =
    score >= 90 ? 'Excellent match' :
    score >= 75 ? 'Strong match' :
    score >= 60 ? 'Decent match' :
    score >= 40 ? 'Weak match' : 'Poor match'

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-transform hover:scale-105',
          scoreColor,
          className
        )}
        title="Click to see match breakdown"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="tabular-nums">{score}%</span>
        <span className="font-semibold opacity-90">{scoreLabel}</span>
      </button>

      {showDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <h3 className="font-bold">Your AI Match Score</h3>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1 rounded-md hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Score */}
              <div className="text-center">
                <div className={cn('inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-extrabold', scoreColor)}>
                  {score}
                </div>
                <p className="mt-2 font-semibold text-sm">{scoreLabel}</p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Breakdown</h4>
                {[
                  { label: 'Skills match', value: result.breakdown.skillsMatch },
                  { label: 'Experience match', value: result.breakdown.experienceMatch },
                  { label: 'Location match', value: result.breakdown.locationMatch },
                  { label: 'Role match', value: result.breakdown.roleMatch },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{b.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${b.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-8 text-right">{b.value}%</span>
                  </div>
                ))}
              </div>

              {/* Matched skills */}
              {result.matchedSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">✓ Skills you have</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkills.map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {result.missingSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">+ Skills to learn</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills.map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasons */}
              {result.reasons.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Why this score</h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {result.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestion */}
              {result.suggestion && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-semibold text-primary mb-1">💡 Suggestion</p>
                  <p className="text-sm text-foreground">{result.suggestion}</p>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                Powered by AI. Scores are estimates based on your profile vs. job requirements.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
