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
