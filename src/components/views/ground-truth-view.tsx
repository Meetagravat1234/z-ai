'use client'

import { Microscope, CheckCircle2, ShieldCheck, Database, Search, EyeOff } from 'lucide-react'

export function GroundTruthView() {
  return (
    <div className="space-y-8 pb-8 max-w-3xl">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <Microscope className="w-3 h-3" />
          GROUND TRUTH
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">How we verify jobs on Hirebase</h1>
        <p className="text-muted-foreground mt-2">
          We aggregate listings from 14+ legitimate sources — official company career pages, public ATS feeds (Greenhouse, Ashby, Lever), and verified job boards. But unlike generic scrape-and-repost boards, every job on Hirebase goes through a multi-step verification and enrichment pipeline before it reaches you. Nothing publishes automatically.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Our 5-step verification process</h2>
        <ol className="space-y-4">
          {[
            { title: 'Aggregation', desc: 'Our systems surface candidate listings from multiple legitimate channels — official career pages, public ATS feeds, verified job boards, and trusted professional sources. This is automated.' },
            { title: 'Deduplication & freshness check', desc: 'We check each listing: Is it real? Is it a duplicate of an existing job? Is the employer legitimate? Is the posting fresh? Stale, spam, or duplicate listings are rejected.' },
            { title: 'AI enrichment', desc: 'Each surviving listing is enriched with structured metadata — extracted skills, normalized location, experience level, work mode, and category — using AI on the original job description.' },
            { title: 'Salary verification', desc: 'When a salary is provided by the source, we publish it as-is. When it isn&rsquo;t, we estimate a realistic range based on actual benchmark data from similar roles (same role family, experience level, and city tier) — never a hardcoded placeholder.' },
            { title: 'Publication with provenance', desc: 'We mark each listing as Verified and link back to the original employer page. No middlemen, no paywalls, no "unlock to see salary" games.' },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <EyeOff className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold">Hidden Jobs — separate curation</h3>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          Hidden Jobs are manually curated community and referral opportunities that often never appear on traditional boards. They are maintained separately from standard verified career-portal listings — to protect the privacy of referrers and the integrity of the leads.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, label: 'Verified', value: '100%', desc: 'Of published jobs are reviewed' },
          { icon: Database, label: 'Sources', value: '14+', desc: 'Channels monitored for new openings' },
          { icon: Search, label: 'Avg. time to publish', value: '< 24h', desc: 'From discovery to listing' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
            </div>
          )
        })}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h3 className="font-bold">What we are not</h3>
        </div>
        <ul className="space-y-2 text-sm text-foreground/90">
          <li className="flex gap-2"><span className="text-primary">•</span> We are not the employer — apply links send you to the original employer page.</li>
          <li className="flex gap-2"><span className="text-primary">•</span> We are not a consultancy or commission-based recruiter.</li>
          <li className="flex gap-2"><span className="text-primary">•</span> We do not guarantee interviews — we surface real openings, you bring the application.</li>
          <li className="flex gap-2"><span className="text-primary">•</span> We do not publish unverified or duplicate listings — every job passes dedup + freshness + legitimacy checks.</li>
          <li className="flex gap-2"><span className="text-primary">•</span> We do not gate salary information behind signups or paywalls — what we know, you see.</li>
        </ul>
      </section>
    </div>
  )
}
