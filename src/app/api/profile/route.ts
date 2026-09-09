import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/profile — update the current user's profile
// Body: { name?, headline?, targetRole?, skills?, experienceYears?, preferredLocations?, minSalary?, bio? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in to update your profile' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      headline,
      targetRole,
      skills,
      experienceYears,
      preferredLocations,
      minSalary,
      bio,
    } = body

    // Build the update object — only update fields that are explicitly provided
    const update: any = {}
    if (name !== undefined) update.name = (name || '').trim() || null
    if (headline !== undefined) update.headline = (headline || '').trim() || null
    if (targetRole !== undefined) update.targetRole = (targetRole || '').trim() || null
    if (skills !== undefined) update.skills = (skills || '').trim() || null
    if (preferredLocations !== undefined) update.preferredLocations = (preferredLocations || '').trim() || null
    if (bio !== undefined) update.bio = (bio || '').trim() || null
    if (experienceYears !== undefined) {
      const n = parseInt(experienceYears, 10)
      if (!isNaN(n) && n >= 0 && n <= 50) update.experienceYears = n
    }
    if (minSalary !== undefined) {
      const n = parseInt(minSalary, 10)
      if (!isNaN(n) && n >= 0) update.minSalary = n
      else if (minSalary === null || minSalary === '') update.minSalary = null
    }

    const updated = await db.user.update({
      where: { email: session.user.email },
      data: update,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        headline: true,
        targetRole: true,
        skills: true,
        experienceYears: true,
        preferredLocations: true,
        minSalary: true,
        bio: true,
      },
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (e: any) {
    console.error('Profile update error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
