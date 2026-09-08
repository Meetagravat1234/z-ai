'use client'

import * as React from 'react'
import { Compass, ArrowRight, Sparkles, TrendingUp, EyeOff, GraduationCap, Mic } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { JobCard, type Job } from '@/components/jobs/job-card'

export function DiscoverView() {
  const { go } = useNav()
  const [jobs, setJobs] = React.useState<Job[]>([])

  React.useEffect(() => {
    fetch('/api/jobs?limit=12&sort=salary-high').then((r) => r.json()).then((d) => setJobs(d.jobs || []))
  }, [])

  const collections = [
    { title: 'Highest-paying fresher roles', desc: 'Top INR packages for 0-year-experience roles', view: 'freshers' as const, icon: GraduationCap },
    { title: 'Remote-first jobs', desc: 'Work from anywhere in India', view: 'all-jobs' as const, icon: Compass, q: 'Remote' },
    { title: 'Hidden referral jobs', desc: 'Curated referral-only opportunities', view: 'hidden' as const, icon: EyeOff },
    { title: 'Practice with AI mock interview', desc: 'Get ready before the real thing', view: 'ai-mock-interview' as const, icon: Mic },
  ]

  return (
    <div className="space-y-8 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
          <Compass className="w-3 h-3" />
          DISCOVER
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Discover jobs you'll actually love</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Curated collections and high-impact roles, hand-picked from our verified listings.
        </p>
      </header>

      {/* Featured collections */}
      <section>
        <h2 className="text-xl font-bold mb-4">Featured collections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((c) => {
            const Icon = c.icon
            return (
              <button
                key={c.title}
                onClick={() => go(c.view, c.q ? { q: c.q } : undefined)}
                className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Open <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Top paying jobs */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Top-paying verified roles</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sorted by maximum salary offered.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.slice(0, 6).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-violet-500/10 via-primary/10 to-accent/10 border border-violet-500/20 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/70 backdrop-blur border border-border text-xs font-semibold mb-3">
          <Sparkles className="w-3 h-3 text-violet-500" />
          AI-POWERED
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Tailor your resume in 30 seconds
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Our AI Resume Optimizer aligns your resume with any job description, so you stand out to both ATS and recruiters.
        </p>
        <button
          onClick={() => go('ai-resume')}
          className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Sparkles className="w-4 h-4" />
          Try it now
        </button>
      </section>
    </div>
  )
}
