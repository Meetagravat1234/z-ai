import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {
    hasGroqKey: !!process.env.GROQ_API_KEY,
    groqKeyPrefix: process.env.GROQ_API_KEY?.slice(0, 10) + '...',
  }

  // Test 1: Direct Groq API call
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    })

    results.groqStatus = response.status
    results.groqOk = response.ok

    if (response.ok) {
      const data = await response.json()
      results.groqResponse = data.choices[0]?.message?.content
      results.groqTest = 'success'
    } else {
      const errText = await response.text()
      results.groqError = errText.slice(0, 200)
      results.groqTest = 'failed'
    }
  } catch (e: any) {
    results.groqTest = 'error'
    results.groqError = e.message
  }

  // Test 2: multi-ai chatComplete
  try {
    const { chatComplete } = await import('@/lib/multi-ai')
    const result = await chatComplete([
      { role: 'user', content: 'Say OK in one word' },
    ])
    results.multiAiTest = 'success'
    results.multiAiResponse = result.slice(0, 50)
  } catch (e: any) {
    results.multiAiTest = 'failed'
    results.multiAiError = e.message.slice(0, 200)
  }

  return NextResponse.json(results, { status: 200 })
}
