import { NextRequest, NextResponse } from 'next/server'
import { chatComplete } from '@/lib/multi-ai'
import { getCurrentUser } from '@/lib/auth-server'
import { canUseAIToolWithAdGate as canUseAITool, incrementUsage } from '@/lib/subscription'

// POST /api/ai/resume-optimize
// Body: { resume: string, jobDescription: string }
// Returns tailored, ATS-friendly resume
export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription } = await req.json()
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Both resume and jobDescription are required' }, { status: 400 })
    }

    // Paywall: check user is authenticated + has remaining usage (or valid ad token)
    const user = await getCurrentUser(req)
    const adToken = new URL(req.url).searchParams.get('adToken')
    const usage = await canUseAITool('resumeOptimizations', user, adToken, req)
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: usage.message,
          requiresUpgrade: !usage.isPro && !usage.requiresAd,
          requiresAd: usage.requiresAd,
          used: usage.used,
          limit: usage.limit,
        },
        { status: 403 },
      )
    }

    const raw = await chatComplete(
      [
        {
          role: 'system',
          content: `You are an expert ATS resume optimizer. Given a candidate's current resume and a target job description, produce a tailored, ATS-friendly resume that:
1. Aligns keywords with the job description
2. Quantifies achievements wherever possible
3. Reorders and rephrases bullet points to surface the most relevant experience first
4. Uses strong action verbs
5. Keeps the same factual content (do NOT invent new jobs, degrees, or employers)
6. Outputs clean Markdown with sections: Professional Summary, Core Skills, Experience (reverse-chronological), Education, Certifications
7. Adds a brief Tailoring Notes section at the end explaining the top 3 changes made`,
        },
        {
          role: 'user',
          content: `MY CURRENT RESUME:\n${resume}\n\n---\n\nTARGET JOB DESCRIPTION:\n${jobDescription}\n\n---\n\nPlease produce the tailored ATS-optimized resume in Markdown.`,
        },
      ])

    const content = raw || ''

    // Increment usage counter AFTER successful AI call
    // Skip if user watched an ad (ad-watched = free use, doesn't consume quota)
    if (!usage.adWatched && user?.id) {
      await incrementUsage('resumeOptimizations', user.id)
    }

    return NextResponse.json({
      result: content,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - usage.used - 1),
        isPro: usage.isPro,
      },
    })
  } catch (e: any) {
    console.error('AI resume optimize error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
