import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

/**
 * GET /api/admin/users
 *
 * Returns a paginated list of all users with their profile + subscription +
 * usage stats. Admin-only.
 *
 * Query params:
 *   - q: search by email or name (case-insensitive)
 *   - role: filter by role ('candidate' | 'employer' | 'admin')
 *   - tier: filter by subscription tier ('free' | 'pro' | 'recruiter')
 *   - page: page number (1-indexed, default 1)
 *   - take: items per page (default 50, max 200)
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const roleFilter = searchParams.get('role')
    const tierFilter = searchParams.get('tier')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const take = Math.min(200, Math.max(10, parseInt(searchParams.get('take') || '50', 10)))
    const skip = (page - 1) * take

    // Build where clause
    const where: any = {}
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (roleFilter) where.role = roleFilter
    if (tierFilter) where.subscriptionTier = tierFilter

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          headline: true,
          targetRole: true,
          subscriptionTier: true,
          subscriptionEndsAt: true,
          createdAt: true,
          updatedAt: true,
          resumeOptimizationsUsed: true,
          coverLettersUsed: true,
          mockInterviewsUsed: true,
          atsChecksUsed: true,
          skillGapAnalysesUsed: true,
          salaryPredictionsUsed: true,
          pdfDownloadsUsed: true,
          docxDownloadsUsed: true,
          usageResetAt: true,
          _count: {
            select: {
              savedJobs: true,
              applications: true,
              jobAlerts: true,
              payments: true,
              bulkFetchJobs: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        take,
        total,
        totalPages: Math.ceil(total / take),
        hasMore: skip + users.length < total,
      },
    })
  } catch (e: any) {
    console.error('[admin/users] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users
 * Body: { userId, action, value }
 *   action: 'promote-admin' | 'demote-admin' | 'extend-subscription' | 'reset-usage'
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, action, value } = await req.json()
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id: userId } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let data: any = {}

    switch (action) {
      case 'promote-admin':
        data.role = 'admin'
        break
      case 'demote-admin':
        if (target.email === 'admin@hirebase.in') {
          return NextResponse.json({ error: 'Cannot demote primary admin' }, { status: 400 })
        }
        data.role = 'candidate'
        break
      case 'extend-subscription': {
        const days = parseInt(value, 10) || 30
        const baseDate = target.subscriptionEndsAt && target.subscriptionEndsAt > new Date()
          ? target.subscriptionEndsAt
          : new Date()
        const newDate = new Date(baseDate)
        newDate.setDate(newDate.getDate() + days)
        data.subscriptionEndsAt = newDate
        data.subscriptionTier = target.subscriptionTier === 'free' ? 'pro' : target.subscriptionTier
        break
      }
      case 'reset-usage':
        data = {
          resumeOptimizationsUsed: 0,
          coverLettersUsed: 0,
          mockInterviewsUsed: 0,
          atsChecksUsed: 0,
          skillGapAnalysesUsed: 0,
          salaryPredictionsUsed: 0,
          pdfDownloadsUsed: 0,
          docxDownloadsUsed: 0,
          usageResetAt: new Date(),
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updated = await db.user.update({ where: { id: userId }, data })
    return NextResponse.json({ ok: true, user: { id: updated.id, email: updated.email, role: updated.role } })
  } catch (e: any) {
    console.error('[admin/users PATCH] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
