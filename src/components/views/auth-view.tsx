'use client'

import * as React from 'react'
import { Loader2, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, AlertCircle, TrendingUp, Target, Shield } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AuthView() {
  const { go } = useNav()
  const { refresh } = useAuth()
  const [mode, setMode] = React.useState<'login' | 'signup'>('signup')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        // 1. Register
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        const regData = await regRes.json()
        if (!regRes.ok) throw new Error(regData.error || 'Signup failed')
        toast.success('Account created! Logging you in…')
      }

      // 2. Sign in via NextAuth credentials flow (gets the JWT cookie)
      // NextAuth expects form-encoded POST with csrfToken
      const csrfRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfRes.json()

      const formData = new URLSearchParams()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('csrfToken', csrfToken)
      formData.append('json', 'true')

      const signInRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        redirect: 'manual',
      })

      if (signInRes.status === 401) {
        const errBody = await signInRes.text().catch(() => '')
        throw new Error('Invalid credentials' + (errBody ? `: ${errBody.slice(0, 100)}` : ''))
      }

      // Refresh auth context to get the new user
      await refresh()
      toast.success(mode === 'signup' ? 'Welcome to Hirebase! 🎉' : 'Welcome back! 👋')

      // Take them to the profile page to finish setup (or home)
      go(mode === 'signup' ? 'profile' : 'home')
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
      toast.error('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
        {/* LEFT — value props */}
        <div className="hidden lg:block space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <Sparkles className="w-3 h-3" />
              HIREBASE
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Your career, <span className="gradient-text">supercharged</span> with AI.
            </h1>
            <p className="text-muted-foreground mt-3">
              Join thousands of job seekers using AI tools to land verified roles at top companies across India.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: TrendingUp, title: 'Live job aggregation', desc: 'Syncs from Greenhouse, Ashby, Remotive, The Muse, RemoteOK + crawls LinkedIn/Naukri/Internshala every 30 min' },
              { icon: Sparkles, title: '6 AI tools', desc: 'Resume optimizer, ATS score checker, cover letter, mock interview, skill gap analyzer, salary predictor' },
              { icon: Target, title: 'Personalized matches', desc: 'Get job recommendations based on your skills, target role, and salary expectations' },
              { icon: Shield, title: 'Private & secure', desc: 'Your saved jobs, applications, and alerts are tied to your account — private to you' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — auth form */}
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'signup'
                  ? 'Sign up free — no credit card needed.'
                  : 'Log in to access your saved jobs, applications, and AI tools.'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex p-1 rounded-xl bg-muted mb-6">
              <button
                onClick={() => { setMode('signup'); setError('') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
                  mode === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Sign up
              </button>
              <button
                onClick={() => { setMode('login'); setError('') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
                  mode === 'login' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Log in
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Full name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading
                  ? (mode === 'signup' ? 'Creating account…' : 'Logging in…')
                  : (mode === 'signup' ? 'Create free account' : 'Log in')}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                {mode === 'signup' ? (
                  <>By signing up you agree to our Terms & Privacy Policy.</>
                ) : (
                  <>Forgot your password? <button type="button" className="text-primary hover:underline">Reset it</button></>
                )}
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            No account yet?{' '}
            <button
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-primary font-semibold hover:underline"
            >
              {mode === 'signup' ? 'Log in instead' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
