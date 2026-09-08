'use client'

import * as React from 'react'
import { MapPin, Briefcase, IndianRupee, Clock, Bookmark, CheckCircle2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNav } from '@/lib/nav-store'
import { toast } from 'sonner'

export interface Job {
  id: string
  title: string
  category: string
  employmentType: string
  workMode: string
  experience: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  location: string
  skills: string
  description: string
  applyUrl: string | null
  postedAt: string
  verified: boolean
  isFeatured: boolean
  viewsCount: number
  source?: string
  sourceRef?: string | null
  enriched?: boolean
  createdAt?: string
  company: {
    id: string
    name: string
    slug: string
    logo: string | null
    industry: string | null
  }
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2419200) return `${Math.floor(diff / 604800)}w ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatSalary(min: number | null, max: number | null) {
  if (min == null && max == null) return null
  const fmt = (n: number) => {
    // Schema stores salary in LPA * 10 (so 8.5 LPA = 85, 18 LPA = 180)
    const lpa = n / 10
    if (Number.isInteger(lpa)) return `${lpa} LPA`
    return `${lpa.toFixed(1)} LPA`
  }
  if (min != null && max != null) return `₹${fmt(min)} – ${fmt(max)}`
  if (min != null) return `₹${fmt(min)}+`
  if (max != null) return `up to ₹${fmt(max)}`
  return null
}

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  const { openJob } = useNav()
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const salary = formatSalary(job.salaryMin, job.salaryMax)
  const skills = job.skills.split(',').filter(Boolean).slice(0, 4)
  const locations = job.location.split(',').filter(Boolean)
  const isNew = (() => {
    const ts = job.createdAt ? new Date(job.createdAt).getTime() : new Date(job.postedAt).getTime()
    return Date.now() - ts < 24 * 60 * 60 * 1000
  })()
  const sourceEmoji: Record<string, string> = {
    greenhouse: '🌱', lever: '⚡', ashby: '🔮', remotive: '🌍', arbeitnow: '🇩🇪',
    'web-search': '🔍', 'career-page': '🌐',
    themuse: '🎭', remoteok: '🚀', weworkremotely: '🏡', 'indeed-rss': '📋',
  }
  const sourceIcon = job.source && sourceEmoji[job.source]

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation()
    setSaving(true)
    try {
      if (saved) {
        await fetch(`/api/save?jobId=${job.id}`, { method: 'DELETE' })
        setSaved(false)
        toast.success('Removed from saved')
      } else {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        })
        setSaved(true)
        toast.success('Saved to your list')
      }
    } catch {
      toast.error('Could not update saved jobs')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={() => openJob(job.id)}
      className={cn(
        'group cursor-pointer rounded-2xl border border-border bg-card p-5 card-lift relative',
        compact && 'p-4',
        isNew && 'border-emerald-500/40'
      )}
    >
      {isNew && (
        <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-md inline-flex items-center gap-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          NEW
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-xl shrink-0 border border-border">
          {job.company.logo || <Building2 className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground font-medium truncate flex items-center gap-1.5">
                {job.company.name}
                {sourceIcon && <span title={`Source: ${job.source}`}>{sourceIcon}</span>}
              </div>
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {job.title}
              </h3>
            </div>
            {job.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {job.employmentType}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {locations[0]}
              {locations.length > 1 && ` +${locations.length - 1}`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(job.postedAt)}
            </span>
          </div>

          {!compact && (
            <>
              {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center font-semibold text-foreground">
                    {job.workMode}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{job.experience}</span>
                  {salary && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="inline-flex items-center font-semibold text-primary">
                        <IndianRupee className="w-3 h-3" />
                        {salary.replace('₹', '')}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={toggleSave}
                  disabled={saving}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    saved
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted hover:bg-muted/70 text-foreground'
                  )}
                >
                  <Bookmark className={cn('w-3.5 h-3.5', saved && 'fill-current')} />
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
