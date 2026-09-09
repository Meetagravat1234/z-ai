import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'

// GET /api/admin/companies — list all companies
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const companies = await db.company.findMany({
      include: {
        _count: { select: { jobs: true } },
      },
      orderBy: { name: 'asc' },
    })

    const withStats = companies.map((c) => ({
      ...c,
      jobCount: c._count.jobs,
      _count: undefined,
    }))

    return NextResponse.json({ companies: withStats })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/admin/companies — create a company
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { name, logo, website, industry, size, hq, description, culture, benefits } = await req.json()
    if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 })

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
    const existing = await db.company.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Company already exists', existing }, { status: 409 })

    const company = await db.company.create({
      data: {
        name,
        slug,
        logo: logo || null,
        website: website || null,
        industry: industry || null,
        size: size || null,
        hq: hq || null,
        description: description || null,
        culture: culture || null,
        benefits: benefits || null,
        hiringActivity: 'Medium',
        sevenDayTrend: 0,
        verified: true,
      },
    })

    return NextResponse.json({ ok: true, company })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/admin/companies — update a company
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const allowed: any = {}
    for (const f of ['name', 'logo', 'website', 'industry', 'size', 'hq', 'description', 'culture', 'benefits', 'hiringActivity', 'sevenDayTrend', 'verified']) {
      if (updates[f] !== undefined) allowed[f] = updates[f]
    }

    const updated = await db.company.update({ where: { id }, data: allowed })
    return NextResponse.json({ ok: true, company: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/admin/companies?id=...
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.company.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
