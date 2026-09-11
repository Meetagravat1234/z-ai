import type { NextRequest } from 'next/server'

/**
 * Fetch the authenticated user from /api/auth/me.
 * Returns null if not authenticated.
 *
 * This is a server-side helper used by AI API routes that need to:
 *   1. Verify the user is authenticated (not anonymous)
 *   2. Check subscription tier + usage limits before running the AI call
 *   3. Increment usage counter after a successful AI call
 */
export async function getCurrentUser(req: NextRequest): Promise<any | null> {
  try {
    const url = new URL('/api/auth/me', req.nextUrl.origin).toString()
    const res = await fetch(url, {
      headers: { cookie: req.headers.get('cookie') || '' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}
