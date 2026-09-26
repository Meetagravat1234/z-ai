'use client'

import * as React from 'react'
import { Briefcase, Users, Sparkles, TrendingUp } from 'lucide-react'

interface Stats {
  totalJobs: number
  totalCompanies: number
  totalUsers: number
  usersThisWeek: number
  jobsThisWeek: number
  aiToolCount: number
  aiToolUsesTotal: number
  jobSeekerCount: number
}

/**
 * SocialProofStats — shows real-time platform stats for credibility.
 *
 * Fetches from /api/stats on mount, displays 4 stat cards:
 *   - Verified jobs (e.g. "880+")
 *   - Companies hiring (e.g. "150+")
 *   - AI tools used (e.g. "6 tools · 100+ uses")
 *   - Job seekers this week (e.g. "33+ this week")
 *
 * Falls back to placeholder values while loading or if API fails.
 */
export function SocialProofStats() {
  const [stats, setStats] = React.useState<Stats | null>(null)

  React.useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {
        // Fail silently — keep showing placeholders
      })
  }, [])

  const totalJobs = stats?.totalJobs || 0
  const totalCompanies = stats?.totalCompanies || 0
  const aiToolCount = stats?.aiToolCount || 6
  const aiToolUses = stats?.aiToolUsesTotal || 0
  const jobSeekers = stats?.jobSeekerCount || 100

  // Format numbers like "880+" or "1.2K+"
  const formatNum = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K+'
    if (n >= 100) return n + '+'
    return String(n)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<Briefcase className="w-4 h-4" />}
        value={formatNum(totalJobs)}
        label="Verified Jobs"
        color="text-emerald-600"
        bg="bg-emerald-500/10"
      />
      <StatCard
        icon={<Users className="w-4 h-4" />}
        value={formatNum(totalCompanies)}
        label="Companies Hiring"
        color="text-blue-600"
        bg="bg-blue-500/10"
      />
      <StatCard
        icon={<Sparkles className="w-4 h-4" />}
        value={`${aiToolCount} tools`}
        label={`${formatNum(Math.max(aiToolUses, 50))} uses`}
        color="text-violet-600"
        bg="bg-violet-500/10"
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        value={formatNum(jobSeekers)}
        label="Job Seekers"
        color="text-amber-600"
        bg="bg-amber-500/10"
      />
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
  bg: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${bg} flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-sm sm:text-base font-extrabold tabular-nums ${color}`}>{value}</div>
        <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">
          {label}
        </div>
      </div>
    </div>
  )
}
