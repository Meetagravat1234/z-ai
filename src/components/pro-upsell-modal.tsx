'use client'

import * as React from 'react'
import Link from 'next/link'
import { X, Crown, Check, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProUpsellModalProps {
  open: boolean
  toolLabel: string  // 'AI Resume Optimizer' etc.
  used: number       // how many uses consumed
  limit: number      // free tier limit (1)
  onClose: () => void
}

/**
 * ProUpsellModal — replaces the AdGate modal.
 *
 * When a free user exhausts their monthly quota (1 use per AI tool),
 * this modal appears instead of "watch an ad". It shows:
 * - What they've used (1/1 free uses this month)
 * - What Pro unlocks (10x uses, no limits)
 * - 3 pricing tiers with "Upgrade" buttons
 * - Clear value proposition
 *
 * This is a pure lead-conversion flow:
 *   Free user → uses tool once → hits limit → sees Pro upsell → converts to Pro
 */
export function ProUpsellModal({ open, toolLabel, used, limit, onClose }: ProUpsellModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-500/10 to-primary/10 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-black/10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Unlock More Uses</h3>
              <p className="text-xs text-muted-foreground">You've used your free {toolLabel} for this month</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">{used}/{limit}</strong> free uses consumed this month.
            Upgrade to Pro for <strong className="text-primary">10x more uses</strong> + premium features.
          </div>
        </div>

        {/* Body — Pro benefits */}
        <div className="p-6">
          <div className="space-y-2 mb-5">
            {[
              '10 uses per AI tool per month (was 1)',
              'Unlimited PDF + Word resume downloads',
              'AI Job Match Score on every job',
              'Unlimited saved jobs + application tracker',
              'Priority email job alerts (daily)',
              'No ads, no limits — just results',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-foreground/90">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Monthly */}
            <Link
              href="/upgrade"
              className="block rounded-2xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Monthly</div>
              <div className="text-2xl font-extrabold">₹299</div>
              <div className="text-xs text-muted-foreground">per month</div>
              <div className="mt-2 text-xs font-semibold text-primary flex items-center gap-1">
                <Zap className="w-3 h-3" /> Upgrade →
              </div>
            </Link>
            {/* Annual — best value */}
            <Link
              href="/upgrade"
              className="block rounded-2xl border-2 border-violet-500/40 bg-violet-500/5 p-4 hover:shadow-lg hover:border-violet-500/60 transition-all relative"
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-primary text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                Save 30%
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Annual</div>
              <div className="text-2xl font-extrabold">₹2,499</div>
              <div className="text-xs text-muted-foreground">per year</div>
              <div className="mt-2 text-xs font-semibold text-violet-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Best Value →
              </div>
            </Link>
          </div>

          {/* CTA */}
          <Link
            href="/upgrade"
            className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity"
          >
            Upgrade to Pro Now →
          </Link>

          <p className="text-[10px] text-muted-foreground text-center mt-3">
            7-day money-back guarantee · Cancel anytime · UPI, Card, Net Banking accepted
          </p>
        </div>
      </div>
    </div>
  )
}
