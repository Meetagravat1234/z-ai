import { NextRequest, NextResponse } from 'next/server'
import { chatComplete } from '@/lib/multi-ai'

// POST /api/ai/salary-predict
// Body: { role, company?, location?, experienceYears, skills[] }
export async function POST(req: NextRequest) {
  try {
    const { role, company, location, experienceYears, skills } = await req.json()
    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 })
    }

    const raw = await chatComplete(
      [
        {
          role: 'system',
          content: `You are an expert compensation analyst for the Indian tech job market. Given role details, predict a realistic salary range.

Output STRICT JSON (no markdown, no commentary) with this shape:
{
  "predictedRange": { "min": <number>, "max": <number>, "currency": "INR", "unit": "LPA" },
  "baseSalary": <number>,
  "bonus": <number>,
  "stock": <number>,
  "confidence": "low" | "medium" | "high",
  "keyFactors": [{ "factor": "<string>", "impact": "<positive|negative>", "note": "<short>" }],
  "negotiationTips": ["<tip1>", "<tip2>", "<tip3>"],
  "marketOutlook": "<2-3 sentence summary>"
}

Numbers in LPA (lakhs per annum). Be realistic for Indian market. If experience is 0 years, this is a fresher role.`,
        },
        {
          role: 'user',
          content: `Role: ${role}
Company: ${company || 'mid-tier tech company'}
Location: ${location || 'Bengaluru'}
Experience: ${experienceYears} years
Skills: ${(skills || []).join(', ')}

Predict the salary.`,
        },
      ])

    let parsed: any
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { rawText: raw }
    }
    return NextResponse.json({ result: parsed })
  } catch (e: any) {
    console.error('AI salary predict error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
