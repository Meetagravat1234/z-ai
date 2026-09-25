import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/stats
 *
 * Returns real-time platform stats for social proof on the homepage.
 * Public endpoint — no auth required.
 *
 * Returns:
 *   - totalJobs: number of verified jobs
 *   - totalCompanies: number of companies
 *   - totalUsers: number of registered users
 *   - aiToolUsesTotal: total AI tool invocations
 *   - newJobsThisWeek: jobs posted in the last 7 days
 */
export async function GET() {
  try {
    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    const [totalJobs, totalCompanies, totalUsers, usersThisWeek, jobsThisWeek] = await Promise.all([
      db.job.count({ where: { verified: true } }),
      db.company.count(),
      db.user.count({ where: { role: 'candidate' } }),
      db.user.count({ where: { role: 'candidate', createdAt: { gt: sevenDaysAgo } } }),
      db.job.count({ where: { verified: true, postedAt: { gt: sevenDaysAgo } } }),
    ])

    const usage = await db.user.aggregate({
      _sum: {
        resumeOptimizationsUsed: true,
        coverLettersUsed: true,
        mockInterviewsUsed: true,
        atsChecksUsed: true,
        skillGapAnalysesUsed: true,
        salaryPredictionsUsed: true,
      },
    })

    const totalAiToolUses =
      (usage._sum.resumeOptimizationsUsed || 0) +
      (usage._sum.coverLettersUsed || 0) +
      (usage._sum.mockInterviewsUsed || 0) +
      (usage._sum.atsChecksUsed || 0) +
      (usage._sum.skillGapAnalysesUsed || 0) +
      (usage._sum.salaryPredictionsUsed || 0)

    return NextResponse.json({
      totalJobs,
      totalCompanies,
      totalUsers,
      usersThisWeek,
      jobsThisWeek,
      aiToolCount: 6,
      aiToolUsesTotal: totalAiToolUses,
      jobSeekerCount: Math.max(totalUsers, 100),
    })
  } catch (e: any) {
    console.error('[stats] error:', e)
    return NextResponse.json({
      totalJobs: 0,
      totalCompanies: 0,
      totalUsers: 0,
      usersThisWeek: 0,
      jobsThisWeek: 0,
      aiToolCount: 6,
      aiToolUsesTotal: 0,
      jobSeekerCount: 100,
    })
  }
}
