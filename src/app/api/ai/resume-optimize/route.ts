import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getZai } from '@/lib/zai-loader'

// POST /api/ai/resume-optimize
// Body: { resume: string, jobDescription: string }
// Returns tailored, ATS-friendly resume
export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription } = await req.json()
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Both resume and jobDescription are required' }, { status: 400 })
    }

    const zai = await getZai()
    const completion = await zai.chat.completions.create({
      messages: [
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
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ result: content })
  } catch (e: any) {
    console.error('AI resume optimize error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
