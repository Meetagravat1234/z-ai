import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/auth/me — returns the current authenticated user's full profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        headline: true,
        targetRole: true,
        skills: true,
        experienceYears: true,
        preferredLocations: true,
        minSalary: true,
        bio: true,
        createdAt: true,
        // Subscription + paywall fields (added for Razorpay integration)
        subscriptionTier: true,
        subscriptionEndsAt: true,
        resumeOptimizationsUsed: true,
        coverLettersUsed: true,
        mockInterviewsUsed: true,
        atsChecksUsed: true,
        skillGapAnalysesUsed: true,
        salaryPredictionsUsed: true,
        usageResetAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Serialize dates to ISO strings (NextResponse can't return Date objects)
    return NextResponse.json({
      user: {
        ...user,
        subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
        usageResetAt: user.usageResetAt.toISOString(),
      },
    })
  } catch (e: any) {
    console.error('Get current user error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
