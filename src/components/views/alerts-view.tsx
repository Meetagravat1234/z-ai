'use client'

import * as React from 'react'
import { Loader2, Bell, Plus, Trash2, Mail, CheckCircle2, AlertCircle, BellOff, Search, MapPin, Briefcase, IndianRupee } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useNav } from '@/lib/nav-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  query: string | null
  category: string | null
  workMode: string | null
  location: string | null
  minSalary: number | null
  email: string
  frequency: string
  isActive: boolean
  lastSentAt: string | null
  createdAt: string
}

export function AlertsView() {
  const { user, loading: userLoading } = useAuth()
  const { go } = useNav()
  const [alerts, setAlerts] = React.useState<Alert[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)

  // Form state
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [workMode, setWorkMode] = React.useState('all')
  const [location, setLocation] = React.useState('')
  const [minSalary, setMinSalary] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [frequency, setFrequency] = React.useState('daily')
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => {
        setAlerts(d.alerts || [])
        if (user?.email && !email) setEmail(user.email)
      })
      .finally(() => setLoading(false))
  }, [user, email])

  React.useEffect(() => {
    if (user) load()
    else setLoading(false)
  }, [user, load])

  async function createAlert() {
    if (!email) {
      toast.error('Email is required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || null,
          category: category === 'all' ? null : category,
          workMode: workMode === 'all' ? null : workMode,
          location: location || null,
          minSalary: minSalary || null,
          email,
          frequency,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      toast.success('Alert created! You will receive job matches via email.')
      setShowForm(false)
      setQuery(''); setLocation(''); setMinSalary('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
      toast.success('Alert deleted')
    } catch {
      load()
    }
  }

  async function toggleAlert(alert: Alert) {
    setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, isActive: !a.isActive } : a))
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, isActive: !alert.isActive }),
      })
    } catch {
      load()
    }
  }

  if (userLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!user) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border">
        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">Sign in to create job alerts.</p>
        <button onClick={() => go('auth')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
          <Bell className="w-3 h-3" />
          JOB ALERTS
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Email Job Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Get matching jobs delivered to your inbox. Set up multiple alerts with different criteria.
        </p>
      </header>

      {/* Create alert button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Create new alert
        </button>
      )}

      {/* Create alert form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            New Job Alert
          </h3>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Email address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Keywords</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Python, React, Data Scientist"
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru, Remote"
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
                <option value="all">All categories</option>
                <option value="fresher">Fresher</option>
                <option value="internship">Internship</option>
                <option value="experienced">Experienced</option>
                <option value="remote">Remote</option>
                <option value="walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Work mode</label>
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
                <option value="all">Any mode</option>
                <option value="Onsite">Onsite</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Min salary (LPA)</label>
              <input type="number" min="0" step="0.5" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} placeholder="e.g. 8"
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted">
                Cancel
              </button>
              <button onClick={createAlert} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {saving ? 'Creating…' : 'Create alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing alerts */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No alerts yet. Create one above to get started!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={cn("rounded-2xl border bg-card p-4", alert.isActive ? "border-border" : "border-border opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {alert.isActive ? (
                      <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-semibold text-sm truncate">{alert.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {alert.query && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{alert.query}</span>}
                    {alert.category && <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{alert.category}</span>}
                    {alert.location && <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">📍 {alert.location}</span>}
                    {alert.workMode && <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{alert.workMode}</span>}
                    {alert.minSalary && <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">≥ ₹{alert.minSalary / 10} LPA</span>}
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{alert.frequency}</span>
                  </div>
                  {alert.lastSentAt && (
                    <div className="text-[10px] text-muted-foreground mt-1.5">
                      Last sent: {new Date(alert.lastSentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleAlert(alert)} title={alert.isActive ? "Pause" : "Resume"}
                    className="p-2 rounded-lg hover:bg-muted">
                    {alert.isActive ? <Bell className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} title="Delete"
                    className="p-2 rounded-lg hover:bg-rose-500/10 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-amber-600" /> How email alerts work</h3>
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li><strong className="text-foreground">1.</strong> Set up an alert with your criteria (keywords, location, salary, etc.)</li>
          <li><strong className="text-foreground">2.</strong> Our system checks for new matching jobs every day</li>
          <li><strong className="text-foreground">3.</strong> You get an email with up to 20 matching jobs — with direct apply links</li>
          <li><strong className="text-foreground">4.</strong> You can pause or delete alerts anytime</li>
        </ol>
      </div>
    </div>
  )
}
