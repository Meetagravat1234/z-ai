'use client'

import * as React from 'react'
import { Loader2, Plus, X, ExternalLink, Trash2, KanbanSquare } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  company: string
  role: string
  location: string | null
  salary: string | null
  status: string
  url: string | null
  notes: string | null
  appliedAt: string
  job?: { company: { name: string; logo: string | null } } | null
}

const COLUMNS = [
  { id: 'wishlist', label: 'Wishlist', color: 'bg-slate-500' },
  { id: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { id: 'screening', label: 'Screening', color: 'bg-amber-500' },
  { id: 'interview', label: 'Interview', color: 'bg-violet-500' },
  { id: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
]

export function TrackerView() {
  const [apps, setApps] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draggedId, setDraggedId] = React.useState<string | null>(null)
  const [showAdd, setShowAdd] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/applications')
      .then((r) => r.json())
      .then((d) => setApps(d.applications || []))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === status)?.label}`)
    } catch {
      toast.error('Failed to update')
      load()
    }
  }

  async function remove(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id))
    try {
      await fetch(`/api/applications?id=${id}`, { method: 'DELETE' })
      toast.success('Application removed')
    } catch {
      load()
    }
  }

  function onDragStart(id: string) {
    setDraggedId(id)
  }

  function onDrop(status: string) {
    if (draggedId) {
      updateStatus(draggedId, status)
      setDraggedId(null)
    }
  }

  const stats = {
    total: apps.length,
    active: apps.filter((a) => !['rejected', 'offer'].includes(a.status)).length,
    offers: apps.filter((a) => a.status === 'offer').length,
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Application Tracker</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              A Kanban board for every job you're pursuing. Drag cards between columns to update status.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add application
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 max-w-md">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-extrabold">{stats.total}</div>
          <div className="text-xs text-muted-foreground font-medium">Total tracked</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-extrabold text-amber-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground font-medium">Active</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-extrabold text-emerald-600">{stats.offers}</div>
          <div className="text-xs text-muted-foreground font-medium">Offers</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
          {COLUMNS.map((col) => {
            const items = apps.filter((a) => a.status === col.id)
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.id)}
                className="rounded-2xl border border-border bg-muted/30 p-3 min-h-[200px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', col.color)} />
                    <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => onDragStart(a.id)}
                      className="rounded-xl bg-card border border-border p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{a.role}</div>
                          <div className="text-xs text-muted-foreground truncate">{a.company}</div>
                        </div>
                        <button
                          onClick={() => remove(a.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {(a.location || a.salary) && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          {a.location && <span>📍 {a.location}</span>}
                          {a.salary && <span>💰 {a.salary}</span>}
                        </div>
                      )}
                      {a.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Job posting
                        </a>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-[10px] text-muted-foreground py-6 border-2 border-dashed border-border/50 rounded-xl">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  )
}

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [salary, setSalary] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [status, setStatus] = React.useState('wishlist')
  const [saving, setSaving] = React.useState(false)

  async function save() {
    if (!company.trim() || !role.trim()) {
      toast.error('Company and role are required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, location, salary, url, status }),
      })
      if (!r.ok) throw new Error('Failed')
      toast.success('Application added')
      onAdded()
      onClose()
    } catch {
      toast.error('Failed to add')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Add application</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Company *</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Role *</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Salary</label>
              <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 12 LPA" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add to tracker
          </button>
        </div>
      </div>
    </div>
  )
}
