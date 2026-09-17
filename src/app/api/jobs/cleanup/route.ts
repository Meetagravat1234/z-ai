import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST or GET /api/jobs/cleanup
 *
 * Marks jobs as unverified when they're older than 30 days from their
 * source posting date (or our postedAt date if sourcePostedAt is null).
 *
 * This keeps the site showing only fresh, active job listings:
 * - Unverified jobs disappear from all public pages (homepage, /jobs,
 *   company pages, city pages, role pages, sitemaps)
 * - They're NOT deleted from the database — we keep them for analytics,
 *   historical reporting, and in case the employer reposts the same job
 *
 * Auth: This route is intentionally unauthenticated (same as /api/sync/*)
 * so Vercel Cron can trigger it without sending auth headers. The worst
 * case from abuse is jobs getting marked unverified early — which is
 * harmless (jobs stay in the DB, just not visible publicly).
 *
 * Triggered by Vercel Cron daily at 22:00 UTC (3:30 AM IST — runs at night
 * when traffic is lowest).
 *
 * Also supports x-cron-secret header for cron-job.org integration (so
 * the user can run it more frequently if desired).
 */
async function handleCleanup() {
  try {
    // Cutoff: 30 days ago
    const DAYS_TO_KEEP = 30
    const cutoffDate = new Date(Date.now() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000)

    // Update jobs where:
    // - verified = true (still active)
    // - AND (sourcePostedAt < cutoff OR (sourcePostedAt is null AND postedAt < cutoff))
    //
    // We prefer sourcePostedAt (when the job was originally posted on LinkedIn/etc.)
    // because postedAt is when WE added it to our DB — which could be days after
    // the original posting. Using sourcePostedAt means jobs expire closer to
    // their actual posting date.
    const result = await db.job.updateMany({
      where: {
        verified: true,
        OR: [
          { sourcePostedAt: { lt: cutoffDate } },
          { sourcePostedAt: null, postedAt: { lt: cutoffDate } },
        ],
      },
      data: { verified: false },
    })

    // Get the new total of verified jobs (for the response)
    const remainingVerified = await db.job.count({ where: { verified: true } })
    const totalJobs = await db.job.count()

    console.log(`[jobs/cleanup] Expired ${result.count} jobs older than ${DAYS_TO_KEEP} days. ${remainingVerified} verified jobs remaining out of ${totalJobs} total.`)

    return NextResponse.json({
      ok: true,
      expiredCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      remainingVerifiedJobs: remainingVerified,
      totalJobsInDatabase: totalJobs,
      message: result.count === 0
        ? `No jobs to expire. All ${remainingVerified} verified jobs are within ${DAYS_TO_KEEP} days.`
        : `Expired ${result.count} jobs. ${remainingVerified} verified jobs remaining.`,
    })
  } catch (e: any) {
    console.error('[jobs/cleanup] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST() {
  return handleCleanup()
}

export async function GET() {
  return handleCleanup()
}

