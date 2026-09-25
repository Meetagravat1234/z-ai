import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { estimateSalaryForJob } from '@/lib/salary-estimate'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Single job fetch: /api/jobs?id=<jobId>
    const id = searchParams.get('id')
    if (id) {
      const job = await db.job.findUnique({
        where: { id },
        include: { company: true },
      })
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      // Related jobs: same category or same company, exclude self
      const related = await db.job.findMany({
        where: {
          AND: [
            { id: { not: job.id } },
            { verified: true },
            {
              OR: [
                { companyId: job.companyId },
                { category: job.category },
                { skills: { contains: job.skills.split(',')[0] || '' } },
              ],
            },
          ],
        },
        include: { company: true },
        take: 6,
        orderBy: { postedAt: 'desc' },
      })

      // Increment view count (fire-and-forget)
      db.job.update({ where: { id }, data: { viewsCount: { increment: 1 } } }).catch(() => {})

      // Enrich job + related with estimated salary when actual salary is missing
      const enrichedJob = await enrichWithEstimatedSalary(job)
      const enrichedRelated = await Promise.all(related.map((j) => enrichWithEstimatedSalary(j)))

      return NextResponse.json({ job: enrichedJob, related: enrichedRelated })
    }

    const q = searchParams.get('q')?.toLowerCase()
    const category = searchParams.get('category')
    const domain = searchParams.get('domain')
    const company = searchParams.get('company')
    const workMode = searchParams.get('workMode')
    const experience = searchParams.get('experience')
    const location = searchParams.get('location')
    const employmentType = searchParams.get('employmentType')
    const skill = searchParams.get('skill')
    const minSalary = searchParams.get('minSalary')
    const maxSalary = searchParams.get('maxSalary')
    const sort = searchParams.get('sort') || 'recent' // recent | salary-high | salary-low
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const featured = searchParams.get('featured')
    const source = searchParams.get('source')
    const country = searchParams.get('country') // 'india' or 'all' (replaces indiaOnly)
    const indiaOnly = country === 'india' || searchParams.get('indiaOnly') === 'true'

    // Build the WHERE clause as an array of conditions (we'll AND them together)
    const conditions: any[] = []

    if (q) {
      // Split query into individual words and match ANY word (not the full phrase).
      // This way "embedded engineer" matches "Embedded Software Engineer" (which contains "embedded"),
      // "java developer" matches "Java Backend Developer", etc.
      // Words shorter than 2 chars are skipped.
      const words = q.split(/\s+/).filter((w) => w.length >= 2)
      // For multi-word queries: try to match jobs that contain ALL words first (more relevant).
      // If a word is too common (e.g. "engineer"), exclude it from the "must match" set,
      // but still include it in the OR set so we don't over-filter.
      if (words.length <= 1) {
        // Single word — use simple contains
        conditions.push({
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { skills: { contains: q, mode: 'insensitive' } },
            { company: { name: { contains: q, mode: 'insensitive' } } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        })
      } else {
        // Multi-word: build OR of per-word matches. The OR semantics mean a job that contains
        // any of the words will match. We rely on SQL's natural ordering (recent first) to
        // surface jobs that contain MORE words near the top — but Prisma doesn't support
        // relevance ranking out of the box, so the order may not be perfect.
        // For better UX, we could rank by word count in app code, but that's complex.
        // For now, OR semantics is much better than the old "exact phrase" behaviour.
        const wordConditions: any[] = []
        for (const w of words) {
          wordConditions.push(
            { title: { contains: w, mode: 'insensitive' } },
            { skills: { contains: w, mode: 'insensitive' } },
            { company: { name: { contains: w, mode: 'insensitive' } } },
            { description: { contains: w, mode: 'insensitive' } },
          )
        }
        conditions.push({ OR: wordConditions })
      }
    }

    // India filter: single condition with startsWith for speed
    // Matches locations containing Indian cities, "India", or "Remote"
    if (indiaOnly) {
      conditions.push({
        OR: [
          { location: { contains: 'India', mode: 'insensitive' } },
          { location: { contains: 'Bengaluru', mode: 'insensitive' } },
          { location: { contains: 'Bangalore', mode: 'insensitive' } },
          { location: { contains: 'Hyderabad', mode: 'insensitive' } },
          { location: { contains: 'Chennai', mode: 'insensitive' } },
          { location: { contains: 'Mumbai', mode: 'insensitive' } },
          { location: { contains: 'Pune', mode: 'insensitive' } },
          { location: { contains: 'Noida', mode: 'insensitive' } },
          { location: { contains: 'Gurugram', mode: 'insensitive' } },
          { location: { contains: 'Gurgaon', mode: 'insensitive' } },
          { location: { contains: 'Delhi', mode: 'insensitive' } },
          { location: { contains: 'Kolkata', mode: 'insensitive' } },
          { location: { contains: 'Remote', mode: 'insensitive' } },
          { location: { contains: 'Kochi', mode: 'insensitive' } },
          { location: { contains: 'Ahmedabad', mode: 'insensitive' } },
          { location: { contains: 'Jaipur', mode: 'insensitive' } },
          { location: { contains: 'Chandigarh', mode: 'insensitive' } },
          { location: { contains: 'Coimbatore', mode: 'insensitive' } },
        ],
      })
    }

    if (category && category !== 'all') conditions.push({ category })
    if (domain && domain !== 'all') conditions.push({ domain })
    if (workMode && workMode !== 'all') conditions.push({ workMode })
    if (employmentType && employmentType !== 'all') conditions.push({ employmentType })
    if (experience && experience !== 'all') conditions.push({ experience: { contains: experience } })
    if (location && location !== 'all') conditions.push({ location: { contains: location, mode: 'insensitive' } })
    if (skill && skill !== 'all') conditions.push({ skills: { contains: skill, mode: 'insensitive' } })
    if (minSalary) conditions.push({ salaryMin: { gte: parseInt(minSalary) } })
    if (maxSalary) conditions.push({ salaryMax: { lte: parseInt(maxSalary) } })
    if (featured === 'true') conditions.push({ isFeatured: true })
    if (source && source !== 'all') conditions.push({ source })

    if (company) {
      conditions.push({ company: { slug: company } })
    }

    const where: any = conditions.length > 0 ? { AND: conditions } : {}

    let orderBy: any = { postedAt: 'desc' }
    if (sort === 'salary-high') orderBy = { salaryMax: 'desc' }
    if (sort === 'salary-low') orderBy = { salaryMin: 'asc' }

    const jobs = await db.job.findMany({
      where,
      include: { company: true },
      orderBy,
      take: limit,
      skip: offset,
    })

    // Get total count for pagination/display (single count query)
    const total = await db.job.count({ where })

    // Enrich jobs that are missing salary with an estimated range based on
    // role + experience + location. Jobs with no salary AND not enough
    // benchmark data are returned as-is (the UI will hide the salary display).
    const enrichedJobs = await Promise.all(jobs.map((j) => enrichWithEstimatedSalary(j)))

    return NextResponse.json({ jobs: enrichedJobs, count: enrichedJobs.length, total })
  } catch (e: any) {
    console.error('Jobs API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * If a job has no salary data, attach an estimated range based on similar
 * listings in the database. The estimate is exposed as `estimatedSalary` on
 * the job object — the UI uses it to show "Est. ₹X – Y LPA" instead of the
 * old hardcoded "₹3-15 LPA" placeholder.
 */
async function enrichWithEstimatedSalary<T extends {
  salaryMin: number | null
  salaryMax: number | null
  title: string
  location: string
  experience: string
  category: string
  company?: { name?: string | null } | null
}>(job: T): Promise<T & { estimatedSalary?: { min: number; max: number; confidence: string; basis: string } | null }> {
  if (job.salaryMin != null || job.salaryMax != null) {
    return { ...job, estimatedSalary: null }
  }
  try {
    const estimate = await estimateSalaryForJob({
      title: job.title,
      location: job.location,
      experience: job.experience,
      category: job.category,
      company: job.company,
    })
    return { ...job, estimatedSalary: estimate }
  } catch (e) {
    // Enrichment failure should never break job display
    console.error('[jobs] Salary estimation failed for job:', job.title, e)
    return { ...job, estimatedSalary: null }
  }
}
