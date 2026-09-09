'use client'

import * as React from 'react'
import { Loader2, Search, X, GitCompare, Trophy, Check, ArrowRight, Briefcase, MapPin, IndianRupee, Building2, Clock, Eye } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Job {
  id: string
  title: string
  category: string
  employmentType: string
  workMode: string
  experience: string
  salaryMin: number | null
  salaryMax: number | null
  location: string
  skills: string
  description: string
  postedAt: string
  viewsCount: number
  company: { id: string; name: string; slug: string; logo: string | null; industry: string | null; hiringActivity: string | null; sevenDayTrend: number }
}

export function CompareJobsView() {
  const { openJob } = useNav()
  const [search, setSearch] = React.useState('')
  const [allJobs, setAllJobs] = React.useState<Job[]>([])
  const [selected, setSelected] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/jobs?limit=200')
      .then((r) => r.json())
      .then((d) => setAllJobs(d.jobs || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? allJobs.filter((j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  function addJob(job: Job) {
    if (selected.length >= 3) {
      toast.error('You can compare up to 3 jobs at a time')
      return
    }
    if (selected.find((j) => j.id === job.id)) {
      toast.error('Job already added')
      return
    }
    setSelected([...selected, job])
    setSearch('')
  }

  function removeJob(id: string) {
    setSelected(selected.filter((j) => j.id !== id))
  }

  function getWinner(field: 'salary' | 'views' | 'trend', job: Job): boolean {
    if (selected.length < 2) return false
    const value = field === 'salary' ? (job.salaryMax || 0) : field === 'views' ? job.viewsCount : job.company.sevenDayTrend
    const maxValue = Math.max(...selected.map((j) => field === 'salary' ? (j.salaryMax || 0) : field === 'views' ? j.viewsCount : j.company.sevenDayTrend))
    return value === maxValue && value > 0
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <GitCompare className="w-3 h-3" />
          DECISION TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Job Comparison Tool</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Compare 2 or 3 jobs side by side to help you decide which one to apply for. We highlight the best salary, most views, and best company trend.
        </p>
      </header>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs to add to comparison…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-lg z-10 max-h-80 overflow-y-auto">
            {filtered.map((job) => (
              <button
                key={job.id}
                onClick={() => addJob(job)}
                className="w-full text-left p-3 hover:bg-muted/50 border-b border-border last:border-0 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                  {job.company.logo || <Building2 className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{job.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{job.company.name} · {job.location.split(',')[0]}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected jobs comparison */}
      {selected.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <GitCompare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Search and add 2 or 3 jobs above to start comparing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected job chips */}
          <div className="flex flex-wrap gap-2">
            {selected.map((job) => (
              <span key={job.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {job.company.logo} {job.company.name} · {job.title.slice(0, 20)}
                <button onClick={() => removeJob(job.id)} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Comparison grid */}
          <div className="overflow-x-auto">
            <div className="grid gap-3" style={{ gridTemplateColumns: `200px repeat(${selected.length}, minmax(220px, 1fr))` }}>
              {/* Header row */}
              <div></div>
              {selected.map((job) => (
                <div key={job.id} className="rounded-2xl border border-border bg-card p-4 sticky top-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl mb-1">{job.company.logo || <Building2 className="w-6 h-6 text-muted-foreground" />}</div>
                      <h3 className="font-bold text-sm leading-tight">{job.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.company.name}</p>
                    </div>
                    <button onClick={() => removeJob(job.id)} className="p-1 rounded hover:bg-muted">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Salary row */}
              <CompareRow label="Salary" icon={IndianRupee} />
              {selected.map((job) => (
                <CompareCell key={job.id} highlight={getWinner('salary', job)}>
                  <div className="font-bold">{formatSalary(job.salaryMin, job.salaryMax)}</div>
                </CompareCell>
              ))}

              {/* Location */}
              <CompareRow label="Location" icon={MapPin} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="text-sm">{job.location}</div>
                </CompareCell>
              ))}

              {/* Work mode */}
              <CompareRow label="Work mode" icon={Briefcase} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="text-sm">{job.workMode}</div>
                </CompareCell>
              ))}

              {/* Employment */}
              <CompareRow label="Employment" icon={Briefcase} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="text-sm">{job.employmentType}</div>
                </CompareCell>
              ))}

              {/* Experience */}
              <CompareRow label="Experience" icon={Clock} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="text-sm">{job.experience}</div>
                </CompareCell>
              ))}

              {/* Views */}
              <CompareRow label="Views" icon={Eye} />
              {selected.map((job) => (
                <CompareCell key={job.id} highlight={getWinner('views', job)}>
                  <div className="font-bold">{job.viewsCount}</div>
                </CompareCell>
              ))}

              {/* Company trend */}
              <CompareRow label="Company 7d trend" icon={Trophy} />
              {selected.map((job) => (
                <CompareCell key={job.id} highlight={getWinner('trend', job)}>
                  <div className={cn(
                    'font-bold',
                    job.company.sevenDayTrend > 0 && 'text-emerald-600',
                    job.company.sevenDayTrend < 0 && 'text-rose-600',
                    job.company.sevenDayTrend === 0 && 'text-muted-foreground'
                  )}>
                    {job.company.sevenDayTrend > 0 ? '+' : ''}{job.company.sevenDayTrend}%
                  </div>
                </CompareCell>
              ))}

              {/* Industry */}
              <CompareRow label="Industry" icon={Building2} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="text-sm">{job.company.industry || '—'}</div>
                </CompareCell>
              ))}

              {/* Skills */}
              <CompareRow label="Skills" icon={Check} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="flex flex-wrap gap-1">
                    {job.skills.split(',').slice(0, 5).map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.trim()}</span>
                    ))}
                  </div>
                </CompareCell>
              ))}

              {/* Posted */}
              <CompareRow label="Posted" icon={Clock} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <div className="text-sm">{timeAgo(job.postedAt)}</div>
                </CompareCell>
              ))}

              {/* Action row */}
              <CompareRow label="Action" icon={ArrowRight} />
              {selected.map((job) => (
                <CompareCell key={job.id}>
                  <button
                    onClick={() => openJob(job.id)}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                  >
                    View details <ArrowRight className="w-3 h-3" />
                  </button>
                </CompareCell>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-violet-500/5 p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Quick verdict
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Highest salary:</strong>{' '}
                {(() => {
                  const winner = [...selected].sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0))[0]
                  return winner ? `${winner.company.name} — ${formatSalary(winner.salaryMin, winner.salaryMax)}` : '—'
                })()}
              </p>
              <p>
                <strong>Most viewed:</strong>{' '}
                {(() => {
                  const winner = [...selected].sort((a, b) => b.viewsCount - a.viewsCount)[0]
                  return winner ? `${winner.company.name} (${winner.viewsCount} views)` : '—'
                })()}
              </p>
              <p>
                <strong>Best company trend:</strong>{' '}
                {(() => {
                  const winner = [...selected].sort((a, b) => b.company.sevenDayTrend - a.company.sevenDayTrend)[0]
                  return winner ? `${winner.company.name} (${winner.company.sevenDayTrend > 0 ? '+' : ''}${winner.company.sevenDayTrend}%)` : '—'
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}

function CompareRow({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-t border-border">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  )
}

function CompareCell({ children, highlight = false }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      'px-3 py-2 border-t border-border flex items-center',
      highlight && 'bg-emerald-500/5'
    )}>
      {children}
      {highlight && <Trophy className="w-3.5 h-3.5 text-amber-500 ml-auto shrink-0" />}
    </div>
  )
}

function formatSalary(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Not disclosed'
  const fmt = (n: number) => {
    const lpa = n / 10
    if (Number.isInteger(lpa)) return `${lpa} LPA`
    return `${lpa.toFixed(1)} LPA`
  }
  if (min != null && max != null) return `₹${fmt(min)} – ${fmt(max)}`
  if (min != null) return `₹${fmt(min)}+`
  return `up to ₹${fmt(max!)}`
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2419200) return `${Math.floor(diff / 604800)}w ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
