import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Demo user — in production, use auth
const DEMO_USER_EMAIL = 'demo@careernest.org'

async function getDemoUser() {
  let user = await db.user.findUnique({ where: { email: DEMO_USER_EMAIL } })
  if (!user) {
    user = await db.user.create({
      data: { email: DEMO_USER_EMAIL, name: 'Demo User', role: 'candidate' },
    })
  }
  return user
}

// GET /api/save?jobId=... — list saved jobs
// POST /api/save { jobId } — save a job
// DELETE /api/save?jobId=... — unsave a job
export async function GET() {
  try {
    const user = await getDemoUser()
    const saved = await db.savedJob.findMany({
      where: { userId: user.id },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    const user = await getDemoUser()
    const saved = await db.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId } },
      update: {},
      create: { userId: user.id, jobId },
    })
    return NextResponse.json({ saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    const user = await getDemoUser()
    await db.savedJob.deleteMany({ where: { userId: user.id, jobId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
