'use client'

import * as React from 'react'
import { Loader2, Star, Plus, X, Building2, IndianRupee, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  title: string
  pros: string | null
  cons: string | null
  interviewExperience: string | null
  salaryOffered: string | null
  role: string | null
  createdAt: string
  company: { name: string; logo: string | null }
}

export function ReviewsSection({ companyId, companyName, companyLogo }: {
  companyId: string
  companyName: string
  companyLogo: string | null
}) {
  const { user } = useAuth()
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [stats, setStats] = React.useState<{ count: number; avgRating: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [showSalaryForm, setShowSalaryForm] = React.useState(false)

  // Review form
  const [rating, setRating] = React.useState(5)
  const [title, setTitle] = React.useState('')
  const [pros, setPros] = React.useState('')
  const [cons, setCons] = React.useState('')
  const [role, setRole] = React.useState('')
  const [salary, setSalary] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(() => {
    fetch(`/api/reviews?companyId=${companyId}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || [])
        setStats(d.stats || null)
      })
      .finally(() => setLoading(false))
  }, [companyId])

  React.useEffect(() => { load() }, [load])

  async function submitReview() {
    if (!title.trim() || !rating) {
      toast.error('Title and rating are required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, rating, title, pros, cons, role, salaryOffered: salary }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Review submitted!')
      setShowForm(false)
      setTitle(''); setPros(''); setCons(''); setRole(''); setSalary('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function submitSalary() {
    if (!role.trim() || !salary) {
      toast.error('Role and salary are required')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/salary-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, role, salary, experience: 'Not specified' }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Salary report submitted!')
      setShowSalaryForm(false)
      setRole(''); setSalary('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {stats ? (
            <>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={cn('w-5 h-5', s <= Math.round(stats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                ))}
              </div>
              <span className="font-bold text-lg">{stats.avgRating}</span>
              <span className="text-sm text-muted-foreground">({stats.count} review{stats.count !== 1 && 's'})</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
        </div>
        <div className="flex gap-2">
          {user && (
            <>
              <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                <Plus className="w-4 h-4" /> Review
              </button>
              <button onClick={() => setShowSalaryForm(!showSalaryForm)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted">
                <IndianRupee className="w-4 h-4" /> Salary
              </button>
            </>
          )}
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">Write a review for {companyName}</h4>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={cn('w-7 h-7 transition-colors', s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-400')} />
                </button>
              ))}
            </div>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title (e.g. Great culture, fast-paced)" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <textarea value={pros} onChange={(e) => setPros(e.target.value)} placeholder="Pros..." className="p-2.5 rounded-lg border border-border bg-background text-sm min-h-[80px]" />
            <textarea value={cons} onChange={(e) => setCons(e.target.value)} placeholder="Cons..." className="p-2.5 rounded-lg border border-border bg-background text-sm min-h-[80px]" />
          </div>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role (e.g. Software Engineer)" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
          <button onClick={submitReview} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      )}

      {/* Salary form */}
      {showSalaryForm && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">Report your salary at {companyName}</h4>
            <button onClick={() => setShowSalaryForm(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. SDE-2)" className="p-2.5 rounded-lg border border-border bg-background text-sm" />
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary (LPA)" className="p-2.5 rounded-lg border border-border bg-background text-sm" />
          </div>
          <p className="text-xs text-muted-foreground">🔒 Your identity will not be shown. Only the role + salary amount is displayed.</p>
          <button onClick={submitSalary} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Submitting…' : 'Submit salary'}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No reviews yet. Be the first to review {companyName}!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={cn('w-3.5 h-3.5', s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                  <div className="font-semibold text-sm mt-1">{r.title}</div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {r.role && <div className="text-xs text-muted-foreground mb-2">{r.role}</div>}
              {(r.pros || r.cons) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {r.pros && <div className="text-xs"><span className="font-bold text-emerald-600">Pros:</span> {r.pros}</div>}
                  {r.cons && <div className="text-xs"><span className="font-bold text-rose-600">Cons:</span> {r.cons}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
