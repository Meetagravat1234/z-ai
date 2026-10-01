'use client'

import { Check, X, Sparkles, FileText, Mic, Wallet, Briefcase, Crown, Zap } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    desc: 'For job seekers exploring opportunities.',
    features: [
      'Unlimited job browsing',
      'All filters & search',
      'Company profiles',
      '3 free ATS checks per month',
      '1 free resume optimization',
      '1 free cover letter',
      '2 free templates',
    ],
    notIncluded: [
      'All 10 resume templates',
      'Unlimited AI tools',
      'PDF/DOCX downloads',
    ],
    cta: 'Start Free',
    highlight: false,
    icon: Briefcase,
    color: 'text-muted-foreground',
  },
  {
    name: 'Starter',
    price: '₹99',
    originalPrice: null,
    period: 'per month',
    desc: 'For active job seekers who need more.',
    features: [
      'Everything in Free, plus:',
      '5 AI tool uses per tool per month',
      '15 ATS checks per month',
      '5 resume optimizations',
      '5 cover letters',
      '2 free templates',
      '10 PDF downloads',
    ],
    notIncluded: [
      'All 10 resume templates',
    ],
    cta: 'Go Starter',
    highlight: false,
    icon: Zap,
    color: 'text-blue-500',
  },
  {
    name: 'Pro',
    price: '₹149',
    originalPrice: '₹299',
    period: 'per month',
    desc: 'For serious job seekers who want it all. Launch offer!',
    badge: '🔥 LAUNCH OFFER 50% OFF',
    features: [
      'Everything in Starter, plus:',
      '10 AI tool uses per tool per month',
      '50 ATS checks per month',
      '10 resume optimizations',
      'All 10 resume templates',
      '50 PDF/DOCX downloads',
      'Priority support',
    ],
    notIncluded: [],
    cta: 'Go Pro — 50% Off',
    highlight: true,
    icon: Crown,
    color: 'text-amber-500',
  },
  {
    name: 'Pro Annual',
    price: '₹799',
    originalPrice: '₹2,499',
    period: 'per year',
    desc: 'Best value — 12 months for the price of 5. Save 68%!',
    badge: '⭐ BEST VALUE',
    features: [
      'Everything in Pro Monthly, plus:',
      '2 months FREE (₹66/month effective)',
      'All future features included',
      'Early access to new AI tools',
      'Priority feature requests',
    ],
    notIncluded: [],
    cta: 'Go Annual — Save 68%',
    highlight: false,
    icon: Sparkles,
    color: 'text-emerald-500',
  },
]

export function PricingView() {
  const { go } = useNav()
  return (
    <div className="space-y-8 pb-8">
      <header className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
          <Sparkles className="w-3 h-3" />
          LAUNCH PRICING — 50% OFF
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Pay for AI tools, not for job listings.
        </h1>
        <p className="text-muted-foreground mt-3">
          Job browsing is always free. Pay only when you want unlimited access to our AI career tools.
          <br />
          <span className="font-semibold text-primary">Limited time launch offer — prices increase soon!</span>
        </p>
      </header>

      {/* Plans grid — 2 columns on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.name}
              className={cn(
                'rounded-2xl border p-5 flex flex-col relative',
                plan.highlight
                  ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-primary/5 shadow-lg shadow-amber-500/10'
                  : 'border-border bg-card'
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={cn(
                    'inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap',
                    plan.highlight ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  )}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name + icon */}
              <div className="flex items-center gap-2 mb-3 mt-2">
                <Icon className={cn('w-5 h-5', plan.color)} />
                <h3 className="text-lg font-bold">{plan.name}</h3>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">/ {plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                    <span className="text-xs font-bold text-emerald-600">
                      Save {Math.round((1 - parseInt(plan.price.replace(/[^\d]/, '')) / parseInt(plan.originalPrice.replace(/[^\d]/, ''))) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => go(plan.name === 'Free' ? 'home' : 'auth')}
                className={cn(
                  'w-full py-2.5 rounded-xl font-semibold mb-4 text-sm transition-colors',
                  plan.highlight
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : plan.name === 'Pro Annual'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'border border-border bg-background hover:bg-muted'
                )}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <ul className="space-y-2 text-xs flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 opacity-40">
                    <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* AI Tools breakdown */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold mb-4">What AI tools are included?</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: FileText, name: 'AI Resume Optimizer', desc: 'Tailor your resume for any job in seconds.' },
            { icon: Briefcase, name: 'ATS Score Checker', desc: 'Check if your resume passes ATS systems.' },
            { icon: Sparkles, name: 'AI Cover Letter', desc: 'Generate a personalized cover letter.' },
            { icon: Mic, name: 'AI Mock Interview', desc: 'Practice with a realistic AI interviewer.' },
            { icon: Wallet, name: 'Salary Predictor', desc: 'Know your worth + negotiation tips.' },
            { icon: Crown, name: '10 Resume Templates', desc: 'Professional templates for every role.' },
          ].map((t) => {
            const Icon = t.icon
            return (
              <div key={t.name} className="rounded-xl border border-border bg-muted/40 p-3">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <div className="font-semibold text-sm">{t.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Trust signals */}
      <section className="text-center text-sm text-muted-foreground space-y-2">
        <p>🔒 Secure payment via Razorpay · Cancel anytime · No hidden fees</p>
        <p>Have questions? Reach out to <span className="text-primary font-medium">contact@hirebase.in</span></p>
      </section>
    </div>
  )
}
