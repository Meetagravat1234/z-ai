import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/ai/cover-letter
// Body: { resume: string, jobDescription: string, companyName?: string, role?: string }
export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription, companyName, role } = await req.json()
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'resume and jobDescription are required' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert cover letter writer. Write a concise, professional, and authentic cover letter (no longer than 350 words) that:
1. Opens with a strong hook referencing the role and company
2. Connects 2-3 specific achievements from the resume to the job description requirements
3. Demonstrates genuine research/interest in the company
4. Closes with a confident call to action
5. Uses natural language, no cliches like "I am writing to apply for"
Tone: warm, confident, specific. Avoid corporate buzzwords.`,
        },
        {
          role: 'user',
          content: `MY RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCOMPANY: ${companyName || 'the company'}\nROLE: ${role || 'the role'}\n\nPlease write the cover letter.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    return NextResponse.json({ result: completion.choices[0]?.message?.content || '' })
  } catch (e: any) {
    console.error('AI cover letter error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
