'use client'

import * as React from 'react'
import { Building2, TrendingUp, MapPin, Search, Loader2, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNav } from '@/lib/nav-store'

interface Company {
  id: string
  name: string
  slug: string
  logo: string | null
  industry: string | null
  size: string | null
  hq: string | null
  hiringActivity: string | null
  sevenDayTrend: number
  openRoles: number
}

export function CompaniesView() {
  const { go } = useNav()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [loading, setLoading] = React.useState(true)
  const [q, setQ] = React.useState('')
  const [industry, setIndustry] = React.useState('All')

  React.useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .finally(() => setLoading(false))
  }, [])

  const industries = ['All', ...Array.from(new Set(companies.map((c) => c.industry).filter(Boolean)) as string[])]
  const filtered = companies.filter((c) => {
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.industry || '').toLowerCase().includes(q.toLowerCase())
    const matchIndustry = industry === 'All' || c.industry === industry
    return matchQ && matchIndustry
  })

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Companies hiring on CareerNest</h1>
        <p className="text-muted-foreground mt-2">
          See how employers are hiring right now — active openings, locations, hiring velocity, and 7-day trends.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company or industry…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm"
        >
          {industries.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const trendUp = c.sevenDayTrend > 0
            const trendDown = c.sevenDayTrend < 0
            const activityColor =
              c.hiringActivity === 'High'
                ? 'text-emerald-600 bg-emerald-500/10'
                : c.hiringActivity === 'Medium'
                ? 'text-amber-600 bg-amber-500/10'
                : 'text-muted-foreground bg-muted'

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-5 card-lift cursor-pointer"
                onClick={() => go('all-jobs', { company: c.slug })}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center text-2xl">
                    {c.logo || <Building2 className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate">{c.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.industry || 'Industry not specified'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {c.hq && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.hq}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/50 py-2.5">
                    <div className="text-lg font-extrabold text-foreground">{c.openRoles}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Open roles</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 py-2.5">
                    <div className={cn(
                      'text-lg font-extrabold',
                      trendUp && 'text-emerald-600',
                      trendDown && 'text-rose-600',
                      !trendUp && !trendDown && 'text-muted-foreground'
                    )}>
                      {trendUp ? `+${c.sevenDayTrend}%` : trendDown ? `${c.sevenDayTrend}%` : '—'}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">7d trend</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 py-2.5">
                    <div className="inline-flex items-center justify-center mt-1">
                      <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', activityColor)}>
                        {c.hiringActivity || '—'}
                      </span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">Activity</div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    go('all-jobs', { company: c.slug })
                  }}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  View {c.openRoles} open role{c.openRoles !== 1 && 's'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
