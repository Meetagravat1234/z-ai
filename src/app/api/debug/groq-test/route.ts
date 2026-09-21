import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {
    hasGroqKey: !!process.env.GROQ_API_KEY,
  }

  // Get available models
  try {
    const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    })
    results.modelsStatus = modelsRes.status
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json()
      results.availableModels = modelsData.data?.map((m: any) => m.id) || []
    } else {
      results.modelsError = (await modelsRes.text()).slice(0, 200)
    }
  } catch (e: any) {
    results.modelsError = e.message
  }

  // Try chat with first available model
  if (results.availableModels?.length > 0) {
    try {
      const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: results.availableModels[0],
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        }),
      })
      results.chatStatus = chatRes.status
      results.chatModelUsed = results.availableModels[0]
      if (chatRes.ok) {
        const chatData = await chatRes.json()
        results.chatResponse = chatData.choices[0]?.message?.content
        results.chatTest = 'success'
      } else {
        results.chatError = (await chatRes.text()).slice(0, 200)
        results.chatTest = 'failed'
      }
    } catch (e: any) {
      results.chatTest = 'error'
      results.chatError = e.message
    }
  }

  return NextResponse.json(results, { status: 200 })
}
