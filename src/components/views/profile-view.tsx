'use client'

import * as React from 'react'
import { Loader2, User, Mail, Briefcase, MapPin, IndianRupee, Sparkles, Save, LogOut, AlertCircle, CheckCircle2, TrendingUp, Lock } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const POPULAR_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer',
  'Product Manager', 'Cloud Architect', 'QA Engineer', 'Mobile Developer',
]

const POPULAR_CITIES = ['Bengaluru', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune', 'Noida', 'Gurugram', 'Remote']

export function ProfileView() {
  const { go, openJob } = useNav()
  const { user, loading: userLoading, refresh, signOut } = useAuth()

  const [name, setName] = React.useState('')
  const [headline, setHeadline] = React.useState('')
  const [targetRole, setTargetRole] = React.useState('')
  const [skills, setSkills] = React.useState('')
  const [experienceYears, setExperienceYears] = React.useState('0')
  const [preferredLocations, setPreferredLocations] = React.useState('')
  const [minSalary, setMinSalary] = React.useState('')
  const [bio, setBio] = React.useState('')

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  // Hydrate form from user data
  React.useEffect(() => {
    if (user) {
      setName(user.name || '')
      setHeadline(user.headline || '')
      setTargetRole(user.targetRole || '')
      setSkills(user.skills || '')
      setExperienceYears(String(user.experienceYears || 0))
      setPreferredLocations(user.preferredLocations || '')
      setMinSalary(user.minSalary ? String(user.minSalary / 10) : '') // convert to LPA
      setBio(user.bio || '')
    }
  }, [user])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Convert minSalary from LPA to LPA*10 (db format)
      const minSalaryDb = minSalary ? String(Math.round(parseFloat(minSalary) * 10)) : ''
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          headline,
          targetRole,
          skills,
          experienceYears,
          preferredLocations,
          minSalary: minSalaryDb === '' ? null : parseInt(minSalaryDb, 10),
          bio,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Save failed')
      await refresh()
      toast.success('Profile saved! ✓')
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    go('home')
  }

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
        <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">You need to log in to view your profile.</p>
        <button
          onClick={() => go('auth')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          Sign up / Log in
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Tell us about yourself — we'll use this to personalize job recommendations and AI tools.
        </p>
      </header>

      {/* Account summary */}
      <section className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg truncate">{user.name || 'Anonymous'}</div>
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </div>
          {user.headline && (
            <div className="text-xs text-primary font-medium mt-0.5">{user.headline}</div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold text-rose-600"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </section>

      {/* Profile form */}
      <form onSubmit={save} className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" icon={User}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Field label="Headline" icon={Briefcase}>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full-Stack Developer at Startup"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>
        </div>

        <Field label="Target role" icon={TrendingUp}>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            list="roles"
            placeholder="e.g. Senior Software Engineer"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <datalist id="roles">
            {POPULAR_ROLES.map((r) => <option key={r} value={r} />)}
          </datalist>
          <p className="text-xs text-muted-foreground mt-1">We'll prioritize jobs matching this role on your home feed.</p>
        </Field>

        <Field label="Skills (comma-separated)" icon={Sparkles}>
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Python, React, SQL, AWS, Docker"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {skills && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.split(',').map((s) => s.trim()).filter(Boolean).map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{s}</span>
              ))}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Years of experience" icon={Briefcase}>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Field label="Minimum salary (LPA)" icon={IndianRupee}>
            <input
              type="number"
              min="0"
              step="0.5"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g. 8"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Field label="Preferred locations" icon={MapPin}>
            <input
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
              list="cities"
              placeholder="e.g. Bengaluru, Remote"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <datalist id="cities">
              {POPULAR_CITIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
        </div>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about your background, what you're looking for, etc."
            className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
            Your data is private and never shared.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      {/* Password Change Section */}
      <PasswordChangeSection />
    </div>
  )
}

function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Password changed successfully!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={changePassword} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        Change Password
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1 block">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {saving ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  )
}
