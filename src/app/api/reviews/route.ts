import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/reviews?companyId=... — list approved reviews for a company
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const all = searchParams.get('all') === 'true' // admin only

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (!all) where.isApproved = true

    const reviews = await db.review.findMany({
      where,
      include: { company: { select: { name: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Calculate aggregate stats if companyId is provided
    let stats = null
    if (companyId) {
      const allReviews = await db.review.findMany({
        where: { companyId, isApproved: true },
        select: { rating: true },
      })
      if (allReviews.length > 0) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
        stats = {
          count: allReviews.length,
          avgRating: Math.round(avg * 10) / 10,
        }
      }
    }

    return NextResponse.json({ reviews, stats })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/reviews — submit a new review (requires login)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be logged in to submit a review' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { companyId, rating, title, pros, cons, interviewExperience, salaryOffered, role } = await req.json()

    if (!companyId || !rating || !title) {
      return NextResponse.json({ error: 'companyId, rating, and title are required' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        companyId,
        userId: user.id,
        rating: parseInt(rating),
        title,
        pros: pros || null,
        cons: cons || null,
        interviewExperience: interviewExperience || null,
        salaryOffered: salaryOffered || null,
        role: role || null,
        isAnonymous: true,
        isApproved: true, // auto-approve for now (can add moderation later)
      },
      include: { company: { select: { name: true, logo: true } } },
    })

    return NextResponse.json({ ok: true, review })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
