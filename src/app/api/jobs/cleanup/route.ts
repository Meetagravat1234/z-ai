import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/jobs/cleanup — deletes jobs older than 60 days
export async function GET() {
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
