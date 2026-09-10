import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import {
  fetchRemotive, fetchArbeitnow, fetchTheMuse, fetchRemoteOK,
  fetchWeWorkRemotely, fetchGreenhouse, fetchAshby,
  fetchAdzuna, fetchCareerjet,
} from '@/lib/job-sources/sources'

// GET /api/sync/quick — syncs ONE source per call (round-robin)
// Designed for cron-job.org's 30-second timeout. Takes <15 seconds.
export async function GET() {
  const startedAt = Date.now()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = await db.jobSync.count({
    where: { startedAt: { gte: today }, status: 'success' },
  })

  const sources = [
    () => fetchRemotive(),
    () => fetchArbeitnow(),
    () => fetchTheMuse(),
    () => fetchRemoteOK(),
    () => fetchWeWorkRemotely(),
    () => fetchGreenhouse('stripe'),
    () => fetchGreenhouse('datadog'),
    () => fetchGreenhouse('cloudflare'),
    () => fetchGreenhouse('mongodb'),
    () => fetchGreenhouse('figma'),
    () => fetchGreenhouse('airbnb'),
    () => fetchGreenhouse('pinterest'),
    () => fetchGreenhouse('block'),
    () => fetchGreenhouse('robinhood'),
    () => fetchGreenhouse('twilio'),
    () => fetchGreenhouse('okta'),
    () => fetchGreenhouse('braze'),
    () => fetchGreenhouse('samsara'),
    () => fetchAshby('vercel'),
    () => fetchAshby('replit'),
    () => fetchAshby('deepgram'),
    () => fetchAshby('ramp'),
    ...(process.env.ADZUNA_APP_ID ? [() => fetchAdzuna('all', 'India')] : []),
    ...(process.env.CAREERJET_AFFILIATE_ID ? [() => fetchCareerjet('software engineer', 'India')] : []),
  ]

  const idx = todayCount % sources.length
  const result = await sources[idx]()

  if (result.error || result.jobs.length === 0) {
    await db.jobSync.create({
      data: {
        source: result.source, sourceParam: result.sourceParam || null,
        startedAt: new Date(startedAt), finishedAt: new Date(),
        status: result.error ? 'error' : 'success',
        jobsFound: result.jobs.length, jobsAdded: 0,
        error: result.error || null, durationMs: Date.now() - startedAt,
      },
    })
    return NextResponse.json({ ok: true, source: result.source, found: 0, added: 0, durationMs: Date.now() - startedAt })
  }

  const sync = await db.jobSync.create({
    data: { source: result.source, sourceParam: result.sourceParam || null,
      startedAt: new Date(startedAt), status: 'running', jobsFound: result.jobs.length },
  })

  let added = 0, skipped = 0

  for (const raw of result.jobs) {
    try {
      if (!raw.title || !raw.company || !raw.description) continue
      const slug = raw.company.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
      let company = await db.company.findUnique({ where: { slug } })
      if (!company) {
        company = await db.company.create({ data: { name: raw.company, slug, hiringActivity: 'Medium', sevenDayTrend: 0 } })
      }
      const hash = crypto.createHash('sha1').update(raw.title + '|' + company.id + '|' + (raw.location || '').split(',')[0].trim()).digest('hex')
      if (raw.sourceRef) {
        const existing = await db.job.findUnique({ where: { source_sourceRef: { source: result.source, sourceRef: raw.sourceRef } } })
        if (existing) { skipped++; continue }
      }
      await db.job.create({
        data: { title: raw.title, companyId: company.id, category: raw.category || 'experienced',
          employmentType: raw.employmentType || 'Full-time', workMode: raw.workMode || 'Onsite',
          experience: raw.experience || '0-2 Years', salaryMin: raw.salaryMin ?? null,
          salaryMax: raw.salaryMax ?? null, salaryCurrency: 'INR',
          location: raw.location || 'Not specified', skills: raw.skills || '',
          description: raw.description, applyUrl: raw.applyUrl || null,
          postedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : new Date(),
          verified: true, source: result.source, sourceRef: raw.sourceRef || null,
          hash, originalDescription: raw.description, enriched: false,
          sourcePostedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : null,
        },
      })
      added++
    } catch {}
  }

  await db.jobSync.update({ where: { id: sync.id }, data: { status: 'success', jobsAdded: added, jobsSkipped: skipped, finishedAt: new Date(), durationMs: Date.now() - startedAt } })

  return NextResponse.json({ ok: true, source: result.source, param: result.sourceParam, found: result.jobs.length, added, skipped, durationMs: Date.now() - startedAt })
}
