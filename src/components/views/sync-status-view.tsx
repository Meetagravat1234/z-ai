'use client'

import * as React from 'react'
import {
  Activity,
  RefreshCw,
  Database,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  TrendingUp,
  Sparkles,
  Globe,
  Zap,
  Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Sync {
  id: string
  source: string
  sourceParam: string | null
  startedAt: string
  finishedAt: string | null
  status: string
  jobsFound: number
  jobsAdded: number
  jobsSkipped: number
  error: string | null
  durationMs: number | null
}

interface SyncStatus {
  totalJobs: number
  enrichedJobs: number
  totalCompanies: number
  newToday: number
  lastSuccess: Sync | null
  nextSyncEta: string | null
  recentSyncs: Sync[]
  sourceCounts: Array<{ source: string; count: number }>
}

const SOURCE_META: Record<string, { label: string; color: string; emoji: string }> = {
  greenhouse: { label: 'Greenhouse', color: 'bg-emerald-500', emoji: '🌱' },
  lever: { label: 'Lever', color: 'bg-blue-500', emoji: '⚡' },
  ashby: { label: 'Ashby', color: 'bg-violet-500', emoji: '🔮' },
  remotive: { label: 'Remotive', color: 'bg-amber-500', emoji: '🌍' },
  arbeitnow: { label: 'Arbeitnow', color: 'bg-rose-500', emoji: '🇩🇪' },
  themuse: { label: 'The Muse', color: 'bg-orange-500', emoji: '🎭' },
  remoteok: { label: 'RemoteOK', color: 'bg-teal-500', emoji: '🚀' },
  weworkremotely: { label: 'We Work Remotely', color: 'bg-indigo-500', emoji: '🏡' },
  'indeed-rss': { label: 'Indeed RSS', color: 'bg-blue-600', emoji: '📋' },
  'web-search': { label: 'Web Search (LinkedIn/Naukri/Internshala/etc.)', color: 'bg-cyan-500', emoji: '🔍' },
  'career-page': { label: 'Career Page Crawler', color: 'bg-pink-500', emoji: '🌐' },
  manual: { label: 'Manual', color: 'bg-slate-500', emoji: '✍️' },
}

export function SyncStatusView() {
  const [status, setStatus] = React.useState<SyncStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [triggering, setTriggering] = React.useState(false)

  const load = React.useCallback(() => {
    fetch('/api/sync/status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load()
    const id = setInterval(load, 10000) // auto-refresh every 10s
    return () => clearInterval(id)
  }, [load])

  async function triggerSync(source?: string, param?: string) {
    setTriggering(true)
    try {
      const url = source
        ? `/api/sync?source=${source}${param ? `&param=${encodeURIComponent(param)}` : ''}`
        : '/api/sync'
      const r = await fetch(url, { method: 'GET' })
      const d = await r.json()
      if (d.ok) {
        toast.success(
          `Synced ${d.source}${d.param ? ` (${d.param})` : ''}: added ${d.jobsAdded || 0} jobs`
        )
      } else {
        toast.error(`Sync failed: ${d.error || 'unknown error'}`)
      }
      load()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setTriggering(false)
    }
  }

  async function triggerParallelSync() {
    setTriggering(true)
    toast.info('Boost sync started — running 7 sources in parallel…')
    try {
      const r = await fetch('/api/sync/parallel', { method: 'GET' })
      const d = await r.json()
      if (d.ok) {
        toast.success(
          `Boost complete! ${d.sourcesRun} sources, ${d.totalJobsAdded} new jobs added in ${(d.durationMs / 1000).toFixed(0)}s`
        )
      } else {
        toast.error(`Boost failed: ${d.error || 'unknown'}`)
      }
      load()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setTriggering(false)
    }
  }

  async function triggerDeepCrawl() {
    setTriggering(true)
    toast.info('🚀 Deep Crawl started — running 30+ sources (all APIs + 12 web-search queries + 8 career pages). This takes 3-5 minutes.')
    try {
      const r = await fetch('/api/sync/deep-crawl', { method: 'GET' })
      const d = await r.json()
      if (d.ok) {
        toast.success(
          `🚀 Deep Crawl complete! ${d.sourcesRun} sources, ${d.totalJobsAdded} new jobs added in ${(d.durationMs / 1000).toFixed(0)}s`
        )
      } else {
        toast.error(`Deep crawl failed: ${d.error || 'unknown'}`)
      }
      load()
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setTriggering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const nextSyncEta = status?.nextSyncEta ? new Date(status.nextSyncEta) : null
  const now = Date.now()
  const msUntilNext = nextSyncEta ? nextSyncEta.getTime() - now : 0
  const minsUntilNext = Math.max(0, Math.floor(msUntilNext / 60000))
  const secsUntilNext = Math.max(0, Math.floor((msUntilNext % 60000) / 1000))

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          LIVE
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Job Sync Status</h1>
        <p className="text-muted-foreground mt-2">
          Real-time aggregation from public ATS systems and free job boards. Auto-syncs every 5 minutes.
        </p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          icon={Database}
          label="Total jobs"
          value={status?.totalJobs ?? 0}
          color="text-primary"
        />
        <StatBox
          icon={Building2}
          label="Companies tracked"
          value={status?.totalCompanies ?? 0}
          color="text-accent"
        />
        <StatBox
          icon={Sparkles}
          label="AI-enriched"
          value={status?.enrichedJobs ?? 0}
          color="text-violet-500"
        />
        <StatBox
          icon={TrendingUp}
          label="New (24h)"
          value={status?.newToday ?? 0}
          color="text-rose-500"
        />
      </div>

      {/* Next sync + manual trigger */}
      <section className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Next auto-sync in</div>
            <div className="font-bold text-lg tabular-nums">
              {minsUntilNext.toString().padStart(2, '0')}:
              {secsUntilNext.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => triggerSync()}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-sm disabled:opacity-60"
          >
            {triggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {triggering ? 'Syncing…' : 'Single sync'}
          </button>
          <button
            onClick={() => triggerParallelSync()}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 disabled:opacity-60"
          >
            {triggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {triggering ? 'Boosting…' : '⚡ Boost Sync (7 sources)'}
          </button>
          <button
            onClick={() => triggerDeepCrawl()}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 shadow-md"
          >
            {triggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {triggering ? 'Deep crawling…' : '🚀 Deep Crawl (all sources)'}
          </button>
        </div>
      </section>

      {/* Sources breakdown */}
      <section>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Active sources
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {status?.sourceCounts?.map((s) => {
            const meta = SOURCE_META[s.source] || { label: s.source, color: 'bg-slate-500', emoji: '📌' }
            return (
              <div
                key={s.source}
                className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
              >
                <div className="text-2xl">{meta.emoji}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.count} job{s.count !== 1 && 's'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Manual per-source triggers */}
      <section>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Trigger a specific source
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { source: 'remotive', label: 'Remotive', emoji: '🌍' },
            { source: 'arbeitnow', label: 'Arbeitnow', emoji: '🇩🇪' },
            { source: 'greenhouse', label: 'Greenhouse', emoji: '🌱', param: 'google' },
            { source: 'lever', label: 'Lever', emoji: '⚡', param: 'atlassian' },
            { source: 'ashby', label: 'Ashby', emoji: '🔮', param: 'vercel' },
          ].map((s) => (
            <button
              key={s.source}
              onClick={() => triggerSync(s.source, s.param)}
              disabled={triggering}
              className="rounded-xl border border-border bg-card p-3 hover:bg-muted transition-colors disabled:opacity-60 text-left"
            >
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="font-semibold text-xs">{s.label}</div>
              {s.param && <div className="text-[10px] text-muted-foreground">{s.param}</div>}
            </button>
          ))}
        </div>
      </section>

      {/* Recent sync runs */}
      <section>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent sync runs
        </h2>
        {status?.recentSyncs && status.recentSyncs.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {status.recentSyncs.map((sync, i) => {
              const meta = SOURCE_META[sync.source] || { label: sync.source, color: 'bg-slate-500', emoji: '📌' }
              const isRunning = sync.status === 'running'
              const isError = sync.status === 'error'
              const isSuccess = sync.status === 'success'
              return (
                <div
                  key={sync.id}
                  className={cn(
                    'flex items-start gap-3 p-4',
                    i !== status.recentSyncs.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className="text-2xl shrink-0">{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{meta.label}</span>
                      {sync.sourceParam && (
                        <span className="text-xs text-muted-foreground">
                          ({sync.sourceParam})
                        </span>
                      )}
                      {isRunning && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          RUNNING
                        </span>
                      )}
                      {isSuccess && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          SUCCESS
                        </span>
                      )}
                      {isError && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                          <XCircle className="w-2.5 h-2.5" />
                          ERROR
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Found: <strong className="text-foreground">{sync.jobsFound}</strong></span>
                      <span>Added: <strong className="text-emerald-600">{sync.jobsAdded}</strong></span>
                      <span>Skipped (dupes): <strong>{sync.jobsSkipped}</strong></span>
                      {sync.durationMs != null && (
                        <span>Duration: <strong>{(sync.durationMs / 1000).toFixed(1)}s</strong></span>
                      )}
                      <span>Started: {new Date(sync.startedAt).toLocaleTimeString()}</span>
                    </div>
                    {sync.error && (
                      <div className="mt-1 text-xs text-rose-600">{sync.error}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            No syncs yet. Click "Sync now" to start the first one.
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-border bg-muted/30 p-5">
        <h3 className="font-bold text-sm mb-3">How live aggregation works</h3>
        <ol className="space-y-2 text-sm text-foreground/80">
          <li className="flex gap-2">
            <span className="font-bold text-primary">1.</span>
            <span><strong>Every 30 minutes</strong>, the job-aggregator service triggers a <strong>parallel sync</strong> across 14+ sources simultaneously — not just one source at a time.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">2.</span>
            <span>Each cycle hits <strong>6 free job board APIs</strong> (Remotive, Arbeitnow, The Muse, RemoteOK, We Work Remotely, Indeed RSS), <strong>3 web-search queries</strong> (LinkedIn, Naukri, Internshala, Indeed, Glassdoor, Google Jobs), <strong>2 direct career-page crawlers</strong> (TCS, Infosys, Wipro, Flipkart, etc.), and random Greenhouse/Ashby companies.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">3.</span>
            <span>The <strong>web-search adapter</strong> uses z-ai-web-dev-sdk to search Google for job URLs (e.g. <code>site:linkedin.com/jobs</code>, <code>site:naukri.com</code>, <code>site:internshala.com</code>, <code>site:indeed.com</code>, <code>site:glassdoor.com</code>, <code>site:jobs.google.com</code>), then the <strong>page_reader</strong> fetches each job page's full content — works for any public site.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">4.</span>
            <span>Each new job is deduplicated by source+sourceRef or by hash of (title, company, location).</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">5.</span>
            <span>AI rewrites the raw description into clean Markdown with structured sections, and extracts skills, experience level, salary range, and category.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">6.</span>
            <span><strong>"⚡ Boost Sync"</strong>: runs 14 sources in parallel immediately — adds 20-50 new jobs in ~2 minutes.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary">7.</span>
            <span><strong>"🚀 Deep Crawl"</strong>: runs ALL 30+ sources at once (all APIs + 12 web-search queries + 8 career-page crawlers) — adds 100-200 new jobs in 3-5 minutes. Use this for the most comprehensive coverage.</span>
          </li>
        </ol>
      </section>
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className={cn('w-5 h-5 mb-2', color)} />
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  )
}
