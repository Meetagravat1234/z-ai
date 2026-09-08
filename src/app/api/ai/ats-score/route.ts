import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/ai/ats-score
// Body: { resume: string, jobDescription: string }
// Returns: ATS compatibility score (0-100) + specific fix recommendations
export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription } = await req.json()
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'resume and jobDescription are required' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS (Applicant Tracking System) analyzer. Given a resume and job description, calculate an ATS compatibility score and provide specific, actionable recommendations.

Output STRICT JSON (no markdown fences) with this exact shape:
{
  "overallScore": <0-100, overall ATS compatibility>,
  "scoreBreakdown": {
    "keywordMatch": <0-100, how well resume keywords match the JD>,
    "formatCompliance": <0-100, how well-formatted for ATS parsing>,
    "experienceRelevance": <0-100, how relevant the experience is to the role>,
    "skillsAlignment": <0-100, how well skills match required skills>,
    "quantification": <0-100, how well achievements are quantified with numbers>
  },
  "matchedKeywords": ["<keyword1>", "<keyword2>", ...],
  "missingKeywords": ["<keyword1>", "<keyword2>", ...],
  "issues": [{ "severity": "critical|warning|info", "category": "formatting|content|keywords|structure", "issue": "<description>", "fix": "<specific recommendation>" }],
  "strengths": ["<what's working well>", "<another strength>"],
  "topRecommendations": ["<top priority fix 1>", "<top priority fix 2>", "<top priority fix 3>", "<top priority fix 4>", "<top priority fix 5>"]
}

Rules:
- Score 90-100: Excellent, likely to pass ATS
- Score 70-89: Good, minor improvements needed
- Score 50-69: Moderate, several issues to address
- Score below 50: Poor, significant rework needed
- "matchedKeywords" should be skills/tools from the JD that appear in the resume
- "missingKeywords" should be skills/tools from the JD that DON'T appear in the resume (up to 10)
- "issues" should be specific to THIS resume (not generic advice)
- "topRecommendations" should be ordered by impact
- Be honest — don't inflate scores. Most resumes score 50-75.`,
        },
        {
          role: 'user',
          content: `RESUME:\n${resume}\n\n---\n\nJOB DESCRIPTION:\n${jobDescription}\n\n---\n\nCalculate the ATS score and provide recommendations.`,
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
      parsed = { rawText: raw }
    }
    return NextResponse.json({ result: parsed })
  } catch (e: any) {
    console.error('AI ats-score error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
