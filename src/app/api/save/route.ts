import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Fallback demo user for unauthenticated users (so the UI still works as a demo)
const DEMO_USER_EMAIL = 'demo@hirebase.in'

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
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    // Sanitize: if the jobId contains a slug suffix (e.g. "abc123-job-title"),
    // extract just the ID part (everything before the first hyphen).
    // CUIDs are 24+ lowercase alphanumeric chars starting with 'c'.
    const cleanJobId = jobId.includes('-')
      ? jobId.split('-')[0]
      : jobId

    // Verify the job exists before trying to save it — prevents foreign key
    // constraint violations that crash the API with a 500 error.
    const job = await db.job.findUnique({
      where: { id: cleanJobId },
      select: { id: true },
    })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const user = await getCurrentUser()
    const saved = await db.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId: cleanJobId } },
      update: {},
      create: { userId: user.id, jobId: cleanJobId },
    })
    return NextResponse.json({ saved, isDemo: user.email === DEMO_USER_EMAIL })
  } catch (e: any) {
    console.error('[api/save] POST error:', e.message)
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
  }
}

// DELETE /api/save?jobId=... — unsave a job
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawJobId = searchParams.get('jobId')
    if (!rawJobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    // Sanitize: strip slug suffix if present (same as POST handler)
    const cleanJobId = rawJobId.includes('-')
      ? rawJobId.split('-')[0]
      : rawJobId

    const user = await getCurrentUser()
    await db.savedJob.deleteMany({ where: { userId: user.id, jobId: cleanJobId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/save] DELETE error:', e.message)
    return NextResponse.json({ error: 'Failed to remove job' }, { status: 500 })
  }
}
