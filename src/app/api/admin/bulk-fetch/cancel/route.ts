import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

/**
 * POST /api/admin/bulk-fetch/cancel
 * Body: { jobId: string }
 *
 * Cancels a bulk fetch job. Marks the job status as 'cancelled' and updates
 * all still-pending URLs as 'error' with reason 'cancelled by user'.
 *
 * Already-processed URLs (saved/duplicate/error) are NOT modified — they
 * remain as their final status so the user can review what was completed
 * before the cancellation.
 *
 * Note: if a URL is currently 'processing' when the cancel is called, that
 * specific URL will still finish (the in-flight API call can't be aborted
 * server-side from here). But no NEW pending URLs will be picked up.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { jobId } = await req.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    // Find the job
    const job = await db.bulkFetchJob.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Don't allow cancelling already-completed jobs
    if (job.status === 'completed' || job.status === 'cancelled') {
      return NextResponse.json({
        ok: true,
        message: `Job is already ${job.status}`,
        job,
      })
    }

    // Mark all pending URLs as 'error' with reason 'cancelled by user'
    // (this prevents the /process endpoint from picking them up)
    const cancelledUrls = await db.bulkFetchJobUrl.updateMany({
      where: { jobId, status: 'pending' },
      data: {
        status: 'error',
        error: 'Cancelled by user',
        processedAt: new Date(),
      },
    })

    // Mark the job as cancelled
    const updated = await db.bulkFetchJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        // Add the cancelled count to failedCount so progress totals still add up
        failedCount: { increment: cancelledUrls.count },
        processedCount: { increment: cancelledUrls.count },
      },
    })

    return NextResponse.json({
      ok: true,
      job: updated,
      cancelledUrlCount: cancelledUrls.count,
      message: `Batch cancelled. ${cancelledUrls.count} pending URLs marked as cancelled.`,
    })
  } catch (e: any) {
    console.error('[bulk-fetch/cancel] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
