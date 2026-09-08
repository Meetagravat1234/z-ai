import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/ai/enrich-job
// Body: { title, company, rawDescription, location? }
// Returns: { description, skills[], experience, category, employmentType, workMode, salaryMin?, salaryMax? }
export async function POST(req: NextRequest) {
  try {
    const { title, company, rawDescription, location } = await req.json()
    if (!title || !rawDescription) {
      return NextResponse.json({ error: 'title and rawDescription are required' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert job post editor. Given a raw job description (possibly scraped from an ATS, career page, or aggregator), produce a clean, well-structured, candidate-friendly version.

Output STRICT JSON (no markdown fences, no commentary) with this exact shape:
{
  "description": "<rewritten description, 3-6 paragraphs, Markdown with ## headings for sections like 'About the role', 'What you'll do', 'Required qualifications', 'Nice to have', 'Benefits'. Keep all factual info from the original. Strip boilerplate, EEO statements, and tracking pixels. Make it readable.>",
  "skills": ["<skill1>", "<skill2>", ...up to 8 most important],
  "experience": "<one of: '0 Years' | '0-2 Years' | '1-3 Years' | '3-5 Years' | '5-8 Years' | '8+ Years'>",
  "category": "<one of: 'fresher' | 'internship' | 'experienced' | 'remote' | 'walk-in'>",
  "employmentType": "<one of: 'Full-time' | 'Part-time' | 'Contract' | 'Internship'>",
  "workMode": "<one of: 'Onsite' | 'Remote' | 'Hybrid'>",
  "salaryMin": <number or null, in LPA * 10 so 8 LPA = 80>,
  "salaryMax": <number or null, in LPA * 10>
}

Rules:
- If salary is not mentioned, return null for both salaryMin and salaryMax.
- If salary is in USD or other currency, convert to INR LPA equivalent (1 USD ≈ ₹83, so $100k ≈ ₹83 LPA).
- If location mentions "remote" or "work from anywhere", set workMode=Remote.
- If the title contains "intern" or "internship", set category=internship and employmentType=Internship.
- If "0 years" or "fresh graduate" or "entry level" appears, set category=fresher.
- Be conservative on skills — only include ones actually mentioned or strongly implied.
- The rewritten description should preserve all factual content but be clearer and better organized than the raw input.`,
        },
        {
          role: 'user',
          content: `TITLE: ${title}
COMPANY: ${company || 'Unknown'}
LOCATION: ${location || 'Not specified'}

RAW DESCRIPTION:
${rawDescription}

Produce the enriched JSON now.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    let parsed: any
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // If JSON parse fails, fall back to using the raw text as description
      parsed = {
        description: raw,
        skills: [],
        experience: '0-2 Years',
        category: 'experienced',
        employmentType: 'Full-time',
        workMode: 'Onsite',
        salaryMin: null,
        salaryMax: null,
      }
    }
    return NextResponse.json({ result: parsed })
  } catch (e: any) {
    console.error('AI enrich-job error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
