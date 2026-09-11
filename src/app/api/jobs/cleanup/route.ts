import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

// GET /api/jobs/cleanup — deletes jobs older than 60 days
// CRITICAL: Now requires admin authentication. Previously was open to anyone.
export async function GET(req: Request) {
  // Auth check — only admins can trigger cleanup
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const oldJobs = await db.job.count({ where: { postedAt: { lt: sixtyDaysAgo } } })
    if (oldJobs === 0) return NextResponse.json({ ok: true, deleted: 0 })
    const result = await db.job.deleteMany({ where: { postedAt: { lt: sixtyDaysAgo } } })
    return NextResponse.json({ ok: true, deleted: result.count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
