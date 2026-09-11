import { NextRequest, NextResponse } from 'next/server'
import { chatComplete } from '@/lib/multi-ai'
import { getCurrentUser } from '@/lib/auth-server'
import { canUseAITool, incrementUsage } from '@/lib/subscription'

// POST /api/ai/skill-gap
// Body: { currentSkills: string[], targetRole: string, experienceYears?: number }
// Returns: gap analysis with missing skills, learning resources, timeline
export async function POST(req: NextRequest) {
  try {
    const { currentSkills, targetRole, experienceYears = 0 } = await req.json()
    if (!currentSkills || !Array.isArray(currentSkills) || !targetRole) {
      return NextResponse.json({ error: 'currentSkills (array) and targetRole are required' }, { status: 400 })
    }

    // Paywall
    const user = await getCurrentUser(req)
    const usage = await canUseAITool('skillGapAnalyses', user)
    if (!usage.allowed) {
      return NextResponse.json(
        { error: usage.message, requiresUpgrade: !usage.isPro, used: usage.used, limit: usage.limit },
        { status: 403 },
      )
    }

    const raw = await chatComplete(
      [
        {
          role: 'system',
          content: `You are an expert technical career counselor. Given a candidate's current skills and target role, perform a skill gap analysis.

Output STRICT JSON (no markdown fences) with this exact shape:
{
  "targetRoleSummary": "<1-2 sentence overview of what this role does>",
  "overallReadiness": <0-100, percentage of readiness for the role>,
  "haveSkills": [{ "skill": "<name>", "relevance": "high|medium|low", "note": "<why it matters for this role>" }],
  "missingSkills": [{ "skill": "<name>", "priority": "critical|important|nice-to-have", "note": "<why it's needed>", "learnTime": "<estimated weeks to learn>" }],
  "learningPath": [{ "phase": "<phase name like 'Foundation' or 'Advanced'>", "skills": ["<skill1>", "<skill2>"], "duration": "<estimated weeks>", "resources": [{ "name": "<resource name>", "type": "course|book|project|docs", "url": "<suggested url or 'search for: ...'>" }] }],
  "recommendedProjects": [{ "name": "<project name>", "description": "<what to build>", "skillsGained": ["<skill1>", "<skill2>"] }],
  "estimatedWeeksToReady": <number, total estimated weeks to close critical gaps>,
  "advice": "<2-3 sentence personalized career advice>"
}

Rules:
- Be realistic about learning times — assume the candidate can dedicate 10-15 hours/week.
- Match skills case-insensitively (e.g. "react" and "React.js" are the same).
- For "haveSkills", only include skills the candidate actually listed that are relevant to the role.
- For "missingSkills", prioritize based on what's most commonly required in job postings for that role.
- "learnTime" should be a string like "4-6 weeks" or "2-3 months".
- Include 3-5 recommended projects that would help close the gap.
- Provide 3-4 learning path phases (e.g. Foundation, Intermediate, Advanced, Specialization).`,
        },
        {
          role: 'user',
          content: `CURRENT SKILLS: ${currentSkills.join(', ')}
TARGET ROLE: ${targetRole}
CURRENT EXPERIENCE: ${experienceYears} years

Perform the skill gap analysis.`,
        },
      ])

    let parsed: any
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { rawText: raw }
    }

    if (user?.id) {
      await incrementUsage('skillGapAnalyses', user.id)
    }

    return NextResponse.json({
      result: parsed,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
        remaining: Math.max(0, usage.limit - usage.used - 1),
        isPro: usage.isPro,
      },
    })
  } catch (e: any) {
    console.error('AI skill-gap error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
