'use client'

import * as React from 'react'
import { Filter, X, Loader2, Search, SlidersHorizontal, Briefcase } from 'lucide-react'
import { JobCard, type Job } from '@/components/jobs/job-card'
import { useNav } from '@/lib/nav-store'
import { cn } from '@/lib/utils'

interface Props {
  fixedCategory?: string
  fixedTitle?: string
  showFilters?: boolean
  // SSR-provided initial jobs — shown instantly, no loading spinner.
  // When present, the client skips the initial fetch and only refetches when filters change.
  initialJobs?: Job[]
  initialTotal?: number
}

const ALL_CATEGORIES = [
  { id: 'all', label: 'All categories' },
  { id: 'fresher', label: 'Fresher' },
  { id: 'internship', label: 'Internship' },
  { id: 'walk-in', label: 'Walk-in' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'experienced', label: 'Experienced' },
]

const WORK_MODES = ['All', 'Onsite', 'Remote', 'Hybrid']
const EMPLOYMENT_TYPES = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract']
const SORTS = [
  { id: 'recent', label: 'Most recent' },
  { id: 'salary-high', label: 'Salary: High to Low' },
  { id: 'salary-low', label: 'Salary: Low to High' },
]

export function JobsView({ fixedCategory, fixedTitle, showFilters = true, initialJobs, initialTotal }: Props) {
  const { jobFilter } = useNav()
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs || [])
  const [total, setTotal] = React.useState<number>(initialTotal ?? (initialJobs?.length ?? 0))
  // If SSR provided initial data, we're NOT loading on mount — show jobs instantly.
  // If no SSR data, show spinner until client fetch completes.
  const [loading, setLoading] = React.useState(!initialJobs || initialJobs.length === 0)
  const [q, setQ] = React.useState(jobFilter.q || '')
  const [category, setCategory] = React.useState(fixedCategory || jobFilter.category || 'all')
  const [workMode, setWorkMode] = React.useState('All')
  const [employmentType, setEmploymentType] = React.useState('All')
  const [sort, setSort] = React.useState('recent')
  const [company, setCompany] = React.useState(jobFilter.company || '')
  const [country, setCountry] = React.useState('india') // 'india' or 'all'
  const [showFilterPanel, setShowFilterPanel] = React.useState(false)
  // Debounce search input so we don't fire a fetch on every keystroke
  const [qInput, setQInput] = React.useState(jobFilter.q || '')
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextFetch = React.useRef(!!initialJobs && initialJobs.length > 0)
  const firstRender = React.useRef(true)

  // Reset state when fixedCategory changes (e.g. switching from Freshers to Internships)
  React.useEffect(() => {
    if (fixedCategory) {
      setCategory(fixedCategory)
      setQ('')
      setQInput('')
      // When category changes, we DO need to refetch even if we had initial data
      skipNextFetch.current = false
    }
  }, [fixedCategory])

  // Debounce qInput → q (so typing "embedded engineer" fires 1 fetch, not 16)
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQ(qInput)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [qInput])

  // Fetch jobs when filters change
  React.useEffect(() => {
    // Skip first render if we have SSR data (already shown)
    if (firstRender.current) {
      firstRender.current = false
      if (skipNextFetch.current) return
    }
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category && category !== 'all') params.set('category', category)
    if (workMode && workMode !== 'All') params.set('workMode', workMode)
    if (employmentType && employmentType !== 'All') params.set('employmentType', employmentType)
    if (company) params.set('company', company)
    if (sort) params.set('sort', sort)
    if (country === 'india') params.set('indiaOnly', 'true')
    params.set('limit', '200')
    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs || [])
        setTotal(d.total ?? (d.jobs || []).length)
      })
      .finally(() => setLoading(false))
  }, [q, category, workMode, employmentType, sort, company, country])

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {fixedCategory === 'fresher' && 'Fresher Jobs'}
          {fixedCategory === 'internship' && 'Internships'}
          {fixedCategory === 'walk-in' && 'Walk-in Jobs'}
          {fixedCategory === 'hidden' && 'Hidden Jobs'}
          {!fixedCategory && (fixedTitle || 'All Jobs')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {fixedCategory === 'hidden'
            ? 'Manually curated referral-only opportunities that often never appear on public boards.'
            : fixedCategory === 'walk-in'
            ? 'Direct interview drives — bring your resume and ID proof.'
            : 'Search every published opening by industry, company, experience, and location.'}
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search by role, skill, or company…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium"
        >
          <option value="india">🇮🇳 India</option>
          <option value="all">🌍 All countries</option>
        </select>
        {showFilters && (
          <button
            onClick={() => setShowFilterPanel((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors',
              showFilterPanel
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-muted'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && showFilterPanel && (
        <div className="rounded-2xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!!fixedCategory}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-60"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Work mode
            </label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Employment
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {(category !== 'all' || workMode !== 'All' || employmentType !== 'All' || q) && (
        <div className="flex flex-wrap gap-2">
          {q && (
            <Chip label={`Search: "${q}"`} onRemove={() => { setQ(''); setQInput('') }} />
          )}
          {category !== 'all' && !fixedCategory && (
            <Chip label={category} onRemove={() => setCategory('all')} />
          )}
          {workMode !== 'All' && (
            <Chip label={workMode} onRemove={() => setWorkMode('All')} />
          )}
          {employmentType !== 'All' && (
            <Chip label={employmentType} onRemove={() => setEmploymentType('All')} />
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {loading ? 'Loading…' : `${jobs.length} of ${total} job${total !== 1 ? 's' : ''}${q ? ` matching "${q}"` : ''}`}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border">
          <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {q ? `No jobs match "${q}". Try a different keyword or clear the search.` : 'No jobs match your filters.'}
          </p>
          {q && (
            <button
              onClick={() => { setQ(''); setQInput('') }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:bg-primary/20 rounded p-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
