import { NextRequest, NextResponse } from 'next/server'
import { chatComplete } from '@/lib/multi-ai'
import { getCurrentUser } from '@/lib/auth-server'
import { canUseAITool, incrementUsage } from '@/lib/subscription'

// POST /api/ai/mock-interview
// Body: { messages: [{role, content}], role?: string, company?: string }
// Returns: next interviewer message
export async function POST(req: NextRequest) {
  try {
    const { messages, role, company } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    // Paywall — but only count a NEW session (when messages array length is 1, this is a fresh start)
    const isNewSession = messages.length <= 1
    const user = await getCurrentUser(req)
    let usage: any = { allowed: true, used: 0, limit: 999, isPro: false }
    if (isNewSession) {
      usage = await canUseAITool('mockInterviews', user)
      if (!usage.allowed) {
        return NextResponse.json(
          { error: usage.message, requiresUpgrade: !usage.isPro, used: usage.used, limit: usage.limit },
          { status: 403 },
        )
      }
    }

    const systemPrompt = `You are an experienced technical interviewer${company ? ` at ${company}` : ''}${role ? ` interviewing for the role of ${role}` : ''}.

Rules:
1. Ask one question at a time. Start with a brief intro and the first question.
2. After the candidate answers, briefly acknowledge (1 short sentence), then ask the next question.
3. Cover a mix of: behavioral (STAR), technical depth, problem-solving, and culture-fit.
4. If the candidate's answer is weak or vague, ask a focused follow-up.
5. Keep your turns SHORT — under 100 words. The candidate should do most of the talking.
6. After 5-6 questions, transition to "Do you have any questions for me?" and answer briefly.
7. Be warm but rigorous. Real interviewer tone, not robotic.

The candidate's first message will be a greeting or "ready". Begin with your intro and the first question.`

    const raw = await chatComplete(
      [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ])

    // Only increment usage counter on first message (one increment per interview session)
    if (isNewSession && user?.id) {
      await incrementUsage('mockInterviews', user.id)
    }

    return NextResponse.json({
      result: raw || '',
      ...(isNewSession ? {
        usage: {
          used: usage.used + 1,
          limit: usage.limit,
          remaining: Math.max(0, usage.limit - usage.used - 1),
          isPro: usage.isPro,
        },
      } : {}),
    })
  } catch (e: any) {
    console.error('AI mock interview error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
