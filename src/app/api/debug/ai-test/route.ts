import { NextResponse } from 'next/server'
import { chatComplete } from '@/lib/multi-ai'

/**
 * GET /api/debug/ai-test
 *
 * Tests the full AI provider chain (z-ai → Groq → Gemini) by making a real
 * chat completion call. Returns which provider succeeded (or the errors
 * from each).
 *
 * No auth required — but it only does a tiny "Say OK" test, so abuse is
 * limited. Useful for debugging "All AI providers are rate limited" errors.
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    envVars: {
      GROQ_API_KEY: process.env.GROQ_API_KEY ? `set (${process.env.GROQ_API_KEY.slice(0, 10)}...)` : 'NOT SET',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `set (${process.env.GEMINI_API_KEY.slice(0, 10)}...)` : 'NOT SET',
    },
  }

  // Test 1: Direct Groq call with our actual model
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    })
    results.groqDirect = {
      status: groqRes.status,
      ok: groqRes.ok,
    }
    if (groqRes.ok) {
      const data = await groqRes.json()
      results.groqDirect.response = data.choices[0]?.message?.content
      results.groqDirect.test = 'success'
    } else {
      const errText = await groqRes.text()
      results.groqDirect.error = errText.slice(0, 300)
      results.groqDirect.test = 'failed'
    }
  } catch (e: any) {
    results.groqDirect = { test: 'error', error: e.message }
  }

  // Test 2: Full chatComplete() call (goes through z-ai → Groq → Gemini chain)
  try {
    const result = await chatComplete([
      { role: 'system', content: 'You are a test bot. Respond with exactly: OK' },
      { role: 'user', content: 'Test' },
    ])
    results.chatComplete = {
      test: 'success',
      response: result.slice(0, 100),
      length: result.length,
    }
  } catch (e: any) {
    results.chatComplete = {
      test: 'failed',
      error: e.message,
    }
  }

  return NextResponse.json(results, { status: 200 })
}
