import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

/**
 * GET /api/admin/bulk-fetch/status?id=<jobId>
 *
 * Returns the current progress of a bulk fetch job — including the per-URL
 * status of every URL in the batch. The UI polls this every 5-10 seconds
 * to show live progress without keeping the connection open.
 *
 * If no id is provided, returns the most recent job (for the UI to "resume"
 * the latest batch automatically when the user revisits the page).
 *
 * Auth: admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('id')

    // Find the job to return
    let job: any
    if (jobId) {
      job = await db.bulkFetchJob.findUnique({
        where: { id: jobId },
        include: {
          urls: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              url: true,
              status: true,
              title: true,
              company: true,
              error: true,
              processedAt: true,
            },
          },
        },
      })
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
    } else {
      // No id — return the most recent job (for resume feature)
      job = await db.bulkFetchJob.findFirst({
        where: { userId: admin.id },
        orderBy: { createdAt: 'desc' },
        include: {
          urls: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              url: true,
              status: true,
              title: true,
              company: true,
              error: true,
              processedAt: true,
            },
          },
        },
      })
      if (!job) {
        return NextResponse.json({ job: null })
      }
    }

    // Sanity check: ensure the job's aggregate counts match reality
    // (in case of any race conditions during processing)
    const realCounts = await db.bulkFetchJobUrl.groupBy({
      by: ['status'],
      where: { jobId: job.id },
      _count: true,
    })
    const countMap: Record<string, number> = {}
    for (const r of realCounts) countMap[r.status] = r._count

    const realSaved = countMap['saved'] || 0
    const realDup = countMap['duplicate'] || 0
    const realErr = countMap['error'] || 0
    const realProcessed = realSaved + realDup + realErr

    // If DB counts are stale, fix them
    if (
      job.savedCount !== realSaved ||
      job.duplicateCount !== realDup ||
      job.failedCount !== realErr ||
      job.processedCount !== realProcessed
    ) {
      await db.bulkFetchJob.update({
        where: { id: job.id },
        data: {
          savedCount: realSaved,
          duplicateCount: realDup,
          failedCount: realErr,
          processedCount: realProcessed,
        },
      })
      job.savedCount = realSaved
      job.duplicateCount = realDup
      job.failedCount = realErr
      job.processedCount = realProcessed
    }

    return NextResponse.json({ job })
  } catch (e: any) {
    console.error('[bulk-fetch/status] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
