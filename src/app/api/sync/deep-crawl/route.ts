import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  fetchRemotive,
  fetchArbeitnow,
  fetchTheMuse,
  fetchRemoteOK,
  fetchWeWorkRemotely,
  fetchIndeedRSS,
  fetchGreenhouse,
  fetchAshby,
  fetchAdzuna,
  fetchCareerjet,
} from '@/lib/job-sources/sources'
import {
  fetchDeepCrawl,
  fetchCareerPage,
  CAREER_PAGES_LIST,
} from '@/lib/job-sources/web-search-adapter'

// GET /api/sync/deep-crawl
// Runs EVERYTHING in parallel batches:
//  - All 6 free job APIs (Remotive, Arbeitnow, The Muse, RemoteOK, WWR, Indeed RSS)
//  - 12 web-search queries (covering LinkedIn, Naukri, Internshala, Indeed, Glassdoor, Google Jobs, etc.)
//  - 8 random career-page crawlers
//  - 5 random Greenhouse companies
//  - 3 random Ashby companies
//
// Total: ~30+ sources, 100-200 jobs per run, completes in ~3-5 minutes
export async function GET(req: NextRequest) {
  const startedAt = Date.now()
  console.log('[sync/deep-crawl] Starting DEEP CRAWL — full parallel ingestion')

  // Build the list of ALL sources to run
  const sources: Array<{ adapter: () => Promise<any>, label: string, sourceName: string }> = [
    // Free job board APIs (6 sources, ~8 jobs each = 48 jobs)
    { adapter: fetchRemotive, label: 'remotive', sourceName: 'remotive' },
    { adapter: fetchArbeitnow, label: 'arbeitnow', sourceName: 'arbeitnow' },
    { adapter: fetchTheMuse, label: 'themuse', sourceName: 'themuse' },
    { adapter: fetchRemoteOK, label: 'remoteok', sourceName: 'remoteok' },
    { adapter: fetchWeWorkRemotely, label: 'weworkremotely', sourceName: 'weworkremotely' },
    { adapter: fetchIndeedRSS, label: 'indeed-rss', sourceName: 'indeed-rss' },
    // Adzuna API (8 queries × 20 jobs = 160 India jobs per deep crawl)
    ...(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
      ? [
          { adapter: () => fetchAdzuna('software engineer', 'India'), label: 'adzuna-software', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('data scientist', 'India'), label: 'adzuna-data', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('fresher', 'India'), label: 'adzuna-fresher', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('devops engineer', 'India'), label: 'adzuna-devops', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('frontend developer', 'India'), label: 'adzuna-frontend', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('backend developer', 'India'), label: 'adzuna-backend', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('full stack developer', 'India'), label: 'adzuna-fullstack', sourceName: 'adzuna' },
          { adapter: () => fetchAdzuna('product manager', 'India'), label: 'adzuna-pm', sourceName: 'adzuna' },
        ]
      : []),
    // Careerjet API (4 queries × 15 jobs = 60 India jobs per deep crawl)
    ...(process.env.CAREERJET_AFFILIATE_ID
      ? [
          { adapter: () => fetchCareerjet('software engineer', 'India'), label: 'careerjet-software', sourceName: 'careerjet' },
          { adapter: () => fetchCareerjet('fresher', 'India'), label: 'careerjet-fresher', sourceName: 'careerjet' },
          { adapter: () => fetchCareerjet('data scientist', 'India'), label: 'careerjet-data', sourceName: 'careerjet' },
          { adapter: () => fetchCareerjet('devops', 'India'), label: 'careerjet-devops', sourceName: 'careerjet' },
        ]
      : []),
  ]

  // Add Greenhouse companies (5 random)
  const greenhouseCompanies = ['airbnb', 'stripe', 'pinterest', 'figma', 'datadog', 'cloudflare', 'hubspot', 'block', 'robinhood', 'grammarly']
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
  for (const c of greenhouseCompanies) {
    sources.push({ adapter: () => fetchGreenhouse(c), label: `greenhouse-${c}`, sourceName: 'greenhouse' })
  }

  // Add Ashby companies (3 random)
  const ashbyCompanies = ['vercel', 'replit', 'deepgram', 'mercury', 'ramp']
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  for (const c of ashbyCompanies) {
    sources.push({ adapter: () => fetchAshby(c), label: `ashby-${c}`, sourceName: 'ashby' })
  }

  // Add career-page crawlers (8 random out of 38)
  const careerPages = [...CAREER_PAGES_LIST]
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
  for (const cp of careerPages) {
    sources.push({
      adapter: () => fetchCareerPage(cp),
      label: `career-${cp.company}`,
      sourceName: 'career-page',
    })
  }

  // Run all the API + career-page sources in parallel first (these don't hit z-ai-web-dev-sdk rate limits)
  console.log(`[sync/deep-crawl] Phase 1: Running ${sources.length} API/career sources in parallel`)

  const apiResults = await Promise.allSettled(
    sources.map(async (s) => {
      try {
        const result = await s.adapter()
        return { ...s, result, error: null as string | null }
      } catch (e: any) {
        return { ...s, result: null, error: e.message }
      }
    })
  )

  // Phase 2: Run the deep-crawl (12 web-search queries in batches of 4)
  console.log(`[sync/deep-crawl] Phase 2: Running deep crawl (12 web-search queries in batches)`)

  const webSearchResults = await fetchDeepCrawl()

  // Aggregate everything and ingest
  let totalJobsFound = 0
  let totalJobsAdded = 0
  let totalJobsSkipped = 0
  let totalEnriched = 0
  const sourceResults: Array<{ source: string; param?: string; found: number; added: number; skipped: number; enriched: number; error?: string }> = []

  // Process API/career-page results
  for (const r of apiResults) {
    if (r.status !== 'fulfilled') continue
    const { result, error, sourceName, label } = r.value
    if (error || !result || result.jobs.length === 0) {
      sourceResults.push({
        source: result?.source || sourceName,
        param: result?.sourceParam,
        found: 0,
        added: 0,
        skipped: 0,
        enriched: 0,
        error: error || result?.error,
      })
      continue
    }

    const ingestStats = await ingestJobs(result.source, result.jobs, result.sourceParam, startedAt)
    totalJobsFound += result.jobs.length
    totalJobsAdded += ingestStats.added
    totalJobsSkipped += ingestStats.skipped
    totalEnriched += ingestStats.enriched
    sourceResults.push({
      source: result.source,
      param: result.sourceParam,
      found: result.jobs.length,
      added: ingestStats.added,
      skipped: ingestStats.skipped,
      enriched: ingestStats.enriched,
    })
  }

  // Process web-search results
  for (const wsResult of webSearchResults) {
    if (!wsResult || wsResult.jobs.length === 0) {
      sourceResults.push({
        source: 'web-search',
        param: wsResult?.sourceParam,
        found: 0,
        added: 0,
        skipped: 0,
        enriched: 0,
        error: wsResult?.error,
      })
      continue
    }

    const ingestStats = await ingestJobs('web-search', wsResult.jobs, wsResult.sourceParam, startedAt)
    totalJobsFound += wsResult.jobs.length
    totalJobsAdded += ingestStats.added
    totalJobsSkipped += ingestStats.skipped
    totalEnriched += ingestStats.enriched
    sourceResults.push({
      source: 'web-search',
      param: wsResult.sourceParam,
      found: wsResult.jobs.length,
      added: ingestStats.added,
      skipped: ingestStats.skipped,
      enriched: ingestStats.enriched,
    })
  }

  const durationMs = Date.now() - startedAt
  console.log(`[sync/deep-crawl] Complete: ${totalJobsAdded} jobs added, ${totalEnriched} enriched in ${(durationMs / 1000).toFixed(1)}s`)

  return NextResponse.json({
    ok: true,
    mode: 'deep-crawl',
    sourcesRun: sources.length + webSearchResults.length,
    totalJobsFound,
    totalJobsAdded,
    totalJobsSkipped,
    totalEnriched,
    durationMs,
    sourceResults,
  })
}

// Helper — ingest a batch of jobs and return stats
async function ingestJobs(source: string, jobs: any[], sourceParam: string | undefined, startedAt: number) {
  // Create JobSync record
  const sync = await db.jobSync.create({
    data: {
      source,
      sourceParam: sourceParam || null,
      status: 'running',
      jobsFound: jobs.length,
    },
  })

  try {
    const ingestRes = await fetch((process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/jobs/ingest` : 'http://localhost:3000/api/jobs/ingest'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, jobs, enrich: true }),
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

    return {
      added: ingestData.added || 0,
      skipped: ingestData.skipped || 0,
      enriched: ingestData.enriched || 0,
    }
  } catch (e: any) {
    await db.jobSync.update({
      where: { id: sync.id },
      data: {
        status: 'error',
        error: e.message,
        finishedAt: new Date(),
      },
    })
    return { added: 0, skipped: 0, enriched: 0 }
  }
}
