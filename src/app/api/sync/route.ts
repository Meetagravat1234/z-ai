import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getNextSource,
  SOURCE_QUEUE_LENGTH,
  fetchRemotive,
  fetchArbeitnow,
  fetchGreenhouse,
  fetchLever,
  fetchAshby,
} from '@/lib/job-sources/sources'

// GET /api/sync — runs one sync cycle (one source, ~5-8 jobs max)
// Optional: ?source=greenhouse&param=google to force a specific source
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forcedSource = searchParams.get('source')
  const forcedParam = searchParams.get('param')

  let result
  if (forcedSource) {
    switch (forcedSource) {
      case 'greenhouse':
        result = await fetchGreenhouse(forcedParam || 'google')
        break
      case 'lever':
        result = await fetchLever(forcedParam || 'notion')
        break
      case 'ashby':
        result = await fetchAshby(forcedParam || 'vercel')
        break
      case 'remotive':
        result = await fetchRemotive()
        break
      case 'arbeitnow':
        result = await fetchArbeitnow()
        break
      default:
        return NextResponse.json({ error: `Unknown source: ${forcedSource}` }, { status: 400 })
    }
  } else {
    // Round-robin: find the last sync, pick the next source
    const lastSync = await db.jobSync.findFirst({
      where: { status: 'success' },
      orderBy: { startedAt: 'desc' },
    })
    // We can't easily store the index, so we just count successful syncs today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await db.jobSync.count({
      where: { startedAt: { gte: today }, status: 'success' },
    })
    const idx = todayCount % SOURCE_QUEUE_LENGTH
    const { adapter } = getNextSource(idx - 1)
    result = await adapter()
  }

  // Create a JobSync record
  const sync = await db.jobSync.create({
    data: {
      source: result.source,
      sourceParam: result.sourceParam || null,
      status: 'running',
      jobsFound: result.jobs.length,
    },
  })

  if (result.error) {
    await db.jobSync.update({
      where: { id: sync.id },
      data: {
        status: 'error',
        error: result.error,
        finishedAt: new Date(),
      },
    })
    return NextResponse.json({
      ok: false,
      source: result.source,
      param: result.sourceParam,
      error: result.error,
    })
  }

  if (result.jobs.length === 0) {
    await db.jobSync.update({
      where: { id: sync.id },
      data: {
        status: 'success',
        jobsAdded: 0,
        finishedAt: new Date(),
        durationMs: 0,
      },
    })
    return NextResponse.json({
      ok: true,
      source: result.source,
      param: result.sourceParam,
      jobsFound: 0,
      jobsAdded: 0,
    })
  }

  // Ingest jobs via the /api/jobs/ingest endpoint
  const startedAt = Date.now()
  try {
    const ingestRes = await fetch('http://localhost:3000/api/jobs/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: result.source,
        jobs: result.jobs,
        enrich: true,
      }),
    })
    const ingestData = await ingestRes.json()

    await db.jobSync.update({
      where: { id: sync.id },
      data: {
        status: 'success',
        jobsAdded: ingestData.added || 0,
        jobsSkipped: ingestData.skipped || 0,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt,
      },
    })

    return NextResponse.json({
      ok: true,
      source: result.source,
      param: result.sourceParam,
      jobsFound: result.jobs.length,
      jobsAdded: ingestData.added || 0,
      jobsSkipped: ingestData.skipped || 0,
      enriched: ingestData.enriched || 0,
      errors: ingestData.errors || [],
      durationMs: Date.now() - startedAt,
    })
  } catch (e: any) {
    await db.jobSync.update({
      where: { id: sync.id },
      data: {
        status: 'error',
        error: e.message,
        finishedAt: new Date(),
      },
    })
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
