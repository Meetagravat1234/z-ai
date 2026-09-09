import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/jobs/ingest
// Body: {
//   source: 'greenhouse' | 'lever' | 'ashby' | 'remotive' | 'arbeitnow' | 'web-search',
//   jobs: [{
//     title, company (string name), companyWebsite?, companyLogo?, location, description,
//     applyUrl, sourceRef, sourcePostedAt?, skills?, employmentType?, workMode?, experience?,
//     category?, salaryMin?, salaryMax?
//   }],
//   enrich: boolean (default true) — if true, calls AI to rewrite description + extract fields
// }
//
// Returns: { added: number, skipped: number, enriched: number, errors: string[] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { source, jobs, enrich = true } = body as {
      source: string
      jobs: Array<RawJob>
      enrich?: boolean
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ added: 0, skipped: 0, errors: [] })
    }

    const errors: string[] = []
    let added = 0
    let skipped = 0
    let enrichedCount = 0

    for (const raw of jobs) {
      try {
        if (!raw.title || !raw.company || !raw.description) {
          errors.push(`Skipping job missing required fields: ${raw.title || 'no title'}`)
          continue
        }

        // Find or create the company (by slug)
        const slug = slugify(raw.company)
        let company = await db.company.findUnique({ where: { slug } })
        if (!company) {
          company = await db.company.create({
            data: {
              name: raw.company,
              slug,
              logo: raw.companyLogo || pickLogo(raw.company),
              website: raw.companyWebsite || null,
              industry: raw.industry || null,
              hiringActivity: 'Medium',
              sevenDayTrend: 0,
            },
          })
        }

        // Dedup by hash (title + company + first location)
        const firstLoc = (raw.location || '').split(',')[0].trim()
        const hash = crypto
          .createHash('sha1')
          .update(`${raw.title}|${company.id}|${firstLoc}`)
          .digest('hex')

        // Dedup by source+sourceRef if both present
        if (raw.sourceRef) {
          const existing = await db.job.findUnique({
            where: { source_sourceRef: { source, sourceRef: raw.sourceRef } },
          })
          if (existing) {
            skipped++
            continue
          }
        } else {
          // Dedup by hash
          const existing = await db.job.findFirst({ where: { hash } })
          if (existing) {
            skipped++
            continue
          }
        }

        // Optionally enrich via AI
        let finalDescription = raw.description
        let skills = raw.skills || ''
        let experience = raw.experience || '0-2 Years'
        let category = raw.category || 'experienced'
        let employmentType = raw.employmentType || 'Full-time'
        let workMode = raw.workMode || 'Onsite'
        let salaryMin = raw.salaryMin ?? null
        let salaryMax = raw.salaryMax ?? null
        let enriched = false
        let enrichedAt: Date | null = null

        // Skip AI enrichment if SKIP_ENRICHMENT env var is set (for Vercel 60s timeout)
        const shouldEnrich = enrich && process.env.SKIP_ENRICHMENT !== 'true'

        if (shouldEnrich) {
          try {
            const r = await fetch((process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/ai/enrich-job` : 'http://localhost:3000/api/ai/enrich-job'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: raw.title,
                company: raw.company,
                rawDescription: raw.description,
                location: raw.location,
              }),
            })
            if (r.ok) {
              const d = await r.json()
              const e = d.result || {}
              if (e.description) finalDescription = e.description
              if (Array.isArray(e.skills) && e.skills.length > 0) skills = e.skills.join(',')
              if (e.experience) experience = e.experience
              // Preserve pre-set category if the source adapter set a SPECIFIC one (fresher/internship/walk-in/hidden)
              // — only override if AI returns something MORE specific than "experienced"
              if (e.category && e.category !== 'experienced') category = e.category
              else if (e.category === 'experienced' && raw.category && raw.category !== 'experienced') {
                // Keep the pre-set category from the source adapter
              } else if (e.category) {
                category = e.category
              }
              if (e.employmentType) employmentType = e.employmentType
              if (e.workMode) workMode = e.workMode
              if (e.salaryMin != null) salaryMin = e.salaryMin
              if (e.salaryMax != null) salaryMax = e.salaryMax
              enriched = true
              enrichedAt = new Date()
              enrichedCount++
            }
          } catch (e) {
            // Continue with raw description if AI fails
            errors.push(`AI enrich failed for "${raw.title}": ${e}`)
          }
        }

        await db.job.create({
          data: {
            title: raw.title,
            companyId: company.id,
            category,
            employmentType,
            workMode,
            experience,
            salaryMin,
            salaryMax,
            salaryCurrency: 'INR',
            location: raw.location || 'Not specified',
            skills,
            description: finalDescription,
            applyUrl: raw.applyUrl || null,
            postedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : new Date(),
            verified: true,
            isFeatured: false,
            source,
            sourceRef: raw.sourceRef || null,
            hash,
            originalDescription: raw.description,
            enriched,
            enrichedAt,
            sourcePostedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : null,
          },
        })
        added++
      } catch (e: any) {
        errors.push(`Failed to ingest "${raw.title}": ${e.message}`)
      }
    }

    return NextResponse.json({
      added,
      skipped,
      enriched: enrichedCount,
      errors: errors.slice(0, 10),
    })
  } catch (e: any) {
    console.error('Ingest error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

interface RawJob {
  title: string
  company: string
  companyWebsite?: string
  companyLogo?: string
  industry?: string
  location?: string
  description: string
  applyUrl?: string
  sourceRef?: string
  sourcePostedAt?: string
  skills?: string
  employmentType?: string
  workMode?: string
  experience?: string
  category?: string
  salaryMin?: number
  salaryMax?: number
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function pickLogo(company: string): string {
  // Curated emoji logos for known companies; fallback to first-letter
  const map: Record<string, string> = {
    google: '🔍', amazon: '📦', microsoft: '🪟', nvidia: '🎮', cisco: '🌐',
    accenture: '🏢', hpe: '💻', qualcomm: '📡', airbus: '✈️', mastercard: '💳',
    honeywell: '🏭', ge: '🏥', flex: '🔧', kpmg: '📊', maersk: '🚢',
    state: '🏦', infineon: '⚡', hitachi: '🔋', iqvia: '💊', wsp: '🏗️',
    caterpillar: '🚜', harman: '🔊', stripe: '💳', airbnb: '🏠', pinterest: '📌',
    atlassian: '🟦', twitch: '🎮', notion: '📝', linear: '📈', figma: '🎨',
    vercel: '▲', gitlab: '🦊', datadog: '🐕', cloudflare: '☁️',
  }
  const key = company.toLowerCase().replace(/[^a-z0-9]/g, '')
  return map[key] || null
}
