'use client'

import * as React from 'react'
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
  Sparkles,
  Mic,
  Wallet,
  KanbanSquare,
  X,
  Sun,
  Moon,
  Home as HomeIcon,
  Search,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNav, type ViewId } from '@/lib/nav-store'
import { cn } from '@/lib/utils'

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
      { id: 'ai-cover-letter', label: 'AI Cover Letter', icon: Sparkles, accent: 'ai', badge: 'NEW' },
      { id: 'ai-mock-interview', label: 'AI Mock Interview', icon: Mic, accent: 'ai', badge: 'NEW' },
      { id: 'ai-salary', label: 'Salary Predictor', icon: Wallet, accent: 'ai', badge: 'NEW' },
    ],
  },
  {
    label: 'My Career',
    items: [
      { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
      { id: 'tracker', label: 'Application Tracker', icon: KanbanSquare },
    ],
  },
]

export function Sidebar() {
  const { view, go, sidebarOpen, setSidebarOpen } = useNav()
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
          <button
            onClick={() => go('home')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-extrabold text-lg text-sidebar-foreground tracking-tight">
                Career<span className="text-primary">Nest</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 font-semibold">
                Your Career, Our Intelligence
              </div>
            </div>
          </button>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = view === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.id)}
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
                            active
                              ? 'bg-white/20'
                              : 'bg-gradient-to-r from-violet-500 to-primary text-white'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

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
          <button
            onClick={() => go('pricing')}
            className="w-full bg-primary text-primary-foreground text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Sign In to Enable
          </button>
        </div>
      </aside>
    </>
  )
}

export function TopNav() {
  const { setSidebarOpen, setCommandOpen, go } = useNav()
  const { theme, setTheme } = useTheme()
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

      <button
        onClick={() => go('tracker')}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
      >
        <KanbanSquare className="w-4 h-4" />
        Tracker
      </button>

      <button
        onClick={() => go('pricing')}
        className="hidden sm:inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Sign in
      </button>
    </header>
  )
}

export function BottomNav() {
  const { view, go } = useNav()
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
          const active = view === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
    </nav>
  )
}
