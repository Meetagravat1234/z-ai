import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sync/status — returns last syncs + aggregate stats
export async function GET() {
  try {
    const recentSyncs = await db.jobSync.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    const totalJobs = await db.job.count()
    const enrichedJobs = await db.job.count({ where: { enriched: true } })
    const totalCompanies = await db.company.count()

    // Source breakdown
    const sourceCounts = await db.job.groupBy({
      by: ['source'],
      _count: { _all: true },
    })

    // Jobs added in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newToday = await db.job.count({ where: { createdAt: { gte: yesterday } } })

    // Last successful sync
    const lastSuccess = await db.jobSync.findFirst({
      where: { status: 'success' },
      orderBy: { startedAt: 'desc' },
    })

    // Next sync ETA — 30 minutes from last sync start (per user request)
    const lastAny = recentSyncs[0]
    const nextSyncEta = lastAny
      ? new Date(lastAny.startedAt.getTime() + 30 * 60 * 1000)
      : null

    return NextResponse.json({
      totalJobs,
      enrichedJobs,
      totalCompanies,
      newToday,
      lastSuccess,
      nextSyncEta,
      recentSyncs,
      sourceCounts: sourceCounts.map((s) => ({
        source: s.source,
        count: s._count._all,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
