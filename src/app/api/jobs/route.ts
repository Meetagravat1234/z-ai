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

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { skills: { contains: q } },
      ]
    }
    if (category && category !== 'all') where.category = category
    if (workMode && workMode !== 'all') where.workMode = workMode
    if (employmentType && employmentType !== 'all') where.employmentType = employmentType
    if (experience && experience !== 'all') where.experience = { contains: experience }
    if (location && location !== 'all') where.location = { contains: location }
    if (skill && skill !== 'all') where.skills = { contains: skill }
    if (minSalary) where.salaryMin = { gte: parseInt(minSalary) }
    if (maxSalary) where.salaryMax = { lte: parseInt(maxSalary) }
    if (featured === 'true') where.isFeatured = true

    if (company) {
      where.company = { slug: company }
    }

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
