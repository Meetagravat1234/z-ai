import { NextRequest, NextResponse } from 'next/server'
import { issueAdToken, getUserIdentifier } from '@/lib/ad-gate'

// POST /api/ad-gate/issue-token
// Body: { tool: string }
// Returns: { token: string, expiresIn: 300, tool: string }
//
// Called by the frontend AFTER the 15-second ad countdown completes.
// Issues a signed JWT that lets the user make ONE AI tool call without
// consuming their free quota or requiring Pro subscription.
//
// Token is valid for 5 minutes. Single-use per tool is NOT enforced server-side
// (the 5-min expiry is the safeguard against abuse).
export async function POST(req: NextRequest) {
  try {
    const { tool } = await req.json()
    if (!tool) {
      return NextResponse.json({ error: 'tool is required' }, { status: 400 })
    }

    // Valid tool names — prevent abuse
    const VALID_TOOLS = [
      'resumeOptimizations',
      'coverLetters',
      'mockInterviews',
      'atsChecks',
      'skillGapAnalyses',
      'salaryPredictions',
    ]
    if (!VALID_TOOLS.includes(tool)) {
      return NextResponse.json({ error: 'Invalid tool name' }, { status: 400 })
    }

    // Get user identifier (user ID if logged in, else IP)
    const userIdentifier = getUserIdentifier(req)

    // Issue the token
    const token = issueAdToken(tool, userIdentifier)

    return NextResponse.json({
      token,
      expiresIn: 300, // 5 minutes
      tool,
    })
  } catch (e: any) {
    console.error('[ad-gate/issue-token] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
