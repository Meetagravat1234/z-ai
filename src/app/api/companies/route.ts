import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const company = await db.company.findUnique({
        where: { slug },
        include: {
          jobs: {
            where: { verified: true },
            orderBy: { postedAt: 'desc' },
            take: 50,
          },
        },
      })
      if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Inject the parent company into each job so JobCard can render without a separate fetch
      const jobs = company.jobs.map((j) => ({ ...j, company }))
      return NextResponse.json({ company: { ...company, jobs } })
    }

    const companies = await db.company.findMany({
      include: {
        _count: { select: { jobs: { where: { verified: true } } } },
      },
      orderBy: { name: 'asc' },
    })

    const withStats = companies.map((c) => ({
      ...c,
      openRoles: c._count.jobs,
      _count: undefined,
    }))

    return NextResponse.json({ companies: withStats })
  } catch (e: any) {
    console.error('Companies API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
