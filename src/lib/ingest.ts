// Shared job ingestion logic — called directly by sync endpoints
// (avoids the Vercel serverless "can't fetch own API" problem)
import { db } from '@/lib/db'
import crypto from 'crypto'

export interface RawJob {
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
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

function pickLogo(company: string): string {
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

export async function ingestJobs(
  source: string,
  rawJobs: RawJob[],
  enrich: boolean = true
): Promise<{ added: number; skipped: number; enriched: number; errors: string[] }> {
  console.log("[ingest] called with source:", source, "jobs count:", rawJobs.length)
  const errors: string[] = []
  let added = 0
  let skipped = 0
  let enrichedCount = 0

  for (const raw of rawJobs) {
    try {
      if (!raw.title || !raw.company || !raw.description) {
        errors.push(`Skipping job missing required fields: ${raw.title || 'no title'}`)
        continue
      }

      // Find or create the company
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

      // Dedup by hash
      const firstLoc = (raw.location || '').split(',')[0].trim()
      const hash = crypto.createHash('sha1').update(`${raw.title}|${company.id}|${firstLoc}`).digest('hex')

      // Dedup by source+sourceRef
      if (raw.sourceRef) {
        const existing = await db.job.findUnique({
          where: { source_sourceRef: { source, sourceRef: raw.sourceRef } },
        })
        if (existing) { skipped++; continue }
      } else {
        const existing = await db.job.findFirst({ where: { hash } })
        if (existing) { skipped++; continue }
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
      let isEnriched = false
      let enrichedAt: Date | null = null

      if (enrich && process.env.SKIP_ENRICHMENT !== 'true') {
        try {
          const { chatComplete } = await import('@/lib/multi-ai')
          const raw2 = await chatComplete([
            { role: 'system', content: `You are an expert job post editor. Given a raw job description, produce a clean version. Output STRICT JSON: {"description":"<markdown>","skills":["skill1"],"experience":"0-2 Years","category":"experienced","employmentType":"Full-time","workMode":"Onsite","salaryMin":null,"salaryMax":null}` },
            { role: 'user', content: `TITLE: ${raw.title}\nCOMPANY: ${raw.company}\nLOCATION: ${raw.location || 'Not specified'}\n\nRAW:\n${raw.description}` },
          ])
          const cleaned = raw2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const e = JSON.parse(cleaned)
          if (e.description) finalDescription = e.description
          if (Array.isArray(e.skills) && e.skills.length > 0) skills = e.skills.join(',')
          if (e.experience) experience = e.experience
          if (e.category && e.category !== 'experienced') category = e.category
          if (e.employmentType) employmentType = e.employmentType
          if (e.workMode) workMode = e.workMode
          if (e.salaryMin != null) salaryMin = e.salaryMin
          if (e.salaryMax != null) salaryMax = e.salaryMax
          isEnriched = true
          enrichedAt = new Date()
          enrichedCount++
        } catch {
          // Continue with raw description
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
          enriched: isEnriched,
          enrichedAt,
          sourcePostedAt: raw.sourcePostedAt ? new Date(raw.sourcePostedAt) : null,
        },
      })
      added++
    } catch (e: any) {
      errors.push(`Failed: ${raw.title}: ${e.message}`); console.error("[ingest] job failed:", raw.title, e.message)
    }
  }

  return { added, skipped, enriched: enrichedCount, errors: errors.slice(0, 10) }
}
