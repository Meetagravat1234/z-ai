'use client'

import * as React from 'react'
import {
  Search,
  LayoutDashboard,
  Compass,
  Briefcase,
  Building2,
  BookOpen,
  Microscope,
  GraduationCap,
  UserCheck,
  Users,
  EyeOff,
  Bookmark,
  FileText,
  Sparkles,
  Mic,
  Wallet,
  KanbanSquare,
  Home as HomeIcon,
  Target,
  BarChart3,
  GitCompare,
  User,
  Shield,
} from 'lucide-react'
import { useNav, type ViewId } from '@/lib/nav-store'
import { cn } from '@/lib/utils'

const COMMANDS: Array<{
  id: ViewId
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  group: string
}> = [
  { id: 'home', label: 'Home', hint: 'Go to dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { id: 'discover', label: 'Discover Jobs', hint: 'Curated collections', icon: Compass, group: 'Navigation' },
  { id: 'all-jobs', label: 'All Jobs', hint: 'Search and filter all jobs', icon: Briefcase, group: 'Navigation' },
  { id: 'companies', label: 'Companies', hint: 'Browse hiring companies', icon: Building2, group: 'Navigation' },
  { id: 'insights', label: 'Career Insights', hint: 'Read editorial articles', icon: BookOpen, group: 'Navigation' },
  { id: 'ground-truth', label: 'Ground Truth', hint: 'How we verify jobs', icon: Microscope, group: 'Navigation' },
  { id: 'freshers', label: 'Fresher Jobs', hint: '0-years-experience roles', icon: GraduationCap, group: 'Categories' },
  { id: 'internships', label: 'Internships', hint: 'Student & college roles', icon: UserCheck, group: 'Categories' },
  { id: 'walk-in', label: 'Walk-in Jobs', hint: 'Direct interview drives', icon: Users, group: 'Categories' },
  { id: 'hidden', label: 'Hidden Jobs', hint: 'Referral-only opportunities', icon: EyeOff, group: 'Categories' },
  { id: 'ai-resume', label: 'AI Resume Optimizer', hint: 'Tailor your resume to any JD', icon: FileText, group: 'AI Tools' },
  { id: 'ats-score', label: 'ATS Score Checker', hint: 'Check if your resume passes ATS', icon: FileText, group: 'AI Tools' },
  { id: 'ai-cover-letter', label: 'AI Cover Letter', hint: 'Generate a personalized cover letter', icon: Sparkles, group: 'AI Tools' },
  { id: 'ai-mock-interview', label: 'AI Mock Interview', hint: 'Practice with an AI interviewer', icon: Mic, group: 'AI Tools' },
  { id: 'skill-gap', label: 'Skill Gap Analyzer', hint: 'Find skills missing for your target role', icon: Target, group: 'AI Tools' },
  { id: 'ai-salary', label: 'Salary Predictor', hint: 'Predict realistic salary ranges', icon: Wallet, group: 'AI Tools' },
  { id: 'salary-dashboard', label: 'Salary Dashboard', hint: 'Charts: salary by role, company, city, experience', icon: BarChart3, group: 'Insights & Tools' },
  { id: 'question-bank', label: 'Interview Question Bank', hint: 'Searchable questions with AI model answers', icon: BookOpen, group: 'Insights & Tools' },
  { id: 'compare-jobs', label: 'Compare Jobs', hint: 'Compare 2-3 jobs side by side', icon: GitCompare, group: 'Insights & Tools' },
  { id: 'saved', label: 'Saved Jobs', hint: 'Your bookmarked jobs', icon: Bookmark, group: 'My Career' },
  { id: 'tracker', label: 'Application Tracker', hint: 'Kanban board for applications', icon: KanbanSquare, group: 'My Career' },
  { id: 'profile', label: 'My Profile', hint: 'Update your name, skills, target role, preferences', icon: User, group: 'Account' },
  { id: 'auth', label: 'Sign in / Sign up', hint: 'Log in or create a free account', icon: User, group: 'Account' },
  { id: 'admin', label: 'Admin Dashboard', hint: 'Add jobs by URL, manage jobs/companies, view analytics', icon: Shield, group: 'Admin' },
]

export function CommandPalette() {
  const { commandOpen, setCommandOpen, go } = useNav()
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

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
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandOpen])

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.hint.toLowerCase().includes(query.toLowerCase()) ||
      c.group.toLowerCase().includes(query.toLowerCase())
  )

  const groups = Array.from(new Set(filtered.map((c) => c.group)))

  function execute(c: typeof COMMANDS[number]) {
    go(c.id)
    setCommandOpen(false)
  }

  if (!commandOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[15vh]"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
                setActive((a) => Math.min(a + 1, filtered.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                if (filtered[active]) execute(filtered[active])
              }
            }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No matches for "{query}"
            </div>
          )}
          {groups.map((group) => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              {filtered
                .filter((c) => c.group === group)
                .map((c) => {
                  const idx = filtered.indexOf(c)
                  const Icon = c.icon
                  const isActive = idx === active
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => execute(c)}
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
          ))}
        </div>
      </div>
    </div>
  )
}
