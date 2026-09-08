'use client'

import { Check, X, Sparkles, FileText, Mic, Wallet, Briefcase } from 'lucide-react'
import { useNav } from '@/lib/nav-store'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    desc: 'For job seekers browsing the open market.',
    features: [
      'Unlimited job browsing',
      'All filters & search',
      'Company profiles & hiring signals',
      'Career Insights articles',
      'Save up to 50 jobs',
      '3 AI tool uses per month',
    ],
    notIncluded: [
      'Unlimited AI tool usage',
      'Application Tracker Pro',
      'Email job alerts',
      'Priority new-listing alerts',
    ],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    desc: 'For active job seekers using AI tools.',
    features: [
      'Everything in Free, plus:',
      'Unlimited AI Resume Optimizer',
      'Unlimited AI Cover Letter',
      'Unlimited AI Mock Interview',
      'Unlimited Salary Predictor',
      'Unlimited Saved Jobs',
      'Application Tracker (Kanban)',
      'Priority email alerts',
    ],
    notIncluded: [],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'Teams',
    price: 'Custom',
    period: 'contact us',
    desc: 'For bootcamps, colleges, and cohorts.',
    features: [
      'Everything in Pro, plus:',
      'Bulk cohort licenses',
      'Team analytics dashboard',
      'Custom job alerts',
      'Branded career portal',
      'Dedicated account manager',
      'Workshop sessions',
    ],
    notIncluded: [],
    cta: 'Contact sales',
    highlight: false,
  },
]

export function PricingView() {
  const { go } = useNav()
  return (
    <div className="space-y-8 pb-8">
      <header className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
          <Sparkles className="w-3 h-3" />
          PRICING
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Pay for AI tools, not for job listings.
        </h1>
        <p className="text-muted-foreground mt-3">
          Job browsing is always free. Pay only when you want unlimited access to our AI career tools and tracker.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 flex flex-col ${
              plan.highlight
                ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/5 shadow-lg shadow-primary/10'
                : 'border-border bg-card'
            }`}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">{plan.price}</span>
              <span className="text-sm text-muted-foreground ml-1">/ {plan.period}</span>
            </div>
            <button
              onClick={() => go('home')}
              className={`w-full py-2.5 rounded-xl font-semibold mb-5 ${
                plan.highlight
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'border border-border bg-background hover:bg-muted'
              }`}
            >
              {plan.cta}
            </button>
            <ul className="space-y-2 text-sm flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
              {plan.notIncluded.map((f) => (
                <li key={f} className="flex items-start gap-2 opacity-50">
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold mb-4">What is included in the AI tools?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: FileText, name: 'AI Resume Optimizer', desc: 'Tailor your resume for any job description in seconds.' },
            { icon: Sparkles, name: 'AI Cover Letter', desc: 'Generate a personalized cover letter for any role.' },
            { icon: Mic, name: 'AI Mock Interview', desc: 'Practice with a realistic AI interviewer.' },
            { icon: Wallet, name: 'Salary Predictor', desc: 'Predict realistic salary ranges and negotiation tips.' },
          ].map((t) => {
            const Icon = t.icon
            return (
              <div key={t.name} className="rounded-xl border border-border bg-muted/40 p-4">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <div className="font-semibold text-sm">{t.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="text-center text-sm text-muted-foreground">
        <p>Have questions? Reach out to <span className="text-primary font-medium">contact@careernest.org</span></p>
      </section>
    </div>
  )
}
