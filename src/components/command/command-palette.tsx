'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Search,
  Briefcase,
  Building2,
  BookOpen,
  Sparkles,
  Target,
  Compass,
  Home as HomeIcon,
  Mic,
  Wallet,
  FileText,
  Crown,
} from 'lucide-react'
import { useNav, type ViewId } from '@/lib/nav-store'
import { cn } from '@/lib/utils'

const NAV_COMMANDS: Array<{
  id: ViewId
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  url: string
}> = [
  { id: 'home', label: 'Home', hint: 'Dashboard', icon: HomeIcon, group: 'Pages', url: '/' },
  { id: 'all-jobs', label: 'All Jobs', hint: 'Browse + search all jobs', icon: Briefcase, group: 'Pages', url: '/jobs' },
  { id: 'companies', label: 'Companies', hint: 'Browse hiring companies', icon: Building2, group: 'Pages', url: '/companies' },
  { id: 'insights', label: 'Career Insights', hint: 'Blog + articles', icon: BookOpen, group: 'Pages', url: '/insights' },
  { id: 'skill-tests', label: 'Skill Tests', hint: 'Test your knowledge', icon: Target, group: 'Pages', url: '/skill-tests' },
  { id: 'discover', label: 'Discover Jobs', hint: 'Curated collections', icon: Compass, group: 'Pages', url: '/discover' },
  { id: 'ai-resume', label: 'AI Resume Optimizer', hint: 'Tailor resume to any JD', icon: FileText, group: 'AI Tools', url: '/ai-tools/resume-optimizer' },
  { id: 'ats-score', label: 'ATS Score Checker', hint: 'Check ATS compatibility', icon: FileText, group: 'AI Tools', url: '/ai-tools/ats-score' },
  { id: 'ai-cover-letter', label: 'AI Cover Letter', hint: 'Generate cover letter', icon: Sparkles, group: 'AI Tools', url: '/ai-tools/cover-letter' },
  { id: 'ai-mock-interview', label: 'AI Mock Interview', hint: 'Practice with AI', icon: Mic, group: 'AI Tools', url: '/ai-tools/mock-interview' },
  { id: 'skill-gap', label: 'Skill Gap Analyzer', hint: 'Find missing skills', icon: Target, group: 'AI Tools', url: '/ai-tools/skill-gap' },
  { id: 'ai-salary', label: 'Salary Predictor', hint: 'Predict salary range', icon: Wallet, group: 'AI Tools', url: '/ai-tools/salary-predictor' },
  { id: 'freshers', label: 'Fresher Jobs', hint: '0 years experience', icon: Briefcase, group: 'Categories', url: '/jobs/fresher' },
  { id: 'internships', label: 'Internships', hint: 'Student roles', icon: Briefcase, group: 'Categories', url: '/jobs/internship' },
  { id: 'walk-in', label: 'Walk-in Jobs', hint: 'Direct interview drives', icon: Briefcase, group: 'Categories', url: '/jobs/walk-in' },
  { id: 'hidden', label: 'Hidden Jobs', hint: 'Referral-only', icon: Briefcase, group: 'Categories', url: '/jobs/hidden' },
  { id: 'upgrade', label: 'Upgrade to Pro', hint: '₹299/month', icon: Crown, group: 'Account', url: '/upgrade' },
  { id: 'auth', label: 'Sign in / Sign up', hint: 'Log in or create account', icon: Sparkles, group: 'Account', url: '/auth' },
  { id: 'saved', label: 'Saved Jobs', hint: 'Your bookmarks', icon: Briefcase, group: 'Account', url: '/saved' },
  { id: 'tracker', label: 'Application Tracker', hint: 'Track applications', icon: Briefcase, group: 'Account', url: '/tracker' },
]

interface JobResult {
  id: string
  title: string
  company: { name: string }
  location: string
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useNav()
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const [jobResults, setJobResults] = React.useState<JobResult[]>([])
  const [searchingJobs, setSearchingJobs] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
      if (e.key === 'Escape' && commandOpen) {
        setCommandOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen, commandOpen])

  React.useEffect(() => {
    if (commandOpen) {
      setQuery('')
      setActive(0)
      setJobResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandOpen])

  // Search jobs when query is > 2 chars
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setJobResults([])
      setSearchingJobs(false)
      return
    }
    setSearchingJobs(true)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/jobs?q=${encodeURIComponent(query)}&limit=8`)
        .then(r => r.json())
        .then(d => setJobResults(d.jobs || []))
        .catch(() => setJobResults([]))
        .finally(() => setSearchingJobs(false))
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Filter nav commands
  const filteredNav = NAV_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.hint.toLowerCase().includes(query.toLowerCase()) ||
      c.group.toLowerCase().includes(query.toLowerCase())
  )

  // Combined results for keyboard navigation
  const allResults = [
    ...jobResults.map(j => ({ type: 'job' as const, ...j })),
    ...filteredNav.map(c => ({ type: 'nav' as const, ...c })),
  ]

  function selectResult(idx: number) {
    const result = allResults[idx]
    if (!result) return
    setCommandOpen(false)
    if (result.type === 'job') {
      window.location.href = `/jobs/${result.id}-${result.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)}`
    } else {
      window.location.href = result.url
    }
  }

  if (!commandOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, allResults.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                selectResult(active)
              }
            }}
            placeholder="Search jobs, companies, or navigate…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[450px] overflow-y-auto p-2">
          {allResults.length === 0 && query.length > 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchingJobs ? 'Searching jobs…' : `No results for "${query}"`}
            </div>
          )}
          {allResults.length === 0 && query.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Start typing to search jobs, or select a page below
            </div>
          )}

          {/* Job search results */}
          {jobResults.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Jobs ({jobResults.length})
              </div>
              {jobResults.map((job, i) => {
                const idx = i
                const isActive = idx === active
                return (
                  <button
                    key={job.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => selectResult(idx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{job.title}</div>
                      <div className={cn('text-xs truncate', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {job.company?.name} · {job.location}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Navigation results */}
          {filteredNav.length > 0 && (
            <div>
              {jobResults.length > 0 && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pages
                </div>
              )}
              {filteredNav.map((c) => {
                const idx = jobResults.length + filteredNav.indexOf(c)
                const isActive = idx === active
                const Icon = c.icon
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => selectResult(idx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.label}</div>
                      <div className={cn('text-xs truncate', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {c.hint}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>↑↓ to navigate · Enter to select</span>
          <span>Powered by Hirebase</span>
        </div>
      </div>
    </div>
  )
}
