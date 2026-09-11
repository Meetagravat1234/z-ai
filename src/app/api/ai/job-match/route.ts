import { NextRequest, NextResponse } from 'next/server'
import { chatComplete } from '@/lib/multi-ai'
import { db } from '@/lib/db'

// POST /api/ai/job-match
// Body: { jobId: string }
// Returns: { score: 0-100, breakdown: {...}, reasons: [...], missingSkills: [...] }
// Uses the logged-in user's profile (targetRole, skills, experience) from session.
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({
        requiresAuth: true,
        message: 'Sign in to see your personalized match score',
      })
    }

    if (!user.targetRole && !user.skills) {
      return NextResponse.json({
        needsProfile: true,
        message: 'Add your target role and skills to your profile to get a match score',
      })
    }

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const userSkills = (user.skills || '').split(',').map((s) => s.trim()).filter(Boolean)
    const jobSkills = (job.skills || '').split(',').map((s) => s.trim()).filter(Boolean)

    const raw = await chatComplete([
      {
        role: 'system',
        content: `You are an expert technical recruiter. Given a candidate's profile and a job listing, compute a match score (0-100) and explain the reasoning.

Output STRICT JSON (no markdown fences, no commentary) with this exact shape:
{
  "score": <0-100 integer>,
  "breakdown": {
    "skillsMatch": <0-100>,
    "experienceMatch": <0-100>,
    "locationMatch": <0-100>,
    "roleMatch": <0-100>
  },
  "matchedSkills": ["<skill1>", "<skill2>"],
  "missingSkills": ["<skill1>", "<skill2>"],
  "reasons": ["<short reason 1>", "<short reason 2>", "<short reason 3>"],
  "suggestion": "<one-sentence advice on what to highlight in their application>"
}

Rules:
- Score meaning: 90+ excellent, 75-89 strong, 60-74 decent, 40-59 weak, <40 poor.
- Use the actual skill names from the job posting.
- Be objective — do not inflate the score.
- Keep "reasons" to 2-3 short bullet-style sentences (max 15 words each).
- "suggestion" should be actionable.`,
      },
      {
        role: 'user',
        content: `CANDIDATE PROFILE:
- Target role: ${user.targetRole || 'Not specified'}
- Current skills: ${userSkills.join(', ') || 'None listed'}
- Experience: ${user.experience || 'Not specified'}
- Preferred location: ${user.preferredLocation || 'Not specified'}

JOB LISTING:
- Title: ${job.title}
- Company: ${job.company.name}
- Required skills: ${jobSkills.join(', ') || 'Not specified'}
- Experience required: ${job.experience}
- Work mode: ${job.workMode}
- Location: ${job.location}
- Employment type: ${job.employmentType}
- Category: ${job.category}

Compute the match score.`,
      },
    ])

    let parsed: any
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // Fallback: deterministic score from skills overlap
      const matched = userSkills.filter((us) =>
        jobSkills.some((js) => js.toLowerCase().includes(us.toLowerCase()) || us.toLowerCase().includes(js.toLowerCase()))
      )
      const missing = jobSkills.filter((js) => !matched.some((m) => js.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(js.toLowerCase())))
      const skillScore = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 50
      parsed = {
        score: skillScore,
        breakdown: { skillsMatch: skillScore, experienceMatch: 70, locationMatch: 70, roleMatch: 75 },
        matchedSkills: matched,
        missingSkills: missing,
        reasons: ['Computed via fallback algorithm (LLM unavailable)'],
        suggestion: 'Highlight your relevant project experience in your application.',
      }
    }

    return NextResponse.json({ result: parsed })
  } catch (e: any) {
    console.error('AI job-match error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function getCurrentUser(req: NextRequest) {
  try {
    const url = new URL('/api/auth/me', req.nextUrl.origin).toString()
    const res = await fetch(url, {
      headers: { cookie: req.headers.get('cookie') || '' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user || null
  } catch {
    return null
  }
}
