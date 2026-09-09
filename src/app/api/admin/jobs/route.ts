import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'
import crypto from 'crypto'

// GET /api/admin/jobs — list all jobs with admin metadata (paginated)
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const source = searchParams.get('source')
    const category = searchParams.get('category')

    const where: any = {}
    if (source && source !== 'all') where.source = source
    if (category && category !== 'all') where.category = category

    const jobs = await db.job.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.job.count({ where })

    return NextResponse.json({ jobs, total })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/admin/jobs — create a job manually
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await req.json()
    const {
      title, company, companySlug, companyLogo, companyWebsite, industry,
      category, employmentType, workMode, experience,
      salaryMin, salaryMax, salaryCurrency,
      location, skills, description, applyUrl,
      isFeatured, sourcePostedAt,
    } = body

    // Validate required fields
    if (!title || !company || !location || !description) {
      return NextResponse.json(
        { error: 'Required fields: title, company, location, description' },
        { status: 400 }
      )
    }

    // Find or create the company
    const slug = companySlug || company.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
    let companyRecord = await db.company.findUnique({ where: { slug } })
    if (!companyRecord) {
      companyRecord = await db.company.create({
        data: {
          name: company,
          slug,
          logo: companyLogo || null,
          website: companyWebsite || null,
          industry: industry || null,
          hiringActivity: 'Medium',
          sevenDayTrend: 0,
          verified: true,
        },
      })
    }

    // Compute hash for dedup
    const hash = crypto
      .createHash('sha1')
      .update(`${title}|${companyRecord.id}|${location.split(',')[0].trim()}`)
      .digest('hex')

    // Check for existing
    const existing = await db.job.findFirst({ where: { hash } })
    if (existing) {
      return NextResponse.json({ error: 'A job with this title, company, and location already exists', existing }, { status: 409 })
    }

    const job = await db.job.create({
      data: {
        title,
        companyId: companyRecord.id,
        category: category || 'experienced',
        employmentType: employmentType || 'Full-time',
        workMode: workMode || 'Onsite',
        experience: experience || '0-2 Years',
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        salaryCurrency: salaryCurrency || 'INR',
        location,
        skills: skills || '',
        description,
        applyUrl: applyUrl || null,
        postedAt: sourcePostedAt ? new Date(sourcePostedAt) : new Date(),
        verified: true,
        isFeatured: isFeatured || false,
        source: 'admin',
        sourceRef: `admin-${admin.id}-${Date.now()}`,
        hash,
        originalDescription: description,
        enriched: true,
        enrichedAt: new Date(),
        sourcePostedAt: sourcePostedAt ? new Date(sourcePostedAt) : null,
      },
      include: { company: true },
    })

    return NextResponse.json({ ok: true, job })
  } catch (e: any) {
    console.error('Admin create job error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/admin/jobs — update a job (e.g., toggle featured, edit fields)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Only allow updating safe fields
    const allowed: any = {}
    const safeFields = [
      'title', 'category', 'employmentType', 'workMode', 'experience',
      'salaryMin', 'salaryMax', 'salaryCurrency', 'location', 'skills',
      'description', 'applyUrl', 'isFeatured', 'verified',
    ]
    for (const f of safeFields) {
      if (updates[f] !== undefined) allowed[f] = updates[f]
    }

    const updated = await db.job.update({
      where: { id },
      data: allowed,
      include: { company: true },
    })

    return NextResponse.json({ ok: true, job: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/admin/jobs?id=... — delete a job
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.job.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
