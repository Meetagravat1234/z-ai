'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  Building2,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  Search,
  FileText,
  Mic,
  Wallet,
  GraduationCap,
  EyeOff,
  UserCheck,
  Target,
  BarChart3,
  BookOpen,
  GitCompare,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { useAuth } from '@/lib/auth-context'
import { JobCard, type Job } from '@/components/jobs/job-card'
import { cn } from '@/lib/utils'

interface Company {
  id: string
  name: string
  slug: string
  logo: string | null
  industry: string | null
  hiringActivity: string | null
  sevenDayTrend: number
  openRoles: number
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  coverEmoji: string
  readMinutes: number
  createdAt: string
}

export function HomeView() {
  const { go, openCompany } = useNav()
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [articles, setArticles] = React.useState<Article[]>([])
  const [stats, setStats] = React.useState({ jobs: 0, companies: 0 })
  const [newToday, setNewToday] = React.useState(0)
  const [lastSync, setLastSync] = React.useState<{ source: string; ts: string } | null>(null)
  const [recommendedJobs, setRecommendedJobs] = React.useState<Job[]>([])
  const { user, isDemo } = useAuth()

  React.useEffect(() => {
    Promise.all([
      fetch('/api/jobs?limit=6&indiaOnly=true').then((r) => r.json()),
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/articles?limit=3').then((r) => r.json()),
      fetch('/api/jobs?limit=200&indiaOnly=true').then((r) => r.json()),
      fetch('/api/sync/status').then((r) => r.json()),
    ]).then(([recent, comps, arts, allJobs, sync]) => {
      setJobs(recent.jobs || [])
      setCompanies((comps.companies || []).slice(0, 8))
      setArticles(arts.articles || [])
      setStats({
        jobs: (allJobs.jobs || []).length,
        companies: (comps.companies || []).length,
      })
      setNewToday(sync.newToday || 0)
      if (sync.lastSuccess) {
        setLastSync({ source: sync.lastSuccess.source, ts: sync.lastSuccess.startedAt })
      }
    })
  }, [])

  // Fetch personalized jobs when user has targetRole
  React.useEffect(() => {
    if (user && !isDemo && user.targetRole) {
      const params = new URLSearchParams({ limit: '6', indiaOnly: 'true' })
      if (user.targetRole) params.set('q', user.targetRole)
      fetch(`/api/jobs?${params}`)
        .then((r) => r.json())
        .then((d) => setRecommendedJobs(d.jobs || []))
        .catch(() => {})
    }
  }, [user, isDemo])

  return (
    <div className="space-y-12 pb-8">
      {/* Live sync banner */}
      {(newToday > 0 || lastSync) && (
        <button
          onClick={() => go('sync-status')}
          className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-3 hover:bg-emerald-500/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-semibold text-sm">
                {newToday > 0
                  ? `${newToday} new job${newToday !== 1 ? 's' : ''} added in the last 24 hours`
                  : 'Live sync active'}
              </div>
              {lastSync && (
                <div className="text-xs text-muted-foreground">
                  Last sync: {lastSync.source} · {new Date(lastSync.ts).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
            View sync status →
          </span>
        </button>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />

        <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:py-20 lg:px-14 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered career intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Find <span className="gradient-text">verified jobs</span>,<br />
            research companies, and tailor your resume with AI.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            CareerNest combines employer-sourced job discovery, company hiring signals, AI resume tools, and editorial guidance — not a generic repost board.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => go('all-jobs')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
            >
              <Search className="w-4 h-4" />
              Browse {stats.jobs || ''} jobs
            </button>
            <button
              onClick={() => go('ai-resume')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-background hover:bg-muted font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              Try AI Resume Optimizer
            </button>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Verified jobs', value: stats.jobs, icon: Briefcase, color: 'text-primary' },
              { label: 'Companies', value: stats.companies, icon: Building2, color: 'text-accent' },
              { label: 'AI tools', value: 4, icon: Sparkles, color: 'text-violet-500' },
              { label: 'Career articles', value: articles.length * 4, icon: TrendingUp, color: 'text-rose-500' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border bg-background/80 backdrop-blur p-4"
                >
                  <Icon className={cn('w-5 h-5 mb-2', s.color)} />
                  <div className="text-2xl font-extrabold text-foreground">
                    {s.value || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* JOBS FOR YOU — personalized recommendations */}
      {user && !isDemo && user.targetRole && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Jobs for you</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your target role: <strong className="text-primary">{user.targetRole}</strong>
                {user.skills && ` · Skills: ${user.skills.split(',').slice(0, 5).join(', ')}`}
              </p>
            </div>
          </div>
          {recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">No personalized matches yet. Try updating your profile with more skills.</p>
            </div>
          )}
        </section>
      )}

      {/* AI TOOLS */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI-Powered Career Tools</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Six intelligent assistants to accelerate your job search.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'ai-resume',
              title: 'AI Resume Optimizer',
              desc: 'Tailor your resume to any job description in seconds. ATS-friendly output.',
              icon: FileText,
              accent: 'from-violet-500/20 to-primary/20',
              border: 'border-violet-500/30',
            },
            {
              id: 'ats-score',
              title: 'ATS Score Checker',
              desc: 'Get an ATS compatibility score (0-100) and specific fix recommendations.',
              icon: FileText,
              accent: 'from-emerald-500/20 to-cyan-500/20',
              border: 'border-emerald-500/30',
            },
            {
              id: 'ai-cover-letter',
              title: 'AI Cover Letter',
              desc: 'Generate a personalized, professional cover letter for any role.',
              icon: Sparkles,
              accent: 'from-rose-500/20 to-amber-500/20',
              border: 'border-rose-500/30',
            },
            {
              id: 'ai-mock-interview',
              title: 'AI Mock Interview',
              desc: 'Practice real interview questions with an AI interviewer. Voice or text.',
              icon: Mic,
              accent: 'from-emerald-500/20 to-cyan-500/20',
              border: 'border-emerald-500/30',
            },
            {
              id: 'skill-gap',
              title: 'Skill Gap Analyzer',
              desc: 'Find skills missing for your target role + get a personalized learning path.',
              icon: Target,
              accent: 'from-violet-500/20 to-rose-500/20',
              border: 'border-violet-500/30',
            },
            {
              id: 'ai-salary',
              title: 'Salary Predictor',
              desc: 'Predict realistic salary ranges with negotiation tips.',
              icon: Wallet,
              accent: 'from-amber-500/20 to-orange-500/20',
              border: 'border-amber-500/30',
            },
          ].map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => go(tool.id as any)}
                className={cn(
                  'text-left rounded-2xl border p-5 bg-card card-lift relative overflow-hidden ai-glow',
                  tool.border
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none',
                    tool.accent
                  )}
                />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {tool.desc}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Open tool <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* INSIGHTS & TOOLS */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Insights & Decision Tools</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Data-driven tools to help you research, compare, and prepare.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              id: 'salary-dashboard',
              title: 'Salary Dashboard',
              desc: 'Interactive charts showing salary trends by role, company, city, and experience level.',
              icon: BarChart3,
            },
            {
              id: 'question-bank',
              title: 'Interview Question Bank',
              desc: 'Searchable database of real interview questions with AI-generated model answers.',
              icon: BookOpen,
            },
            {
              id: 'compare-jobs',
              title: 'Compare Jobs',
              desc: 'Compare 2-3 jobs side by side to help decide which one to apply for.',
              icon: GitCompare,
            },
          ].map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => go(tool.id as any)}
                className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold">{tool.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{tool.desc}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* CATEGORIES */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Curated job lists for every stage of your career.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'freshers', label: 'Freshers', desc: '0 years experience jobs', icon: GraduationCap, count: null },
            { id: 'internships', label: 'Internships', desc: 'Student & college roles', icon: UserCheck, count: null },
            { id: 'walk-in', label: 'Walk-in Jobs', desc: 'Direct interview drives', icon: Users, count: null },
            { id: 'hidden', label: 'Hidden Jobs', desc: 'Referral-only opportunities', icon: EyeOff, count: null },
          ].map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => go(cat.id as any)}
                className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured jobs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Hand-picked verified openings from top employers.
            </p>
          </div>
          <button
            onClick={() => go('all-jobs')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* TOP COMPANIES */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Top companies hiring</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Active openings, hiring velocity, and 7-day trends.
            </p>
          </div>
          <button
            onClick={() => go('companies')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {companies.map((c) => {
            const trendUp = c.sevenDayTrend > 0
            const trendDown = c.sevenDayTrend < 0
            return (
              <button
                key={c.id}
                onClick={() => openCompany(c.slug)}
                className="text-left rounded-2xl border border-border bg-card p-4 card-lift"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                    {c.logo || <Building2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.openRoles} open role{c.openRoles !== 1 && 's'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-semibold',
                      trendUp && 'text-emerald-600',
                      trendDown && 'text-rose-600',
                      !trendUp && !trendDown && 'text-muted-foreground'
                    )}
                  >
                    <TrendingUp
                      className={cn('w-3 h-3', trendDown && 'rotate-180')}
                    />
                    {trendUp ? `+${c.sevenDayTrend}%` : trendDown ? `${c.sevenDayTrend}%` : 'Steady'}
                  </span>
                  <span className="text-muted-foreground">{c.industry}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* INSIGHTS */}
      {articles.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Career insights</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Editorial guidance from hiring insiders.
              </p>
            </div>
            <button
              onClick={() => go('insights')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              All articles →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articles.map((a) => (
              <button
                key={a.id}
                onClick={() => go('insights')}
                className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
              >
                <div className="text-3xl mb-3">{a.coverEmoji}</div>
                <h3 className="font-bold text-foreground leading-snug">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {a.excerpt}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-wide text-primary">
                    {a.category}
                  </span>
                  <span>·</span>
                  <span>{a.readMinutes} min read</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-8 sm:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/70 backdrop-blur border border-border text-xs font-semibold mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          100% free to browse
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Start your job search smarter today
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Join thousands of candidates using CareerNest to land verified roles at top employers across India.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => go('all-jobs')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
          >
            Browse jobs <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => go('about')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-background hover:bg-muted font-semibold transition-colors"
          >
            Learn more
          </button>
        </div>
      </section>
    </div>
  )
}
