import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

/**
 * POST /api/admin/bulk-fetch/create
 * Body: { urls: string[] }
 *
 * Creates a BulkFetchJob + BulkFetchJobUrl records. Does NOT process them —
 * that's done by /api/admin/bulk-fetch/process (called by the UI auto-poller
 * or cron-job.org).
 *
 * Returns: { jobId, totalUrls }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { urls: rawUrls } = await req.json()
    if (!Array.isArray(rawUrls)) {
      return NextResponse.json({ error: 'urls must be an array of strings' }, { status: 400 })
    }

    // Clean + dedupe URLs — accepts strings that start with http:// or https://
    const validUrls: string[] = []
    const seen = new Set<string>()
    for (const u of rawUrls) {
      if (typeof u !== 'string') continue
      const trimmed = u.trim()
      if (!/^https?:\/\//.test(trimmed)) continue
      if (seen.has(trimmed)) continue
      seen.add(trimmed)
      validUrls.push(trimmed)
    }

    if (validUrls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs provided (must start with http:// or https://)' }, { status: 400 })
    }

    // Cap at 1000 URLs per batch to keep table sizes reasonable
    if (validUrls.length > 1000) {
      return NextResponse.json({ error: `Too many URLs (${validUrls.length}). Maximum 1000 per batch.` }, { status: 400 })
    }

    // Create the job + all URL rows in one transaction
    const job = await db.bulkFetchJob.create({
      data: {
        userId: admin.id,
        totalUrls: validUrls.length,
        status: 'pending',
        urls: {
          create: validUrls.map((url) => ({ url })),
        },
      },
      include: {
        _count: { select: { urls: true } },
      },
    })

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      totalUrls: job.totalUrls,
    })
  } catch (e: any) {
    console.error('[bulk-fetch/create] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
