import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

// GET /api/admin/analytics — admin-only stats dashboard data
export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    // Most viewed jobs
    const topViewed = await db.job.findMany({
      orderBy: { viewsCount: 'desc' },
      take: 10,
      include: { company: { select: { name: true, logo: true } } },
    })

    // Most recent jobs (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentJobs = await db.job.findMany({
      where: { createdAt: { gte: weekAgo } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { company: { select: { name: true } } },
    })

    // Source breakdown — fetch all jobs and count in memory (SQLite-safe)
    const allJobsForCounts = await db.job.findMany({
      select: { source: true, category: true },
    })
    const sourceMap = new Map<string, number>()
    const categoryMap = new Map<string, number>()
    for (const j of allJobsForCounts) {
      sourceMap.set(j.source, (sourceMap.get(j.source) || 0) + 1)
      categoryMap.set(j.category, (categoryMap.get(j.category) || 0) + 1)
    }
    const sourceCounts = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
    const categoryCounts = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    // Featured count
    const featuredCount = await db.job.count({ where: { isFeatured: true } })

    // Total counts
    const totalJobs = await db.job.count()
    const totalCompanies = await db.company.count()
    const totalUsers = await db.user.count()
    const totalApplications = await db.application.count()
    const totalSaved = await db.savedJob.count()

    // Sync stats
    const totalSyncs = await db.jobSync.count()
    const lastSync = await db.jobSync.findFirst({ orderBy: { startedAt: 'desc' } })

    // New jobs in last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newToday = await db.job.count({ where: { createdAt: { gte: dayAgo } } })

    return NextResponse.json({
      totals: {
        jobs: totalJobs,
        companies: totalCompanies,
        users: totalUsers,
        applications: totalApplications,
        saved: totalSaved,
        featured: featuredCount,
        newToday,
      },
      topViewed: topViewed.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company.name,
        logo: j.company.logo,
        views: j.viewsCount,
        category: j.category,
        source: j.source,
      })),
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company.name,
        createdAt: j.createdAt,
        source: j.source,
        category: j.category,
      })),
      sourceCounts,
      categoryCounts,
      syncStats: {
        totalSyncs,
        lastSync,
      },
    })
  } catch (e: any) {
    console.error('Admin analytics error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
