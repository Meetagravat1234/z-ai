'use client'
import { ReviewsSection } from '@/components/reviews/reviews-section'

import * as React from 'react'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  Globe,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { JobCard, type Job } from '@/components/jobs/job-card'
import { cn } from '@/lib/utils'

interface Company {
  id: string
  name: string
  slug: string
  logo: string | null
  website: string | null
  industry: string | null
  size: string | null
  hq: string | null
  description: string | null
  culture: string | null
  benefits: string | null
  hiringActivity: string | null
  sevenDayTrend: number
}

export function CompanyDetailView({
  initialCompany,
  slug: propSlug,
}: {
  initialCompany?: any
  slug?: string
} = {}) {
  const { selectedCompanySlug, go } = useNav()
  const activeSlug = propSlug || selectedCompanySlug
  const [company, setCompany] = React.useState<Company | null>(initialCompany || null)
  const [jobs, setJobs] = React.useState<Job[]>(initialCompany?.jobs || [])
  const [loading, setLoading] = React.useState(!initialCompany)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    // Skip fetch if SSR provided initial data
    if (initialCompany) {
      setLoading(false)
      return
    }
    if (!activeSlug) {
      setError('No company selected')
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/companies?slug=${activeSlug}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json()
          throw new Error(d.error || 'Failed to load')
        }
        return r.json()
      })
      .then((d) => {
        setCompany(d.company)
        setJobs(d.company?.jobs || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSlug, initialCompany])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">{error || 'Company not found'}</p>
        <button
          onClick={() => go('companies')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          Browse all companies
        </button>
      </div>
    )
  }

  const benefits = company.benefits?.split(',').filter(Boolean) || []
  const trendUp = company.sevenDayTrend > 0
  const trendDown = company.sevenDayTrend < 0
  const activityColor =
    company.hiringActivity === 'High'
      ? 'text-emerald-600 bg-emerald-500/10'
      : company.hiringActivity === 'Medium'
      ? 'text-amber-600 bg-amber-500/10'
      : 'text-muted-foreground bg-muted'

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <button
        onClick={() => go('companies')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to companies
      </button>

      {/* HERO */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-violet-500 to-accent" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center text-3xl sm:text-4xl shrink-0">
              {company.logo || <Building2 className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{company.name}</h1>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', activityColor)}>
                  {company.hiringActivity || '—'} activity
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{company.industry || 'Industry not specified'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {company.hq && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {company.hq}
                  </span>
                )}
                {company.size && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {company.size} employees
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Visit website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Briefcase className="w-3 h-3" />
                Open roles
              </div>
              <div className="text-2xl font-extrabold">{jobs.length}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                7-day trend
              </div>
              <div className={cn(
                'text-2xl font-extrabold',
                trendUp && 'text-emerald-600',
                trendDown && 'text-rose-600',
                !trendUp && !trendDown && 'text-muted-foreground'
              )}>
                {trendUp ? `+${company.sevenDayTrend}%` : trendDown ? `${company.sevenDayTrend}%` : 'Steady'}
              </div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Users className="w-3 h-3" />
                Size
              </div>
              <div className="font-bold">{company.size || '—'}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <CheckCircle2 className="w-3 h-3" />
                Status
              </div>
              <div className="font-bold text-emerald-600">Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {company.description && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-3">About {company.name}</h2>
          <p className="text-foreground/90 leading-relaxed">{company.description}</p>
        </section>
      )}

      {/* CULTURE */}
      {company.culture && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-3">Culture & work environment</h2>
          <p className="text-foreground/90 leading-relaxed">{company.culture}</p>
        </section>
      )}

      {/* BENEFITS */}
      {benefits.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-3">Perks & benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/90">{b.trim()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OPEN ROLES */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-bold">
            Open roles at {company.name} ({jobs.length})
          </h2>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border">
            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active openings at the moment.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon — we update listings daily.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        )}
      </section>

      {/* Company Reviews + Salary Reports */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>⭐ Reviews & Salaries</span>
        </h2>
        <ReviewsSection companyId={company.id} companyName={company.name} companyLogo={company.logo} />
      </section>

      {/* External link CTA */}
      {company.website && (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-6 text-center">
          <h2 className="text-xl font-bold">Want to learn more about {company.name}?</h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-4">
            Visit their official website to explore products, mission, and team.
          </p>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90"
          >
            <ExternalLink className="w-4 h-4" />
            Visit {company.name} →
          </a>
        </section>
      )}
    </div>
  )
}
