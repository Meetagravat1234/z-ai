'use client'

import * as React from 'react'
import Link from 'next/link'
import { X, Play, Check, Loader2, Sparkles, Crown, FileText, Mic, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AD_GATE_COUNTDOWN_SECONDS } from '@/lib/ad-gate'

interface AdGateModalProps {
  open: boolean
  tool: string  // 'resumeOptimizations' | 'coverLetters' | etc.
  toolLabel: string  // 'AI Resume Optimizer' | etc.
  onClose: () => void
  onAdWatched: (token: string) => void  // Called when countdown completes + token issued
}

/**
 * AdGateModal — shows a 15-second "ad" (currently internal promo, will swap to
 * AdSense when approved) before unlocking a single AI tool use.
 *
 * Flow:
 *   1. User clicks "Watch ad to continue" → countdown starts
 *   2. After 15 seconds, "Continue" button enables
 *   3. User clicks "Continue" → calls /api/ad-gate/issue-token → gets JWT
 *   4. onAdWatched(token) called → parent retries AI call with ?adToken=xxx
 *
 * The "ad" content is currently internal Hirebase promos. To switch to real ads:
 *   - Replace the <AdContent> component with <ins className="adsbygoogle" ...>
 *   - Or use a different ad network (Monetag, Adsterra) by injecting their script
 */
export function AdGateModal({ open, tool, toolLabel, onClose, onAdWatched }: AdGateModalProps) {
  const [phase, setPhase] = React.useState<'idle' | 'watching' | 'done' | 'issuing'>('idle')
  const [countdown, setCountdown] = React.useState(AD_GATE_COUNTDOWN_SECONDS)
  const [error, setError] = React.useState('')
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setPhase('idle')
      setCountdown(AD_GATE_COUNTDOWN_SECONDS)
      setError('')
    } else {
      // Cleanup interval on close
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [open])

  function startWatching() {
    setPhase('watching')
    setCountdown(AD_GATE_COUNTDOWN_SECONDS)
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setPhase('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function continueAfterAd() {
    setPhase('issuing')
    setError('')
    try {
      const res = await fetch('/api/ad-gate/issue-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to issue ad token')
      onAdWatched(data.token)
    } catch (e: any) {
      setError(e.message)
      setPhase('done')  // Let user retry Continue
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h3 className="font-bold">Watch a 15-second ad to continue</h3>
          </div>
          {phase === 'idle' && (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {phase === 'idle' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You have used your free <strong>{toolLabel}</strong> for this month.
                Watch a 15-second ad to get one more free use, or upgrade to Pro for 10 uses per month.
              </p>
              <button
                onClick={startWatching}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90"
              >
                <Play className="w-4 h-4" />
                Watch ad to continue
              </button>
              <Link
                href="/upgrade"
                className="block mt-4 text-xs text-muted-foreground hover:text-primary"
              >
                Or upgrade to Pro (₹299/month) →
              </Link>
            </div>
          )}

          {phase === 'watching' && (
            <div className="text-center">
              <AdContent tool={toolLabel} />
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="text-xs font-bold text-violet-600">
                  Ad ends in {countdown}s…
                </div>
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-1000 ease-linear"
                    style={{ width: `${((AD_GATE_COUNTDOWN_SECONDS - countdown) / AD_GATE_COUNTDOWN_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Please wait — you can close this after the countdown.
              </p>
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-1">Ad finished!</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Click below to use <strong>{toolLabel}</strong> for free.
              </p>
              {error && (
                <div className="text-xs text-rose-600 mb-3">{error}</div>
              )}
              <button
                onClick={continueAfterAd}
                disabled={phase === 'issuing'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
              >
                {phase === 'issuing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {phase === 'issuing' ? 'Unlocking…' : 'Continue to AI tool'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/30 border-t border-border text-center">
          <p className="text-[10px] text-muted-foreground">
            Ad revenue keeps Hirebase free for job seekers.{' '}
            <Link href="/upgrade" className="text-primary hover:underline">Go Pro</Link> to skip ads.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * The "ad" content shown during countdown.
 *
 * Currently shows internal Hirebase promos (rotating).
 * To use real AdSense ads: replace this with:
 *   <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-xxx" data-ad-slot="yyy" />
 * And add the AdSense script to layout.tsx.
 */
function AdContent({ tool }: { tool: string }) {
  // Rotate between 4 promos — picks one at random per render
  const promos = [
    {
      icon: Crown,
      title: 'Upgrade to Hirebase Pro',
      desc: '10× AI tool usage + unlimited saved jobs + daily alerts + PDF export. From ₹299/month.',
      cta: 'See Pro plans →',
      href: '/upgrade',
      color: 'from-violet-500/15 to-primary/15',
      borderColor: 'border-violet-500/30',
    },
    {
      icon: FileText,
      title: 'Read: Software Engineer Salary in Bengaluru 2026',
      desc: 'Real salary data by experience + tech stack + company type. ₹3.5-45 LPA ranges explained.',
      cta: 'Read article →',
      href: '/insights/software-engineer-salary-bengaluru-2026',
      color: 'from-emerald-500/15 to-cyan-500/15',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: Mic,
      title: 'Read: Amazon SDE Interview Preparation',
      desc: 'Real coding questions + 16 Leadership Principles + 8-week prep plan. Verified by ex-Amazonians.',
      cta: 'Read article →',
      href: '/insights/amazon-sde-interview-preparation',
      color: 'from-amber-500/15 to-orange-500/15',
      borderColor: 'border-amber-500/30',
    },
    {
      icon: Wallet,
      title: 'Browse 300+ verified jobs in Bengaluru',
      desc: 'Software, data, product, design roles at Google, Microsoft, Amazon, Flipkart, Swiggy + more.',
      cta: 'Browse jobs →',
      href: '/jobs/bengaluru',
      color: 'from-rose-500/15 to-pink-500/15',
      borderColor: 'border-rose-500/30',
    },
  ]
  const [idx] = React.useState(Math.floor(Math.random() * promos.length))
  const promo = promos[idx]
  const Icon = promo.icon

  return (
    <Link
      href={promo.href}
      target="_blank"
      className={cn(
        'block rounded-2xl border-2 p-5 bg-gradient-to-br',
        promo.color,
        promo.borderColor,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Sponsored
          </div>
          <h4 className="font-bold text-sm leading-snug">{promo.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{promo.desc}</p>
          <div className="mt-2 text-xs font-semibold text-primary">{promo.cta}</div>
        </div>
      </div>
    </Link>
  )
}
