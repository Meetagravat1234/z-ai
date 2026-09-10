import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/salary-reports?companyId=... — list salary reports for a company
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

    const where: any = {}
    if (companyId) where.companyId = companyId

    const reports = await db.salaryReport.findMany({
      where,
      include: { company: { select: { name: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ reports })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/salary-reports — submit a salary report
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { companyId, role, location, salary, experience } = await req.json()

    if (!companyId || !role || !salary) {
      return NextResponse.json({ error: 'companyId, role, and salary are required' }, { status: 400 })
    }

    const report = await db.salaryReport.create({
      data: {
        companyId,
        userId: user.id,
        role,
        location: location || null,
        salary: Math.round(parseFloat(salary) * 10), // convert LPA to LPA*10
        experience: experience || 'Not specified',
        isAnonymous: true,
      },
      include: { company: { select: { name: true, logo: true } } },
    })

    return NextResponse.json({ ok: true, report })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
