import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getZai } from '@/lib/zai-loader'

// POST /api/ai/mock-interview
// Body: { messages: [{role, content}], role?: string, company?: string }
// Returns: next interviewer message
export async function POST(req: NextRequest) {
  try {
    const { messages, role, company } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    const zai = await getZai()
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

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      thinking: { type: 'disabled' },
    })

    return NextResponse.json({ result: completion.choices[0]?.message?.content || '' })
  } catch (e: any) {
    console.error('AI mock interview error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
