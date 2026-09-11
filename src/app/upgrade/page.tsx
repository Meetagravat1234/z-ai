'use client'

import * as React from 'react'
import Link from 'next/link'
import { SiteShell } from '@/components/layout/site-shell'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Check, Loader2, Crown, Zap, ArrowRight, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mirror of PRICING in /lib/subscription.ts — kept in sync manually
const PLANS = [
  {
    id: 'pro_monthly' as const,
    name: 'Pro Monthly',
    price: 299,
    period: '/month',
    description: 'Perfect for active job seekers',
    durationDays: 30,
    badge: null,
    savings: null,
    cta: 'Upgrade to Pro Monthly',
  },
  {
    id: 'pro_annual' as const,
    name: 'Pro Annual',
    price: 2499,
    period: '/year',
    description: 'Best value — save 30%',
    durationDays: 365,
    badge: 'BEST VALUE',
    savings: 'Save ₹1,089',
    cta: 'Upgrade to Pro Annual',
  },
  {
    id: 'recruiter_monthly' as const,
    name: 'Recruiter',
    price: 4999,
    period: '/month',
    description: 'For employers hiring in India',
    durationDays: 30,
    badge: null,
    savings: null,
    cta: 'Upgrade to Recruiter',
  },
]

// Features free vs pro
const FEATURES: Array<{ name: string; free: string; pro: string }> = [
  { name: 'Browse all jobs + companies', free: 'Unlimited', pro: 'Unlimited' },
  { name: 'Search + apply to jobs', free: 'Unlimited', pro: 'Unlimited' },
  { name: 'Read all blog articles', free: 'Unlimited', pro: 'Unlimited' },
  { name: 'AI Resume Optimizer', free: '1 / month', pro: '10 / month' },
  { name: 'ATS Score Checker', free: '1 / month', pro: '50 / month' },
  { name: 'AI Cover Letter', free: '1 / month', pro: '10 / month' },
  { name: 'AI Mock Interview', free: '1 / month', pro: '10 / month' },
  { name: 'Skill Gap Analyzer', free: '1 / month', pro: '10 / month' },
  { name: 'Salary Predictor', free: '1 / month', pro: '50 / month' },
  { name: 'AI Job Match Score', free: 'Not available', pro: 'On every job' },
  { name: 'Saved jobs', free: 'Max 10', pro: 'Unlimited' },
  { name: 'Application tracker', free: 'Max 5', pro: 'Unlimited' },
  { name: 'Email job alerts', free: '1 weekly digest', pro: 'Unlimited (daily + real-time)' },
  { name: 'PDF export (resume + cover letter)', free: '—', pro: 'Included' },
  { name: 'Saved search + RSS feed', free: '—', pro: 'Included' },
  { name: 'Priority indexing (new jobs emailed first)', free: '—', pro: 'Included' },
  { name: 'Customer support', free: 'Community', pro: 'Email priority within 24h' },
]

export default function UpgradePage() {
  const { user, isDemo, loading: authLoading } = useAuth()
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [success, setSuccess] = React.useState<{ plan: string; endsAt: string } | null>(null)

  async function handleUpgrade(planId: string) {
    if (!user || isDemo) {
      toast.info('Please sign in first to upgrade to Pro.')
      window.location.href = '/auth?next=/upgrade'
      return
    }
    setSelectedPlan(planId)
    setProcessing(true)
    try {
      // Step 1: Create a Razorpay order on our server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(order.error || 'Failed to create payment order')
      }

      // Step 2: Open Razorpay Checkout
      // Razorpay script must be loaded on the client. We load it dynamically here.
      await loadRazorpayScript()
      // @ts-ignore — Razorpay global from window
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Hirebase Pro',
        description: order.planLabel,
        image: '/og-image.png',
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: '#10b981' },
        handler: async (response: any) => {
          // Step 3: Verify payment on our server
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setSuccess({ plan: planId, endsAt: verifyData.endsAt })
              toast.success('🎉 Welcome to Pro! Your subscription is now active.')
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (e: any) {
            console.error('Payment verify error:', e)
            toast.error('Payment received but verification failed. Email contact@hirebase.in — we will activate your account manually.')
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled. You can upgrade any time from the sidebar.')
          },
        },
      })
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`)
      })
      rzp.open()
    } catch (e: any) {
      console.error('Upgrade error:', e)
      toast.error(e.message || 'Failed to start checkout. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <SiteShell>
      <div className="max-w-5xl mx-auto pb-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 text-xs font-semibold mb-5">
            <Crown className="w-3.5 h-3.5" />
            Upgrade to Hirebase Pro
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Land your next job <span className="gradient-text">faster</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Unlock unlimited AI tools, priority job alerts, and advanced features. Cancel anytime. 7-day money-back guarantee.
          </p>
        </div>

        {/* Already Pro banner */}
        {!authLoading && user && !isDemo && (user as any).subscriptionTier === 'pro' && (user as any).subscriptionEndsAt && new Date((user as any).subscriptionEndsAt) > new Date() && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">You are already a Pro member 🎉</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your subscription is active until {new Date((user as any).subscriptionEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            </div>
          </div>
        )}

        {/* Success modal */}
        {success && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Check className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2">Welcome to Pro! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your Pro subscription is now active until {new Date(success.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                All AI tools are now unlocked with 10x the monthly usage. Receipt sent to your email.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/ai-tools/resume-optimizer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
                >
                  Try AI Resume Optimizer <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {PLANS.map((plan) => {
            const isAnnual = plan.id === 'pro_annual'
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-3xl border-2 p-6 flex flex-col',
                  isAnnual
                    ? 'border-violet-500 bg-violet-500/5 shadow-xl shadow-violet-500/10'
                    : 'border-border bg-card',
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-primary text-white text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 min-h-[2.5rem]">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">₹{plan.price.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check className="w-3 h-3" />
                    {plan.savings}
                  </div>
                )}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={processing && selectedPlan === plan.id}
                  className={cn(
                    'mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all',
                    isAnnual
                      ? 'bg-gradient-to-r from-violet-500 to-primary text-white shadow-lg shadow-violet-500/30 hover:opacity-90'
                      : 'bg-primary text-primary-foreground hover:opacity-90',
                    processing && selectedPlan === plan.id && 'opacity-70',
                  )}
                >
                  {processing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {plan.cta}
                    </>
                  )}
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  7-day money-back guarantee · Cancel anytime
                </p>
              </div>
            )
          })}
        </div>

        {/* Feature comparison */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-3 px-5 py-4 border-b border-border bg-muted/30">
            <div className="text-sm font-bold">Feature</div>
            <div className="text-sm font-bold text-center">Free</div>
            <div className="text-sm font-bold text-center text-violet-600">Pro</div>
          </div>
          {FEATURES.map((feature, i) => (
            <div
              key={feature.name}
              className={cn(
                'grid grid-cols-3 px-5 py-3 items-center text-sm',
                i !== FEATURES.length - 1 && 'border-b border-border',
              )}
            >
              <div className="text-muted-foreground">{feature.name}</div>
              <div className="text-center text-muted-foreground">{feature.free}</div>
              <div className="text-center font-semibold text-foreground flex items-center justify-center gap-1">
                {feature.pro !== '—' ? (
                  <>
                    {feature.pro !== 'Unlimited' && feature.pro !== 'Included' && (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {feature.pro}
                  </>
                ) : (
                  <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-center">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FaqItem
              question="Is there a free trial?"
              answer="Yes! Your first month of AI tool usage is free (1 use per tool). No credit card required. You only pay when you choose to upgrade to Pro."
            />
            <FaqItem
              question="Can I cancel anytime?"
              answer="Yes. Cancel from your Profile page anytime — no questions asked. You keep Pro access until the end of your billing period, then revert to Free automatically."
            />
            <FaqItem
              question="What payment methods do you accept?"
              answer="We use Razorpay — supports all major credit cards, debit cards, UPI (Google Pay, PhonePe, Paytm), net banking (50+ Indian banks), and popular wallets. EMI options also available."
            />
            <FaqItem
              question="Is my payment information secure?"
              answer="100% secure. We use Razorpay (PCI-DSS Level 1 compliant) — your card details never touch our servers. All transactions are encrypted end-to-end with TLS 1.3."
            />
            <FaqItem
              question="What is the refund policy?"
              answer="7-day money-back guarantee on your first Pro subscription, no questions asked. Subsequent renewals are non-refundable but can be cancelled at any time."
            />
            <FaqItem
              question="Will my Pro subscription auto-renew?"
              answer="Currently, no. You pay for 30 days (or 365 days for annual) and we send you an email reminder 3 days before expiry. You can renew manually — this gives you full control."
            />
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-12 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-sm">7-day money-back</h4>
            <p className="text-xs text-muted-foreground mt-1">Try Pro risk-free</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
              <Crown className="w-6 h-6 text-violet-600" />
            </div>
            <h4 className="font-bold text-sm">Cancel anytime</h4>
            <p className="text-xs text-muted-foreground mt-1">No lock-in contracts</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-bold text-sm">100% secure</h4>
            <p className="text-xs text-muted-foreground mt-1">Razorpay PCI-DSS L1</p>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold text-sm mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  )
}

// Load Razorpay checkout script (only when needed)
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })
}
