import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

      return NextResponse.json({ job, related })
    }

    const q = searchParams.get('q')?.toLowerCase()
    const category = searchParams.get('category')
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
    const indiaOnly = searchParams.get('indiaOnly') === 'true'

    // Build the WHERE clause as an array of conditions (we'll AND them together)
    const conditions: any[] = []

    if (q) {
      conditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { skills: { contains: q } },
        ],
      })
    }

    // India-only filter: location must contain any Indian city, "India", or "Remote"
    if (indiaOnly) {
      const indiaCities = [
        'Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune',
        'Noida', 'Gurugram', 'Gurgaon', 'Delhi', 'Kolkata', 'Kochi',
        'Coimbatore', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'India', 'Remote',
      ]
      conditions.push({
        OR: indiaCities.map((city) => ({ location: { contains: city } })),
      })
    }

    if (category && category !== 'all') conditions.push({ category })
    if (workMode && workMode !== 'all') conditions.push({ workMode })
    if (employmentType && employmentType !== 'all') conditions.push({ employmentType })
    if (experience && experience !== 'all') conditions.push({ experience: { contains: experience } })
    if (location && location !== 'all') conditions.push({ location: { contains: location } })
    if (skill && skill !== 'all') conditions.push({ skills: { contains: skill } })
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

    return NextResponse.json({ jobs, count: jobs.length })
  } catch (e: any) {
    console.error('Jobs API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
