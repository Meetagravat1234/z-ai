import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Fallback demo user for unauthenticated users (so the UI still works as a demo)
const DEMO_USER_EMAIL = 'demo@careernest.org'

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    let user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      // Edge case: user exists in session but not in DB — create them
      user = await db.user.create({
        data: { email: session.user.email, name: session.user.name || null, role: 'candidate' },
      })
    }
    return user
  }
  // No session — fall back to demo user (so the UI still works)
  let demo = await db.user.findUnique({ where: { email: DEMO_USER_EMAIL } })
  if (!demo) {
    demo = await db.user.create({
      data: { email: DEMO_USER_EMAIL, name: 'Demo User', role: 'candidate' },
    })
  }
  return demo
}

// GET /api/save — list saved jobs for the current user (or demo user)
export async function GET() {
  try {
    const user = await getCurrentUser()
    const saved = await db.savedJob.findMany({
      where: { userId: user.id },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ saved, isDemo: user.email === DEMO_USER_EMAIL })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/save { jobId } — save a job
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    const user = await getCurrentUser()
    const saved = await db.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId } },
      update: {},
      create: { userId: user.id, jobId },
    })
    return NextResponse.json({ saved, isDemo: user.email === DEMO_USER_EMAIL })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/save?jobId=... — unsave a job
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    const user = await getCurrentUser()
    await db.savedJob.deleteMany({ where: { userId: user.id, jobId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
