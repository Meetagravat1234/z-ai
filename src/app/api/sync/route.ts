import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import {
  getNextSource,
  SOURCE_QUEUE_LENGTH,
  fetchRemotive,
  fetchArbeitnow,
  fetchGreenhouse,
  fetchLever,
  fetchAshby,
  fetchTheMuse,
  fetchRemoteOK,
  fetchWeWorkRemotely,
  fetchIndeedRSS,
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
      case 'themuse':
        result = await fetchTheMuse()
        break
      case 'remoteok':
        result = await fetchRemoteOK()
        break
      case 'weworkremotely':
        result = await fetchWeWorkRemotely()
        break
      case 'indeed-rss':
        result = await fetchIndeedRSS()
        break
      case 'adzuna': {
        const { fetchAdzuna } = await import('@/lib/job-sources/sources')
        const query = forcedParam || 'software engineer'
        result = await fetchAdzuna(query, 'India')
        break
      }
      case 'careerjet': {
        const { fetchCareerjet } = await import('@/lib/job-sources/sources')
        const query = forcedParam || 'software engineer'
        result = await fetchCareerjet(query, 'India')
        break
      }
      case 'web-search': {
        const { fetchWebSearch } = await import('@/lib/job-sources/web-search-adapter')
        result = await fetchWebSearch(forcedParam || 'software engineer jobs India')
        break
      }
      case 'career-page': {
        const { fetchCareerPage, CAREER_PAGES_LIST } = await import('@/lib/job-sources/web-search-adapter')
        const entry = forcedParam
          ? CAREER_PAGES_LIST.find((c) => c.company.toLowerCase() === forcedParam.toLowerCase()) || CAREER_PAGES_LIST[0]
          : CAREER_PAGES_LIST[Math.floor(Math.random() * CAREER_PAGES_LIST.length)]
        result = await fetchCareerPage(entry)
        break
      }
      default:
        return NextResponse.json({ error: `Unknown source: ${forcedSource}` }, { status: 400 })
    }
  } else {
    // Round-robin: find the last sync, pick the next source
    const lastSync = await db.jobSync.findFirst({
      where: { status: 'success' },
      orderBy: { startedAt: 'desc' },
    })
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

  // Ingest jobs directly (no HTTP fetch — works on Vercel serverless)
  const startedAt = Date.now()
  try {
    // Inline ingest v2 — cache bust — no external module, guaranteed to work
    let added = 0
    let skipped = 0
    const errors: string[] = []

    for (const raw of result.jobs) {
      try {
        if (!raw.title || !raw.company || !raw.description) {
          errors.push(`Skip: missing fields for ${raw.title || 'unknown'}`)
          continue
        }

        // Find or create company
        const slug = raw.company.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
        let company = await db.company.findUnique({ where: { slug } })
        if (!company) {
          company = await db.company.create({
            data: { name: raw.company, slug, hiringActivity: 'Medium', sevenDayTrend: 0 }
          })
        }

        // Dedup
        const hash = crypto.createHash('sha1').update(raw.title + '|' + company.id + '|' + (raw.location || '').split(',')[0].trim()).digest('hex')
        if (raw.sourceRef) {
          const existing = await db.job.findUnique({ where: { source_sourceRef: { source: result.source, sourceRef: raw.sourceRef } } })
          if (existing) { skipped++; continue }
        }

        // Create job
        await db.job.create({
          data: {
            title: raw.title,
            companyId: company.id,
            category: raw.category || 'experienced',
            employmentType: raw.employmentType || 'Full-time',
            workMode: raw.workMode || 'Onsite',
            experience: raw.experience || '0-2 Years',
            salaryMin: raw.salaryMin ?? null,
            salaryMax: raw.salaryMax ?? null,
            salaryCurrency: 'INR',
            location: raw.location || 'Not specified',
            skills: raw.skills || '',
            description: raw.description,
            applyUrl: raw.applyUrl || null,
            postedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : new Date(),
            verified: true,
            source: result.source,
            sourceRef: raw.sourceRef || null,
            hash,
            originalDescription: raw.description,
            enriched: false,
            sourcePostedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : null,
          },
        })
        added++
      } catch (e: any) {
        errors.push(`${raw.title || 'unknown'}: ${e.message}`)
      }
    }

    await db.jobSync.update({
      where: { id: sync.id },
      data: {
        status: 'success',
        jobsAdded: added,
        jobsSkipped: skipped,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt,
      },
    })

    return NextResponse.json({
      ok: true,
      source: result.source,
      param: result.sourceParam,
      jobsFound: result.jobs.length,
      jobsAdded: added,
      jobsSkipped: skipped,
      enriched: 0,
      errors,
      durationMs: Date.now() - startedAt,
    })
  } catch (e: any) {
    await db.jobSync.update({
      where: { id: sync.id },
      data: { status: 'error', error: e.message, finishedAt: new Date() },
    })
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}// Cache buster: Wed Sep  9 19:28:21 UTC 2026
