import { SiteShell } from '@/components/layout/site-shell'
import { PricingView } from '@/components/views/pricing-view'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Check, Crown, ArrowRight, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Pricing — Free for Job Seekers, Pro from ₹299/month | Hirebase',
  description:
    'Hirebase is free for job seekers — browse 300+ jobs, search, apply. Upgrade to Pro for ₹299/month or ₹2,499/year to unlock 10x AI tool usage + premium features.',
  alternates: { canonical: 'https://www.hirebase.in/pricing' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://www.hirebase.in/pricing' },
  ],
}

// FAQ schema for rich snippets
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Hirebase free for job seekers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Hirebase is 100% free for browsing jobs, searching, and applying. You can also use each AI tool once per month for free. Upgrade to Pro for ₹299/month to unlock 10x AI tool usage.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Hirebase Pro cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hirebase Pro costs ₹299/month or ₹2,499/year (save 30% with annual plan). Includes 10 AI resume optimizations, 10 cover letters, 10 mock interviews, 50 ATS score checks, 50 salary predictions, unlimited saved jobs, and daily email job alerts.',
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <SiteShell>
        <div className="max-w-5xl mx-auto pb-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-semibold mb-5">
              <Check className="w-3.5 h-3.5" />
              Free forever for job seekers
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Simple, transparent <span className="gradient-text">pricing</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Start free, no credit card required. Upgrade to Pro only when you want more AI tool usage + premium features.
            </p>
          </div>

          {/* Pricing tiers quick view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
            {/* Free tier */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🆓</span>
                <h2 className="text-2xl font-bold">Free</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">For everyone exploring jobs in India</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-sm text-muted-foreground">/forever</span>
              </div>
              <Link
                href="/jobs"
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-sm transition-colors"
              >
                Start browsing <ArrowRight className="w-4 h-4" />
              </Link>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  'Unlimited job browsing + search',
                  'Apply to any job (free)',
                  '1 AI Resume Optimization / month',
                  '1 ATS Score Check / month',
                  '1 Cover Letter / month',
                  '1 Mock Interview / month',
                  'Save up to 10 jobs',
                  'Weekly email job alerts (1 alert)',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-3xl border-2 border-violet-500 bg-gradient-to-br from-violet-500/5 to-primary/5 p-6 sm:p-8 shadow-xl shadow-violet-500/10">
              <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-primary text-white text-[10px] font-bold uppercase tracking-wider">
                <Crown className="w-3 h-3" />
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👑</span>
                <h2 className="text-2xl font-bold">Pro</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">For serious job seekers + career switchers</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold">₹299</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mb-6">
                or ₹2,499/year — save 30% 🎉
              </p>
              <Link
                href="/upgrade"
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </Link>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  ['10x', 'AI Resume Optimizations / month'],
                  ['50x', 'ATS Score Checks / month'],
                  ['10x', 'AI Cover Letters / month'],
                  ['10x', 'AI Mock Interviews / month'],
                  ['∞', 'Unlimited saved jobs + tracker'],
                  ['∞', 'Unlimited daily + real-time alerts'],
                  ['✨', 'AI Job Match Score on every job'],
                  ['📄', 'PDF export (resume + cover letter)'],
                ].map(([icon, label]) => (
                  <li key={label} className="flex items-start gap-2">
                    <span className="text-violet-600 font-bold shrink-0 mt-0.5 w-8 text-xs">{icon}</span>
                    <span className="text-foreground">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Existing pricing view (legacy) */}
          <PricingView />

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-6">Frequently asked questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                ['Is Hirebase really free?', 'Yes. Browsing jobs, searching, and applying will always be free. No credit card required. AI tools have a free monthly quota — upgrade to Pro for 10x more.'],
                ['Do I need a credit card to use free tier?', 'No. Sign up with just your email — no card required. You only pay if you choose to upgrade to Pro.'],
                ['How does Pro billing work?', 'One-time payment via Razorpay (UPI, card, net banking). No auto-renewal — you get an email reminder 3 days before expiry and can manually renew.'],
                ['Can I cancel Pro?', 'Yes, anytime from your Profile page. Your Pro access continues until the end of the billing period, then reverts to Free automatically. No lock-in.'],
              ].map(([q, a]) => (
                <div key={q} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-bold text-sm mb-2">{q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-3xl bg-gradient-to-br from-violet-500/10 via-primary/5 to-accent/10 border border-violet-500/20 p-6 sm:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Ready to find your next job faster?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Join thousands of Indian job seekers using Hirebase to land verified roles at top employers.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 hover:opacity-90"
              >
                Browse 300+ jobs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/upgrade"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-violet-500/30 bg-violet-500/5 text-violet-600 font-semibold text-sm hover:bg-violet-500/10"
              >
                <Crown className="w-4 h-4" /> Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </SiteShell>
    </>
  )
}
