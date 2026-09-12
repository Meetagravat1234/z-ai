import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/skill-tests — list all published skill tests
// Optional query: ?subject=c (filter by subject)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')
    const where: any = { isPublished: true }
    if (subject && subject !== 'all') where.subject = subject

    const tests = await db.skillTest.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        subject: true,
        topic: true,
        testType: true,
        description: true,
        difficulty: true,
        durationMin: true,
        passingScore: true,
        _count: { select: { questions: true } },
      },
      orderBy: [
        { subject: 'asc' },
        { testType: 'asc' },
      ],
    })

    return NextResponse.json({ tests })
  } catch (e: any) {
    console.error('Skill tests API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
