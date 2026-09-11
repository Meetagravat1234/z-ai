import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { canUseAIToolWithAdGate, incrementUsage } from '@/lib/subscription'

// POST /api/export/track
// Body: { format: 'pdf' | 'docx' }
// Returns: { allowed: true, remaining: N, isPro: bool } OR { allowed: false, requiresAd: true, requiresUpgrade: bool }
//
// Called by the client BEFORE generating the PDF/DOCX. If allowed, the client
// proceeds to generate + download the file client-side, then calls this endpoint
// again with the same body to increment the usage counter.
//
// To keep the flow simple, this endpoint does BOTH: checks + increments in one call.
// If the user has quota or a valid ad token, we increment the counter and return allowed.
// If not, we return 403 with requiresAd or requiresUpgrade.
export async function POST(req: NextRequest) {
  try {
    const { format } = await req.json()
    if (!format || (format !== 'pdf' && format !== 'docx')) {
      return NextResponse.json({ error: 'format must be "pdf" or "docx"' }, { status: 400 })
    }

    const tool = format === 'pdf' ? 'pdfDownloads' : 'docxDownloads'
    const user = await getCurrentUser(req)
    const adToken = new URL(req.url).searchParams.get('adToken')

    const usage = await canUseAIToolWithAdGate(tool as any, user, adToken, req)

    if (!usage.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          error: usage.message,
          requiresAd: (usage as any).requiresAd,
          requiresUpgrade: !usage.isPro && !(usage as any).requiresAd,
          used: usage.used,
          limit: usage.limit,
        },
        { status: 403 },
      )
    }

    // Allowed — increment usage counter (skip if ad-watched)
    if (!usage.adWatched && user?.id) {
      await incrementUsage(tool as any, user.id)
    }

    return NextResponse.json({
      allowed: true,
      used: usage.used + (usage.adWatched ? 0 : 1),
      limit: usage.limit,
      remaining: Math.max(0, usage.limit - usage.used - (usage.adWatched ? 0 : 1)),
      isPro: usage.isPro,
      adWatched: usage.adWatched,
    })
  } catch (e: any) {
    console.error('[export/track] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
