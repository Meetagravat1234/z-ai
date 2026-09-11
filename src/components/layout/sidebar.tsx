'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
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
  FileCheck,
  Sparkles,
  Mic,
  Wallet,
  KanbanSquare,
  X,
  Sun,
  Moon,
  Home as HomeIcon,
  Search,
  Activity,
  Target,
  BarChart3,
  GitCompare,
  User,
  Shield,
  Bell,
  Crown,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNav, type ViewId } from '@/lib/nav-store'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

// Maps each sidebar nav item to its real URL.
// This is what makes the URL bar update when you click sidebar items.
const VIEW_URLS: Record<string, string> = {
  home: '/',
  discover: '/discover',
  'all-jobs': '/jobs',
  companies: '/companies',
  insights: '/insights',
  'ground-truth': '/ground-truth',
  freshers: '/jobs/fresher',
  internships: '/jobs/internship',
  'walk-in': '/jobs/walk-in',
  hidden: '/jobs/hidden',
  'ai-resume': '/ai-tools/resume-optimizer',
  'ats-score': '/ai-tools/ats-score',
  'ai-cover-letter': '/ai-tools/cover-letter',
  'ai-mock-interview': '/ai-tools/mock-interview',
  'skill-gap': '/ai-tools/skill-gap',
  'ai-salary': '/ai-tools/salary-predictor',
  'salary-dashboard': '/salary-dashboard',
  'question-bank': '/question-bank',
  'compare-jobs': '/compare-jobs',
  saved: '/saved',
  tracker: '/tracker',
  alerts: '/alerts',
  profile: '/profile',
  admin: '/admin',
  'sync-status': '/sync-status',
  about: '/about',
  pricing: '/pricing',
  auth: '/auth',
}

const navGroups: Array<{
  label: string
  items: Array<{
    id: ViewId
    label: string
    icon: React.ComponentType<{ className?: string }>
    accent?: 'default' | 'ai'
    badge?: string
  }>
}> = [
  {
    label: 'Find Jobs',
    items: [
      { id: 'home', label: 'Home', icon: LayoutDashboard },
      { id: 'discover', label: 'Discover Jobs', icon: Compass },
      { id: 'all-jobs', label: 'All Jobs', icon: Briefcase },
      { id: 'companies', label: 'Companies', icon: Building2 },
      { id: 'insights', label: 'Career Insights', icon: BookOpen },
      { id: 'ground-truth', label: 'Ground Truth', icon: Microscope },
    ],
  },
  {
    label: 'Special Categories',
    items: [
      { id: 'freshers', label: 'Freshers', icon: GraduationCap },
      { id: 'internships', label: 'Internships', icon: UserCheck },
      { id: 'walk-in', label: 'Walk-in Jobs', icon: Users },
      { id: 'hidden', label: 'Hidden Jobs', icon: EyeOff },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { id: 'ai-resume', label: 'AI Resume Optimizer', icon: FileText, accent: 'ai', badge: 'NEW' },
      { id: 'ats-score', label: 'ATS Score Checker', icon: FileCheck, accent: 'ai', badge: 'NEW' },
      { id: 'ai-cover-letter', label: 'AI Cover Letter', icon: Sparkles, accent: 'ai', badge: 'NEW' },
      { id: 'ai-mock-interview', label: 'AI Mock Interview', icon: Mic, accent: 'ai', badge: 'NEW' },
      { id: 'skill-gap', label: 'Skill Gap Analyzer', icon: Target, accent: 'ai', badge: 'NEW' },
      { id: 'ai-salary', label: 'Salary Predictor', icon: Wallet, accent: 'ai', badge: 'NEW' },
    ],
  },
  {
    label: 'Insights & Tools',
    items: [
      { id: 'salary-dashboard', label: 'Salary Dashboard', icon: BarChart3 },
      { id: 'question-bank', label: 'Interview Questions', icon: BookOpen },
      { id: 'compare-jobs', label: 'Compare Jobs', icon: GitCompare },
    ],
  },
  {
    label: 'My Career',
    items: [
      { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
      { id: 'tracker', label: 'Application Tracker', icon: KanbanSquare },
      { id: 'alerts', label: 'Job Alerts', icon: Bell },
      { id: 'profile', label: 'My Profile', icon: User },
    ],
  },
]

export function Sidebar() {
  const { view, go, sidebarOpen, setSidebarOpen } = useNav()
  const { user, isDemo } = useAuth()
  const pathname = usePathname()
  const isAdmin = user?.role === 'admin'
  const groups = isAdmin
    ? [...navGroups, {
        label: 'Admin',
        items: [
          { id: 'admin' as ViewId, label: 'Admin Dashboard', icon: Shield },
          { id: 'sync-status' as ViewId, label: 'Live Sync Status', icon: Activity, badge: 'LIVE' },
        ],
      }]
    : navGroups
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-30',
          'w-[260px] h-screen shrink-0',
          'bg-sidebar text-sidebar-foreground',
          'flex flex-col',
          'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border shrink-0">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-extrabold text-lg text-sidebar-foreground tracking-tight">
                Hire<span className="text-primary">base</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                India's #1 AI Job Portal
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const itemUrl = VIEW_URLS[item.id] || '/'
                  // Determine active state based on the actual URL pathname, not Zustand view state.
                  // This makes the sidebar highlight the right item on full page loads.
                  const active = pathname === itemUrl
                    || (itemUrl !== '/' && pathname?.startsWith(itemUrl))
                    || (item.id === 'home' && pathname === '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.id}
                      href={itemUrl}
                      prefetch
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm',
                        active
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                          : item.accent === 'ai'
                          ? 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          item.accent === 'ai' && !active && 'text-violet-400'
                        )}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                            item.badge === 'LIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 inline-flex items-center gap-1'
                              : active
                              ? 'bg-white/20'
                              : 'bg-gradient-to-r from-violet-500 to-primary text-white'
                          )}
                        >
                          {item.badge === 'LIVE' && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                            </span>
                          )}
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pro upgrade CTA — only for non-Pro users */}
        {(!user || isDemo || !((user as any).subscriptionTier === 'pro' || (user as any).subscriptionTier === 'recruiter') || !((user as any).subscriptionEndsAt && new Date((user as any).subscriptionEndsAt) > new Date())) && (
          <div className="m-3 mt-0 p-4 rounded-2xl bg-gradient-to-br from-violet-500/15 to-primary/15 border border-violet-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-violet-300" />
              <span className="text-sm font-bold text-sidebar-foreground">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-sidebar-foreground/70 mb-3">
              Unlock 10× AI tool usage + priority alerts + PDF export.
            </p>
            <Link
              href="/upgrade"
              onClick={() => setSidebarOpen(false)}
              className="w-full bg-gradient-to-r from-violet-500 to-primary text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity inline-block text-center"
            >
              Get Pro from ₹299/mo →
            </Link>
          </div>
        )}

        {/* Pro badge — show this instead of upgrade CTA when user is Pro */}
        {user && !isDemo && ((user as any).subscriptionTier === 'pro' || (user as any).subscriptionTier === 'recruiter') && ((user as any).subscriptionEndsAt && new Date((user as any).subscriptionEndsAt) > new Date()) && (
          <div className="m-3 mt-0 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
            <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-emerald-300">Pro Active</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                Until {new Date((user as any).subscriptionEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        )}

        <div className="m-3 p-4 rounded-2xl bg-primary/15 border border-primary/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔔</span>
            <span className="text-sm font-bold text-sidebar-foreground">
              Job Alerts
            </span>
          </div>
          <p className="text-xs text-sidebar-foreground/70 mb-3">
            Get jobs matching your profile in your inbox.
          </p>
          <Link
            href={user && !isDemo ? '/alerts' : '/auth'}
            onClick={() => setSidebarOpen(false)}
            className="w-full bg-primary text-primary-foreground text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity inline-block text-center"
          >
            {user && !isDemo ? 'Manage Alerts' : 'Sign In to Enable'}
          </Link>
        </div>
      </aside>
    </>
  )
}

export function TopNav() {
  const { setSidebarOpen, setCommandOpen } = useNav()
  const { theme, setTheme } = useTheme()
  const { user, loading, isDemo } = useAuth()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-md flex items-center gap-3 px-4 lg:px-6">
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-muted"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Compass className="w-5 h-5" />
      </button>

      <button
        onClick={() => setCommandOpen(true)}
        className="flex-1 max-w-md flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-sm text-muted-foreground transition-colors text-left"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 truncate">Search jobs, companies, articles…</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-background">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Toggle theme"
      >
        {mounted && theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <Link
        href="/tracker"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
      >
        <KanbanSquare className="w-4 h-4" />
        Tracker
      </Link>

      {loading ? (
        <div className="w-20 h-9 rounded-lg bg-muted animate-pulse" />
      ) : user && !isDemo ? (
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          title={`${user.email} — view profile`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
            {user.name || 'Profile'}
          </span>
        </Link>
      ) : (
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
      )}
    </header>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const items: Array<{ id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'all-jobs', label: 'Jobs', icon: Briefcase },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'tracker', label: 'Tracker', icon: KanbanSquare },
  ]
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex">
        {items.map((item) => {
          const itemUrl = VIEW_URLS[item.id] || '/'
          const active = pathname === itemUrl
            || (itemUrl !== '/' && pathname?.startsWith(itemUrl))
            || (item.id === 'home' && pathname === '/')
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={itemUrl}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
    </nav>
  )
}
