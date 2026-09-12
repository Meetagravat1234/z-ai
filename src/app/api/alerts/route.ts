import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendAlertConfirmationEmail } from '@/lib/email/send-alerts-confirmation'

// GET /api/alerts — list current user's alerts
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const alerts = await db.jobAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ alerts })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/alerts — create a new job alert
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { query, category, workMode, location, minSalary, email, frequency } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email format validation — prevents obvious typos and abuse.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Deduplication — same user can't create the exact same alert twice.
    // We match on (userId, email, query, category, workMode, location) —
    // if any field differs, we allow the new alert.
    const existing = await db.jobAlert.findFirst({
      where: {
        userId: user.id,
        email,
        query: query || null,
        category: category || null,
        workMode: workMode || null,
        location: location || null,
      },
      select: { id: true, isActive: true },
    })
    if (existing) {
      // If the existing alert was paused, re-activate it instead of creating a duplicate.
      if (!existing.isActive) {
        await db.jobAlert.update({
          where: { id: existing.id },
          data: { isActive: true, frequency: frequency || 'daily' },
        })
        return NextResponse.json({ ok: true, alertId: existing.id, reactivated: true })
      }
      return NextResponse.json({ ok: true, alertId: existing.id, alreadyExists: true })
    }

    const alert = await db.jobAlert.create({
      data: {
        userId: user.id,
        query: query || null,
        category: category || null,
        workMode: workMode || null,
        location: location || null,
        minSalary: minSalary ? Math.round(parseFloat(minSalary) * 10) : null,
        email,
        frequency: frequency || 'daily',
        isActive: true,
      },
    })

    // Fire a confirmation email so the user knows the alert is active.
    // We use fire-and-forget (no await) so the API responds quickly even
    // if Resend is slow. If this fails, we still return success — the
    // alert itself was created successfully.
    sendAlertConfirmationEmail({
      to: email,
      userName: user.name || undefined,
      criteria: {
        query: query || null,
        category: category || null,
        workMode: workMode || null,
        location: location || null,
        minSalary: minSalary ? parseFloat(minSalary) : null,
        frequency: frequency || 'daily',
      },
      unsubscribeToken: alert.unsubscribeToken,
    }).catch((e) => {
      console.error('[alerts] Welcome email failed:', e)
    })

    return NextResponse.json({ ok: true, alert })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/alerts?id=... — delete an alert
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.jobAlert.delete({ where: { id, userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/alerts — toggle alert active/inactive
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id, isActive } = await req.json()
    const updated = await db.jobAlert.update({
      where: { id, userId: user.id },
      data: { isActive },
    })
    return NextResponse.json({ ok: true, alert: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
