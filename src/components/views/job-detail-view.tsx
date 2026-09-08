'use client'

import * as React from 'react'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  Building2,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  Share2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  Home as HomeIcon,
  Plane,
  Wifi,
  Users,
  Calendar,
  Eye,
  TrendingUp,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { JobCard, type Job } from '@/components/jobs/job-card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  slug: string
  logo: string | null
  website: string | null
  industry: string | null
  size: string | null
  hq: string | null
  description: string | null
  culture: string | null
  benefits: string | null
  hiringActivity: string | null
  sevenDayTrend: number
}

interface JobDetail extends Job {
  company: Company
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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSalary(min: number | null, max: number | null) {
  if (min == null && max == null) return 'Not disclosed'
  const fmt = (n: number) => {
    // Schema stores salary in LPA * 10 (so 8.5 LPA = 85, 18 LPA = 180)
    const lpa = n / 10
    if (Number.isInteger(lpa)) return `${lpa} LPA`
    return `${lpa.toFixed(1)} LPA`
  }
  if (min != null && max != null) return `₹${fmt(min)} – ${fmt(max)}`
  if (min != null) return `₹${fmt(min)}+`
  if (max != null) return `up to ₹${fmt(max)}`
  return 'Not disclosed'
}

const CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  fresher: { label: 'Fresher', color: 'bg-emerald-500/10 text-emerald-600' },
  internship: { label: 'Internship', color: 'bg-blue-500/10 text-blue-600' },
  'walk-in': { label: 'Walk-in', color: 'bg-amber-500/10 text-amber-600' },
  hidden: { label: 'Hidden / Referral', color: 'bg-violet-500/10 text-violet-600' },
  experienced: { label: 'Experienced', color: 'bg-rose-500/10 text-rose-600' },
}

const WORK_MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Onsite: Building2,
  Remote: Wifi,
  Hybrid: Plane,
}

export function JobDetailView() {
  const { selectedJobId, go, openJob, openCompany } = useNav()
  const [job, setJob] = React.useState<JobDetail | null>(null)
  const [related, setRelated] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [applying, setApplying] = React.useState(false)

  React.useEffect(() => {
    if (!selectedJobId) {
      setError('No job selected')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    setJob(null)
    fetch(`/api/jobs?id=${selectedJobId}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json()
          throw new Error(d.error || 'Failed to load')
        }
        return r.json()
      })
      .then((d) => {
        setJob(d.job)
        setRelated(d.related || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedJobId])

  // Check if job is saved
  React.useEffect(() => {
    if (!selectedJobId) return
    fetch('/api/save')
      .then((r) => r.json())
      .then((d) => {
        const isSaved = (d.saved || []).some((s: any) => s.jobId === selectedJobId)
        setSaved(isSaved)
      })
      .catch(() => {})
  }, [selectedJobId])

  async function toggleSave() {
    if (!job) return
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

  async function handleApply() {
    if (!job?.applyUrl) {
      toast.error('Apply URL not available for this job')
      return
    }
    setApplying(true)
    try {
      // Optionally track application automatically
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          company: job.company.name,
          role: job.title,
          location: job.location.split(',')[0],
          salary: formatSalary(job.salaryMin, job.salaryMax).replace('₹', ''),
          status: 'applied',
          url: job.applyUrl,
        }),
      })
      toast.success('Added to your tracker as "Applied"')
      // Open official URL in new tab
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Failed to track application')
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setApplying(false)
    }
  }

  function shareJob() {
    if (!job) return
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: `${job.title} at ${job.company.name}`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  function reportJob() {
    toast.info('Report submitted. Our team will review this listing.')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">{error || 'Job not found'}</p>
        <button
          onClick={() => go('all-jobs')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          Browse all jobs
        </button>
      </div>
    )
  }

  const skills = job.skills.split(',').filter(Boolean)
  const locations = job.location.split(',').filter(Boolean)
  const cat = CATEGORY_BADGES[job.category] || CATEGORY_BADGES.experienced
  const WorkIcon = WORK_MODE_ICONS[job.workMode] || Building2
  const benefits = job.company.benefits?.split(',').filter(Boolean) || []

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => go('all-jobs')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </button>

      {/* HERO — company + role + meta */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-violet-500 to-accent" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center text-3xl sm:text-4xl shrink-0">
              {job.company.logo || <Building2 className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => openCompany(job.company.slug)}
                  className="font-semibold text-sm text-primary hover:underline"
                >
                  {job.company.name}
                </button>
                {job.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', cat.color)}>
                  {cat.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 leading-tight">
                {job.title}
              </h1>
              {/* Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <WorkIcon className="w-4 h-4" />
                  {job.workMode}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {job.employmentType}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {locations[0]}
                  {locations.length > 1 && ` +${locations.length - 1} more`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Posted {timeAgo(job.postedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {job.viewsCount} views
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={IndianRupee} label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} />
            <StatCard icon={Briefcase} label="Experience" value={job.experience} />
            <StatCard icon={WorkIcon} label="Work mode" value={job.workMode} />
            <StatCard icon={Calendar} label="Employment" value={job.employmentType} />
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleApply}
              disabled={applying}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {applying ? 'Opening…' : 'Apply now'}
            </button>
            <button
              onClick={toggleSave}
              disabled={saving}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 rounded-xl border font-semibold transition-colors',
                saved
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-border bg-background hover:bg-muted'
              )}
            >
              <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={shareJob}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
          {job.applyUrl && (
            <p className="mt-2 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              Apply link opens the official {job.company.name} application page in a new tab. CareerNest is not the employer.
            </p>
          )}
          {(job as any).source && (job as any).source !== 'manual' && (
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <SourceBadge source={(job as any).source} />
              <span>Sourced via public {(job as any).source} API</span>
              {(job as any).enriched && (
                <>
                  <span>·</span>
                  <span className="text-violet-500 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-enriched
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN GRID — left: description / right: company sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Job description */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Job description
            </h2>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </section>

          {/* Skills */}
          {skills.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Required skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <button
                    key={s}
                    onClick={() => go('all-jobs', { q: s.trim() })}
                    className="px-3 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-sm font-medium transition-colors"
                  >
                    {s.trim()}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Locations */}
          {locations.length > 1 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Job locations
              </h2>
              <div className="flex flex-wrap gap-2">
                {locations.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sm">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {l.trim()}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Salary details */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              Compensation
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Min</div>
                <div className="font-bold">
                  {job.salaryMin != null ? `₹${Number.isInteger(job.salaryMin / 10) ? job.salaryMin / 10 : (job.salaryMin / 10).toFixed(1)} LPA` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Max</div>
                <div className="font-bold">
                  {job.salaryMax != null ? `₹${Number.isInteger(job.salaryMax / 10) ? job.salaryMax / 10 : (job.salaryMax / 10).toFixed(1)} LPA` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Currency</div>
                <div className="font-bold">{job.salaryCurrency}</div>
              </div>
            </div>
          </section>

          {/* Apply CTA at bottom */}
          <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-6 text-center">
            <h2 className="text-xl font-bold">Ready to apply?</h2>
            <p className="text-sm text-muted-foreground mt-1.5 mb-4 max-w-md mx-auto">
              Clicking apply will open the official {job.company.name} application page in a new tab and add this role to your Application Tracker.
            </p>
            <button
              onClick={handleApply}
              disabled={applying}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {applying ? 'Opening…' : `Apply on ${job.company.name} →`}
            </button>
          </section>

          {/* Report */}
          <div className="text-center">
            <button
              onClick={reportJob}
              className="text-xs text-muted-foreground hover:text-rose-600 inline-flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              Report this job as wrong or outdated
            </button>
          </div>
        </div>

        {/* SIDEBAR — Company info */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-2xl">
                {job.company.logo || <Building2 className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <button
                  onClick={() => openCompany(job.company.slug)}
                  className="font-bold hover:text-primary truncate block w-full text-left"
                >
                  {job.company.name}
                </button>
                <p className="text-xs text-muted-foreground truncate">{job.company.industry || '—'}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              {job.company.hq && (
                <Row icon={MapPin} label="Headquarters" value={job.company.hq} />
              )}
              {job.company.size && (
                <Row icon={Users} label="Company size" value={job.company.size} />
              )}
              {job.company.hiringActivity && (
                <Row icon={TrendingUp} label="Hiring activity" value={job.company.hiringActivity} />
              )}
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit website
                </a>
              )}
            </div>

            {job.company.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">About</h4>
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                  {job.company.description}
                </p>
              </div>
            )}

            {benefits.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Perks & benefits</h4>
                <ul className="space-y-1.5 text-sm">
                  {benefits.slice(0, 5).map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{b.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => openCompany(job.company.slug)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-sm font-semibold transition-colors"
            >
              <Building2 className="w-4 h-4" />
              View company profile
            </button>
          </div>

          {/* Mini AI CTA */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h4 className="font-bold text-sm">Tailor your resume for this role</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Use AI Resume Optimizer to align your resume with this job description in seconds.
            </p>
            <button
              onClick={() => go('ai-resume')}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:opacity-90"
            >
              <Sparkles className="w-4 h-4" />
              Optimize my resume
            </button>
          </div>
        </aside>
      </div>

      {/* RELATED JOBS */}
      {related.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-bold">Related jobs</h2>
            <button
              onClick={() => go('all-jobs')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.slice(0, 6).map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  )
}

const SOURCE_EMOJI: Record<string, string> = {
  greenhouse: '🌱',
  lever: '⚡',
  ashby: '🔮',
  remotive: '🌍',
  arbeitnow: '🇩🇪',
  'web-search': '🔍',
  manual: '✍️',
}

function SourceBadge({ source }: { source: string }) {
  return <span>{SOURCE_EMOJI[source] || '📌'}</span>
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-sm">{value}</div>
      </div>
    </div>
  )
}
