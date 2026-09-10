'use client'

import * as React from 'react'
import {
  Loader2, Sparkles, Link2, Plus, Trash2, Edit3, Eye, TrendingUp, Building2,
  Database, Users, FileText, CheckCircle2, AlertCircle, BarChart3,
  Save, ExternalLink, Star, Clock, Search, Wand2, RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useNav } from '@/lib/nav-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'fetch' | 'add' | 'jobs' | 'companies' | 'analytics'

export function AdminDashboardView() {
  const { user, loading: userLoading } = useAuth()
  const { go } = useNav()
  const [tab, setTab] = React.useState<Tab>('fetch')

  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">You need to be logged in as an admin to access this page.</p>
        <button
          onClick={() => go('auth')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          Sign in
        </button>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <p className="font-bold mb-1">Admin access required</p>
        <p className="text-sm text-muted-foreground mb-4">
          Your account ({user.email}) doesn't have admin permissions.
        </p>
        <p className="text-xs text-muted-foreground">
          To get admin access, ask an existing admin to promote your account,
          or use the default admin: <code className="bg-muted px-1.5 py-0.5 rounded">admin@hirebase.in</code> / <code className="bg-muted px-1.5 py-0.5 rounded">admin123</code>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold mb-3">
          <Sparkles className="w-3 h-3" />
          ADMIN
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Add jobs by pasting a URL, manage existing listings, and view platform analytics.
        </p>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { id: 'fetch', label: 'Fetch from URL', icon: Link2 },
          { id: 'add', label: 'Add Manually', icon: Plus },
          { id: 'jobs', label: 'Manage Jobs', icon: FileText },
          { id: 'companies', label: 'Companies', icon: Building2 },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ] as const).map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'bg-muted hover:bg-muted/70 text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'fetch' && <FetchFromUrlTab />}
      {tab === 'add' && <AddManuallyTab />}
      {tab === 'jobs' && <ManageJobsTab />}
      {tab === 'companies' && <ManageCompaniesTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  )
}

// ============================================================================
// TAB 1: Fetch from URL — paste a URL, AI extracts + saves the job
// ============================================================================
function FetchFromUrlTab() {
  const [url, setUrl] = React.useState('')
  const [overrideTitle, setOverrideTitle] = React.useState('')
  const [overrideCompany, setOverrideCompany] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [preview, setPreview] = React.useState<any>(null)

  async function fetchPreview() {
    if (!url.trim()) {
      setError('Please paste a job URL')
      return
    }
    setError('')
    setLoading(true)
    setPreview(null)
    try {
      const r = await fetch('/api/admin/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, overrideTitle, overrideCompany }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Fetch failed')
      setPreview(d)
      toast.success('Job fetched! Review the preview below.')
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to fetch job')
    } finally {
      setLoading(false)
    }
  }

  async function saveJob() {
    if (!preview) return
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/fetch-job?save=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, overrideTitle, overrideCompany }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Save failed')
      if (d.ok && d.saved) {
        toast.success('Job saved! It is now live on the site.')
        setPreview(null)
        setUrl('')
        setOverrideTitle('')
        setOverrideCompany('')
      } else {
        setError(d.error || 'Job already exists')
      }
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold mb-1.5 block">Job posting URL</label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/1234567890"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paste any job posting URL — LinkedIn, Naukri, Indeed, company careers page, etc. The AI will fetch + extract the job details automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Override title (optional)</label>
            <input
              value={overrideTitle}
              onChange={(e) => setOverrideTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Override company (optional)</label>
            <input
              value={overrideCompany}
              onChange={(e) => setOverrideCompany(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={fetchPreview}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'Fetching + extracting…' : 'Fetch & preview job'}
        </button>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <h4 className="font-bold text-sm mb-2">How it works</h4>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> You paste a job URL (any public URL works)</li>
            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> We fetch the page content via page_reader (z-ai-web-dev-sdk)</li>
            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> AI extracts: title, company, location, skills, experience, salary, description (rewritten as Markdown)</li>
            <li className="flex gap-2"><span className="font-bold text-primary">4.</span> You review the preview, then click "Save job" to publish</li>
          </ol>
        </div>
      </div>

      {/* Preview panel */}
      <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
        {!preview && !loading && (
          <div className="text-center text-muted-foreground py-20">
            <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Job preview will appear here.</p>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Fetching + extracting job details…</span>
          </div>
        )}
        {preview && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Preview
              </h3>
              <span className="text-xs text-muted-foreground">{preview.rawTextLength} chars extracted</span>
            </div>

            <div className="space-y-3">
              <Field label="Title" value={preview.preview?.title} />
              <Field label="Company" value={preview.preview?.company} />
              <Field label="Location" value={preview.preview?.location} />
              <Field label="Category" value={preview.preview?.category} />
              <Field label="Work mode" value={preview.preview?.workMode} />
              <Field label="Experience" value={preview.preview?.experience} />
              <Field label="Employment type" value={preview.preview?.employmentType} />
              {preview.preview?.salaryMin != null && (
                <Field label="Salary range" value={`₹${preview.preview.salaryMin / 10} – ₹${preview.preview.salaryMax / 10} LPA`} />
              )}
              {preview.preview?.skills?.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-bold uppercase mb-1.5">Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.preview.skills.map((s: string) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground font-bold uppercase mb-1.5">Description (preview)</div>
                <div className="text-xs text-foreground/80 max-h-48 overflow-y-auto bg-muted/30 p-3 rounded-lg whitespace-pre-wrap">
                  {(preview.preview?.description || '').slice(0, 1500)}…
                </div>
              </div>
            </div>

            <button
              onClick={saveJob}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save job to website'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// TAB 2: Add Manually — form with all fields
// ============================================================================
function AddManuallyTab() {
  const [form, setForm] = React.useState({
    title: '', company: '', location: 'Bengaluru, India',
    description: '', skills: '', applyUrl: '',
    category: 'experienced', employmentType: 'Full-time', workMode: 'Onsite',
    experience: '0-2 Years', salaryMin: '', salaryMax: '',
    companyLogo: '', companyWebsite: '', industry: '',
    isFeatured: false,
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function save() {
    if (!form.title || !form.company || !form.location || !form.description) {
      setError('Title, company, location, and description are required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? Math.round(parseFloat(form.salaryMin) * 10) : null,
          salaryMax: form.salaryMax ? Math.round(parseFloat(form.salaryMax) * 10) : null,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Save failed')
      toast.success('Job created! It is now live.')
      setForm({ ...form, title: '', description: '', skills: '', applyUrl: '', isFeatured: false })
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Field label="Job title *" required>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </Field>
        <Field label="Company *" required>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="e.g. Google"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </Field>
        <Field label="Location *" required>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Bengaluru, India"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
              <option value="experienced">Experienced</option>
              <option value="fresher">Fresher</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
              <option value="walk-in">Walk-in</option>
              <option value="hidden">Hidden / Referral</option>
            </select>
          </Field>
          <Field label="Work mode">
            <select value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
              <option>Onsite</option><option>Remote</option><option>Hybrid</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Employment type">
            <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
            </select>
          </Field>
          <Field label="Experience required">
            <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
              <option>0 Years</option><option>0-2 Years</option><option>1-3 Years</option>
              <option>3-5 Years</option><option>5-8 Years</option><option>8+ Years</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min salary (LPA)">
            <input type="number" min="0" step="0.5" value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              placeholder="8" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          </Field>
          <Field label="Max salary (LPA)">
            <input type="number" min="0" step="0.5" value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
              placeholder="15" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          </Field>
        </div>
        <Field label="Skills (comma-separated)">
          <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="Python, React, SQL, AWS"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </Field>
        <Field label="Apply URL">
          <input value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
            placeholder="https://company.com/careers/123"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </Field>
      </div>

      <div className="space-y-4">
        <Field label="Job description *" required>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Full job description. Markdown is supported (## headings, bullet points)."
            className="w-full min-h-[300px] p-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </Field>

        <details className="rounded-xl border border-border bg-muted/30 p-4">
          <summary className="font-bold text-sm cursor-pointer">Company metadata (optional)</summary>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Company logo (emoji)">
              <input value={form.companyLogo} onChange={(e) => setForm({ ...form, companyLogo: e.target.value })}
                placeholder="🔍" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            </Field>
            <Field label="Company website">
              <input value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                placeholder="https://company.com" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            </Field>
            <Field label="Industry">
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Technology" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            </Field>
          </div>
        </details>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            className="w-4 h-4 rounded" />
          <Star className="w-4 h-4 text-amber-500" />
          Feature this job (shows on Home page)
        </label>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'Creating…' : 'Create job'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// TAB 3: Manage Jobs — list, edit, delete, feature
// ============================================================================
function ManageJobsTab() {
  const [jobs, setJobs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [filterSource, setFilterSource] = React.useState('all')

  const load = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '200' })
    if (filterSource !== 'all') params.set('source', filterSource)
    fetch(`/api/admin/jobs?${params}`)
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []))
      .finally(() => setLoading(false))
  }, [filterSource])

  React.useEffect(() => { load() }, [load])

  const filtered = jobs.filter((j) =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.name.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleFeatured(job: any) {
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isFeatured: !j.isFeatured } : j))
    try {
      await fetch('/api/admin/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, isFeatured: !job.isFeatured }),
      })
      toast.success(job.isFeatured ? 'Removed from featured' : 'Added to featured')
    } catch {
      toast.error('Failed to update')
      load()
    }
  }

  async function deleteJob(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setJobs((prev) => prev.filter((j) => j.id !== id))
    try {
      await fetch(`/api/admin/jobs?id=${id}`, { method: 'DELETE' })
      toast.success('Job deleted')
    } catch {
      toast.error('Failed to delete')
      load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title or company…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm">
          <option value="all">All sources</option>
          <option value="admin">Admin</option>
          <option value="admin-url">Admin (URL)</option>
          <option value="manual">Seed</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="ashby">Ashby</option>
          <option value="remotive">Remotive</option>
          <option value="arbeitnow">Arbeitnow</option>
          <option value="themuse">The Muse</option>
          <option value="remoteok">RemoteOK</option>
          <option value="weworkremotely">WWR</option>
        </select>
        <button onClick={load} className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-border hover:bg-muted text-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No jobs found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {filtered.slice(0, 50).map((job, i) => (
            <div key={job.id} className={cn('flex items-center gap-3 p-3 hover:bg-muted/30', i > 0 && 'border-t border-border')}>
              <div className="text-2xl shrink-0">{job.company.logo || '📌'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate flex items-center gap-2">
                  {job.title}
                  {job.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {job.company.name} · {job.location} · {job.category}
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                    {job.source}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0 hidden sm:flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {job.viewsCount}</span>
              </div>
              <button onClick={() => toggleFeatured(job)} title="Toggle featured"
                className="p-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500">
                <Star className={cn('w-4 h-4', job.isFeatured && 'fill-current text-amber-500')} />
              </button>
              <button onClick={() => deleteJob(job.id, job.title)} title="Delete"
                className="p-2 rounded-lg hover:bg-rose-500/10 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {filtered.length > 50 && (
            <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
              Showing first 50 of {filtered.length} jobs. Refine your search to narrow down.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TAB 4: Manage Companies
// ============================================================================
function ManageCompaniesTab() {
  const [companies, setCompanies] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/admin/companies')
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const filtered = companies.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.industry || '').toLowerCase().includes(search.toLowerCase())
  )

  async function deleteCompany(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all their jobs. This cannot be undone.`)) return
    setCompanies((prev) => prev.filter((c) => c.id !== id))
    try {
      await fetch(`/api/admin/companies?id=${id}`, { method: 'DELETE' })
      toast.success('Company deleted')
    } catch {
      toast.error('Failed to delete')
      load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl shrink-0">{c.logo || <Building2 className="w-6 h-6 text-muted-foreground" />}</div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.industry || 'No industry'}</div>
                  </div>
                </div>
                <button onClick={() => deleteCompany(c.id, c.name)}
                  className="p-2 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.jobCount} job{c.jobCount !== 1 && 's'}</span>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  c.hiringActivity === 'High' && 'bg-emerald-500/10 text-emerald-600',
                  c.hiringActivity === 'Medium' && 'bg-amber-500/10 text-amber-600',
                  c.hiringActivity === 'Low' && 'bg-muted text-muted-foreground'
                )}>
                  {c.hiringActivity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TAB 5: Analytics
// ============================================================================
function AnalyticsTab() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatBox icon={FileText} label="Jobs" value={data.totals.jobs} color="text-primary" />
        <StatBox icon={Building2} label="Companies" value={data.totals.companies} color="text-accent" />
        <StatBox icon={Users} label="Users" value={data.totals.users} color="text-violet-500" />
        <StatBox icon={Database} label="Applications" value={data.totals.applications} color="text-emerald-600" />
        <StatBox icon={Star} label="Featured" value={data.totals.featured} color="text-amber-500" />
        <StatBox icon={TrendingUp} label="New (24h)" value={data.totals.newToday} color="text-rose-500" />
        <StatBox icon={Eye} label="Saved" value={data.totals.saved} color="text-cyan-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top viewed jobs */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Most viewed jobs</h3>
          <div className="space-y-2">
            {data.topViewed.map((j: any, i: number) => (
              <div key={j.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-xs text-muted-foreground">{j.company}</div>
                </div>
                <div className="text-sm font-bold tabular-nums shrink-0">{j.views}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent jobs */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Recent jobs (7 days)</h3>
          <div className="space-y-2">
            {data.recentJobs.map((j: any) => (
              <div key={j.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-xs text-muted-foreground">{j.company} · {j.source}</div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Source breakdown */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Jobs by source</h3>
          <div className="space-y-2">
            {data.sourceCounts.map((s: any) => {
              const max = Math.max(...data.sourceCounts.map((x: any) => x.count), 1)
              const pct = (s.count / max) * 100
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium capitalize">{s.source}</span>
                    <span className="font-bold tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Category breakdown */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Jobs by category</h3>
          <div className="space-y-2">
            {data.categoryCounts.map((c: any) => {
              const max = Math.max(...data.categoryCounts.map((x: any) => x.count), 1)
              const pct = (c.count / max) * 100
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium capitalize">{c.category}</span>
                    <span className="font-bold tabular-nums">{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================
function Field({ label, value, required, children }: { label: string; value?: any; required?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children || <div className="text-sm font-medium">{value || '—'}</div>}
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <Icon className={cn('w-4 h-4 mb-1.5', color)} />
      <div className="text-xl font-extrabold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
    </div>
  )
}
