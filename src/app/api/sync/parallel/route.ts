import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingestJobs } from '@/lib/ingest'
import { getParallelSources, fetchRemotive, fetchArbeitnow, fetchGreenhouse, fetchAshby } from '@/lib/job-sources/sources'
import { fetchRandomWebSearch, fetchRandomCareerPage, fetchWebSearch, fetchCareerPage, CAREER_PAGES_LIST, WEB_SEARCH_QUERIES } from '@/lib/job-sources/web-search-adapter'

// GET /api/sync/parallel — runs ALL sources in parallel for maximum throughput
// Optional ?source=web-search&param=<query> to force a specific source
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forcedSource = searchParams.get('source')
  const forcedParam = searchParams.get('param')

  const startedAt = Date.now()

  // Build the list of sources to run in parallel
  let sources: Array<{ adapter: () => Promise<any>, label: string }> = []

  if (forcedSource === 'web-search') {
    // If forced, use specific query if provided, otherwise random
    const queries = forcedParam ? [forcedParam] : WEB_SEARCH_QUERIES.slice(0, 5)
    sources = queries.map((q) => ({
      adapter: () => fetchWebSearch(q),
      label: `web-search: ${q.slice(0, 30)}`,
    }))
  } else if (forcedSource === 'career-page') {
    // If forced, crawl multiple career pages in parallel
    const subset = CAREER_PAGES_LIST.slice(0, 5)
    sources = subset.map((c) => ({
      adapter: () => fetchCareerPage(c),
      label: `career-page: ${c.company}`,
    }))
  } else {
    // Default: parallel multi-source sync (the "boost" mode)
    sources = [
      { adapter: fetchRemotive, label: 'remotive' },
      { adapter: fetchArbeitnow, label: 'arbeitnow' },
      { adapter: fetchRandomWebSearch, label: 'web-search-1' },
      { adapter: fetchRandomWebSearch, label: 'web-search-2' },
      { adapter: fetchRandomWebSearch, label: 'web-search-3' },
      { adapter: fetchRandomCareerPage, label: 'career-page-1' },
      { adapter: fetchRandomCareerPage, label: 'career-page-2' },
    ]
  }

  // Run all sources in parallel, but stagger the web-search/career-page ones
  // to avoid hitting z-ai-web-dev-sdk rate limits (429 errors)
  console.log(`[sync/parallel] Running ${sources.length} sources (staggered): ${sources.map((s) => s.label).join(', ')}`)

  const results = await Promise.allSettled(
    sources.map(async (s, i) => {
      // Stagger the web-search and career-page calls by 0-6 seconds
      if (s.label.startsWith('web-search') || s.label.startsWith('career-page')) {
        const delay = (i % 3) * 3000 // 0s, 3s, 6s
        if (delay > 0) await new Promise((r) => setTimeout(r, delay))
      }
      try {
        const result = await s.adapter()
        return { label: s.label, result, error: null }
      } catch (e: any) {
        return { label: s.label, result: null, error: e.message }
      }
    })
  )

  // Aggregate stats
  let totalJobsFound = 0
  let totalJobsAdded = 0
  let totalJobsSkipped = 0
  let totalEnriched = 0
  const sourceResults: Array<{ source: string; param?: string; found: number; added: number; skipped: number; enriched: number; error?: string }> = []

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const label = sources[i].label
    if (r.status !== 'fulfilled') {
      sourceResults.push({ source: label, found: 0, added: 0, skipped: 0, enriched: 0, error: String(r.reason) })
      continue
    }
    const { result, error } = r.value
    if (error || !result || result.jobs.length === 0) {
      sourceResults.push({ source: result?.source || label, param: result?.sourceParam, found: 0, added: 0, skipped: 0, enriched: 0, error: error || result?.error })
      continue
    }

    // Create a JobSync record for this source
    const sync = await db.jobSync.create({
      data: {
        source: result.source,
        sourceParam: result.sourceParam || null,
        status: 'running',
        jobsFound: result.jobs.length,
      },
    })

    // Call ingest directly (no HTTP fetch — works on Vercel serverless)
    try {
      const ingestData = await ingestJobs(result.source, result.jobs, true)

      await db.jobSync.update({
        where: { id: sync.id },
        data: {
          status: 'success',
          jobsAdded: ingestData.added,
          jobsSkipped: ingestData.skipped,
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
        },
      })

      totalJobsFound += result.jobs.length
      totalJobsAdded += ingestData.added
      totalJobsSkipped += ingestData.skipped
      totalEnriched += ingestData.enriched
      sourceResults.push({
        source: result.source,
        param: result.sourceParam,
        found: result.jobs.length,
        added: ingestData.added,
        skipped: ingestData.skipped,
        enriched: ingestData.enriched,
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
      sourceResults.push({
        source: result.source,
        param: result.sourceParam,
        found: result.jobs.length,
        added: 0,
        skipped: 0,
        enriched: 0,
        error: e.message,
      })
    }
  }

  const durationMs = Date.now() - startedAt

  return NextResponse.json({
    ok: true,
    mode: 'parallel',
    sourcesRun: sources.length,
    totalJobsFound,
    totalJobsAdded,
    totalJobsSkipped,
    totalEnriched,
    durationMs,
    sourceResults,
  })
}
