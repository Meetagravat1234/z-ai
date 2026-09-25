import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/cron/cleanup
 *
 * Weekly database cleanup — prevents Supabase egress/storage from filling up.
 *
 * Triggered by Vercel Cron every Sunday at 2:30 AM UTC (8:00 AM IST).
 * Also supports manual triggering via browser or cron-job.org (with x-cron-secret).
 *
 * What it deletes:
 *   1. JobSync logs older than 7 days (keeps recent 7 days for debugging)
 *   2. BulkFetchJobUrl rows with status 'error' older than 3 days
 *   3. BulkFetchJob rows with status 'cancelled' or 'completed' older than 7 days
 *      (and their associated URLs via cascade)
 *   4. Clears `originalDescription` from all jobs (saves ~5 MB storage + egress)
 *      — the cleaned `description` field is kept; only the raw HTML duplicate is removed
 *
 * What it does NOT delete:
 *   - Jobs (even old ones — they're the product)
 *   - Companies (reference data)
 *   - Users (never delete user data automatically)
 *   - Articles (SEO content)
 *   - JobAlerts (user data)
 *   - Active BulkFetchJobs (only cancelled/completed ones)
 *
 * Returns: { ok, deleted: { syncLogs, errorUrls, bulkJobs, bulkUrls, clearedDescriptions } }
 */
export async function GET(req: Request) {
  // Optional: check for x-cron-secret header (for cron-job.org)
  // But DON'T require it — Vercel Cron doesn't send custom headers.
  const cronSecret = req.headers.get('x-cron-secret')
  const validCronSecret = process.env.CRON_SECRET
  const hasSecret = cronSecret && validCronSecret && cronSecret === validCronSecret

  console.log(`[cron/cleanup] Triggered ${hasSecret ? 'via cron-job.org' : 'via Vercel Cron'}`)

  try {
    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)

    // 1. Delete old JobSync logs (older than 7 days)
    const syncLogsDeleted = await db.jobSync.deleteMany({
      where: { startedAt: { lt: sevenDaysAgo } },
    })

    // 2. Delete old error URLs (older than 3 days)
    const errorUrlsDeleted = await db.bulkFetchJobUrl.deleteMany({
      where: { status: 'error', processedAt: { lt: threeDaysAgo } },
    })

    // 3. Delete cancelled/completed BulkFetchJobs older than 7 days
    // First, delete their URLs (cascade doesn't work with deleteMany, so manual)
    const oldBulkJobs = await db.bulkFetchJob.findMany({
      where: {
        status: { in: ['cancelled', 'completed'] },
        createdAt: { lt: sevenDaysAgo },
      },
      select: { id: true },
    })

    let bulkUrlsDeleted = 0
    let bulkJobsDeleted = 0
    if (oldBulkJobs.length > 0) {
      const jobIds = oldBulkJobs.map((j) => j.id)
      const urlsResult = await db.bulkFetchJobUrl.deleteMany({
        where: { jobId: { in: jobIds } },
      })
      bulkUrlsDeleted = urlsResult.count
      const jobsResult = await db.bulkFetchJob.deleteMany({
        where: { id: { in: jobIds } },
      })
      bulkJobsDeleted = jobsResult.count
    }

    // 4. Clear originalDescription from all jobs (saves storage + egress)
    // The 'description' field (cleaned version) is kept — only the raw HTML is removed
    const descCleared = await db.job.updateMany({
      where: { NOT: { originalDescription: null } },
      data: { originalDescription: null },
    })

    const result = {
      ok: true,
      deleted: {
        syncLogs: syncLogsDeleted.count,
        errorUrls: errorUrlsDeleted.count,
        bulkJobs: bulkJobsDeleted,
        bulkUrls: bulkUrlsDeleted,
        clearedDescriptions: descCleared.count,
      },
      timestamp: new Date().toISOString(),
    }

    console.log('[cron/cleanup] Result:', result)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[cron/cleanup] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
