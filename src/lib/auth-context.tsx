'use client'

import * as React from 'react'

export interface CurrentUser {
  id: string
  email: string
  name: string | null
  role: string
  avatar: string | null
  headline: string | null
  targetRole: string | null
  skills: string | null
  experienceYears: number
  preferredLocations: string | null
  minSalary: number | null
  bio: string | null
  createdAt: string
  // Subscription fields — included so the UI can check Pro status
  // without casting to `any`. Used by the sidebar badge + AI tool modals.
  subscriptionTier: string  // 'free' | 'pro' | 'recruiter'
  subscriptionEndsAt: string | null  // ISO date string or null
  // Onboarding — null means user hasn't completed the welcome flow yet
  onboardingCompletedAt: string | null
}

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  isDemo: boolean  // true when no session → using demo user fallback
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  loading: true,
  isDemo: true,
  refresh: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return React.useContext(AuthContext)
}

/**
 * Check if the current user has an active Pro subscription.
 * Client-safe version of isProUser() from subscription.ts — works with
 * the ISO date strings stored in the auth context (not Date objects).
 */
export function useIsPro(): boolean {
  const { user } = useAuth()
  if (!user) return false
  if (user.subscriptionTier !== 'pro' && user.subscriptionTier !== 'recruiter') return false
  if (!user.subscriptionEndsAt) return false
  if (new Date(user.subscriptionEndsAt) < new Date()) return false
  return true
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isDemo, setIsDemo] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me')
      const d = await r.json()
      setUser(d.user || null)
      setIsDemo(!d.user)
    } catch {
      setUser(null)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = React.useCallback(async () => {
    try {
      // Hit the NextAuth signout endpoint
      const csrfRes = await fetch('/api/auth/csrf')
      const csrf = await csrfRes.json()
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `csrfToken=${csrf.csrfToken}&callbackUrl=/`,
      })
    } catch {}
    setUser(null)
    setIsDemo(true)
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
