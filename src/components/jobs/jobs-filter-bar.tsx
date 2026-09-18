'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, MapPin, Briefcase, Clock, Wallet, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'All Experience' },
  { value: '0', label: 'Fresher (0 yrs)' },
  { value: '0-2', label: '0-2 Years' },
  { value: '1-3', label: '1-3 Years' },
  { value: '3-5', label: '3-5 Years' },
  { value: '5-8', label: '5-8 Years' },
  { value: '8', label: '8+ Years' },
]

const WORK_MODE_OPTIONS = [
  { value: '', label: 'All Modes' },
  { value: 'Onsite', label: 'Onsite' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'salary-high', label: 'Highest Salary' },
  { value: 'salary-low', label: 'Lowest Salary' },
]

const CITY_OPTIONS = [
  { value: '', label: 'All Cities' },
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Pune', label: 'Pune' },
  { value: 'Noida', label: 'Noida' },
  { value: 'Gurugram', label: 'Gurugram' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Kolkata', label: 'Kolkata' },
  { value: 'Remote', label: 'Remote' },
]

const SALARY_OPTIONS = [
  { value: '', label: 'Any Salary' },
  { value: '50', label: '₹5+ LPA' },
  { value: '100', label: '₹10+ LPA' },
  { value: '200', label: '₹20+ LPA' },
  { value: '400', label: '₹40+ LPA' },
]

export function JobsFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState(searchParams.get('q') || '')

  // Get current filter values from URL
  const currentExperience = searchParams.get('experience') || ''
  const currentWorkMode = searchParams.get('workMode') || ''
  const currentLocation = searchParams.get('location') || ''
  const currentMinSalary = searchParams.get('minSalary') || ''
  const currentSort = searchParams.get('sort') || 'recent'

  // Count active filters
  const activeFilterCount = [
    currentExperience,
    currentWorkMode,
    currentLocation,
    currentMinSalary,
  ].filter(Boolean).length

  // Build URL with all params
  function buildUrl(params: Record<string, string>) {
    const url = new URLSearchParams()
    // Keep page param if present
    const page = searchParams.get('page')
    if (page) url.set('page', page)
    // Set all provided params
    for (const [key, value] of Object.entries(params)) {
      if (value) url.set(key, value)
    }
    // Remove page if we're changing filters (start from page 1)
    if (params.q !== undefined || params.experience !== undefined || params.workMode !== undefined ||
        params.location !== undefined || params.minSalary !== undefined || params.sort !== undefined) {
      url.delete('page')
    }
    const qs = url.toString()
    return qs ? `/jobs?${qs}` : '/jobs'
  }

  // Debounced search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  function onSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value, experience: currentExperience, workMode: currentWorkMode, location: currentLocation, minSalary: currentMinSalary, sort: currentSort }))
    }, 400)
  }

  function onFilterChange(key: string, value: string) {
    router.push(buildUrl({
      q: searchInput,
      experience: key === 'experience' ? value : currentExperience,
      workMode: key === 'workMode' ? value : currentWorkMode,
      location: key === 'location' ? value : currentLocation,
      minSalary: key === 'minSalary' ? value : currentMinSalary,
      sort: key === 'sort' ? value : currentSort,
    }))
  }

  function clearAll() {
    setSearchInput('')
    router.push('/jobs')
  }

  return (
    <div className="space-y-3">
      {/* Search bar + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by job title, skill, or company (e.g. embedded, Python, React)…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors whitespace-nowrap',
            showFilters || activeFilterCount > 0
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card hover:bg-muted'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter dropdown */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Location */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> Location
              </label>
              <select
                value={currentLocation}
                onChange={(e) => onFilterChange('location', e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {CITY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Experience
              </label>
              <select
                value={currentExperience}
                onChange={(e) => onFilterChange('experience', e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {EXPERIENCE_OPTIONS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            {/* Work Mode */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                <Briefcase className="w-3 h-3" /> Work Mode
              </label>
              <select
                value={currentWorkMode}
                onChange={(e) => onFilterChange('workMode', e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {WORK_MODE_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>

            {/* Min Salary */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                <Wallet className="w-3 h-3" /> Min Salary
              </label>
              <select
                value={currentMinSalary}
                onChange={(e) => onFilterChange('minSalary', e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {SALARY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                Sort By
              </label>
              <select
                value={currentSort}
                onChange={(e) => onFilterChange('sort', e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter chips + clear */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {currentLocation && (
                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                  {currentLocation} <button onClick={() => onFilterChange('location', '')} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )}
              {currentExperience && (
                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                  {EXPERIENCE_OPTIONS.find(e => e.value === currentExperience)?.label} <button onClick={() => onFilterChange('experience', '')} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )}
              {currentWorkMode && (
                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                  {currentWorkMode} <button onClick={() => onFilterChange('workMode', '')} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )}
              {currentMinSalary && (
                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                  {SALARY_OPTIONS.find(s => s.value === currentMinSalary)?.label} <button onClick={() => onFilterChange('minSalary', '')} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )}
              <button onClick={clearAll} className="text-xs text-rose-500 hover:underline ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
