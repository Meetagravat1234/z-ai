// Multi-provider AI system — tries z-ai first, falls back to free alternatives
// when rate limited (429). No more "Too many requests" errors!
//
// Provider priority (in order):
// 1. z-ai-web-dev-sdk (primary) — works in sandbox (Alibaba Cloud network)
// 2. OpenRouter (fallback 1) — free, 50+ models, OpenAI-compatible. Needs OPENROUTER_API_KEY
// 3. Groq (fallback 2) — free, fast. Needs GROQ_API_KEY
// 4. Google Gemini (fallback 3) — free, 1500 req/day. Needs GEMINI_API_KEY
//
// For web_search and page_reader, falls back to Jina AI (free, no key needed).

import ZAI from 'z-ai-web-dev-sdk'

// Track rate limit status so we don't keep trying a rate-limited provider.
let zaiRateLimitedUntil: number = 0
let openRouterRateLimitedUntil: number = 0
let groqRateLimitedUntil: number = 0
let geminiRateLimitedUntil: number = 0

const RATE_LIMIT_COOLDOWN = 45 * 1000 // 45 seconds — gives z-ai enough time to reset

// ============================================================================
// CHAT COMPLETIONS — multi-provider with retry (4 providers)
// ============================================================================
export async function chatComplete(
  messages: Array<{ role: string; content: string }>,
  options?: { thinking?: { type: string } }
): Promise<string> {
  // Provider 1: z-ai (primary) — with exponential backoff retry
  if (Date.now() > zaiRateLimitedUntil) {
    try {
      const zai = await getZai()
      if (zai) {
        const completion = await zai.chat.completions.create({
          messages: messages as any,
          thinking: options?.thinking || { type: 'disabled' },
        })
        const content = completion.choices[0]?.message?.content || ''
        if (content) return content
      }
    } catch (e: any) {
      if (e.message?.includes('429') || e.message?.includes('Too many requests') || e.message?.includes('rate limit')) {
        // Exponential backoff: wait 15s, then 25s, then give up
        // Total: 40s of waiting before falling back to other providers
        for (const waitMs of [15000, 25000]) {
          console.log(`[multi-ai] z-ai rate limited — waiting ${waitMs / 1000}s before retry`)
          await new Promise((r) => setTimeout(r, waitMs))
          try {
            const zai = await getZai()
            if (zai) {
              const completion = await zai.chat.completions.create({
                messages: messages as any,
                thinking: options?.thinking || { type: 'disabled' },
              })
              const content = completion.choices[0]?.message?.content || ''
              if (content) {
                console.log(`[multi-ai] z-ai retry succeeded after ${waitMs / 1000}s`)
                return content
              }
            }
          } catch {
            // Continue to next wait interval
          }
        }
        console.log('[multi-ai] z-ai exhausted retries — falling back to OpenRouter')
        zaiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      } else {
        console.log('[multi-ai] z-ai error:', e.message?.slice(0, 80))
      }
    }
  }

  // Provider 2: OpenRouter (free, 50+ models) — with retry
  if (Date.now() > openRouterRateLimitedUntil) {
    for (const attempt of [1, 2]) {
      try {
        const result = await openRouterChatComplete(messages)
        if (result) return result
      } catch (e: any) {
        if (e.message?.includes('429') || e.message?.includes('rate_limit')) {
          console.log(`[multi-ai] OpenRouter rate limited (attempt ${attempt}) — waiting 10s`)
          if (attempt === 1) await new Promise((r) => setTimeout(r, 10000))
          else openRouterRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
        } else {
          console.log('[multi-ai] OpenRouter error:', e.message?.slice(0, 80))
          break // Non-rate-limit error, don't retry
        }
      }
    }
  }

  // Provider 3: Groq (free, fast, OpenAI-compatible)
  if (Date.now() > groqRateLimitedUntil) {
    try {
      const result = await groqChatComplete(messages)
      if (result) return result
    } catch (e: any) {
      if (e.message?.includes('429') || e.message?.includes('rate_limit')) {
        console.log('[multi-ai] Groq rate limited — falling back to Gemini')
        groqRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      } else {
        console.log('[multi-ai] Groq error:', e.message?.slice(0, 80))
      }
    }
  }

  // Provider 4: Google Gemini (free, generous tier)
  if (Date.now() > geminiRateLimitedUntil) {
    try {
      const result = await geminiChatComplete(messages)
      if (result) return result
    } catch (e: any) {
      if (e.message?.includes('429') || e.message?.includes('rate_limit') || e.message?.includes('RESOURCE_EXHAUSTED')) {
        console.log('[multi-ai] Gemini rate limited — all 4 providers exhausted')
        geminiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      } else {
        console.log('[multi-ai] Gemini error:', e.message?.slice(0, 80))
      }
    }
  }

  throw new Error('All AI providers are rate limited. Wait 1-2 minutes and try again.')
}

// ============================================================================
// WEB SEARCH — multi-provider (z-ai → Jina AI Search)
// ============================================================================
export async function webSearch(query: string, num: number = 8): Promise<Array<{
  url: string
  name: string
  snippet: string
  host_name: string
  date?: string
}>> {
  // Try z-ai first
  if (Date.now() > zaiRateLimitedUntil) {
    try {
      const zai = await getZai()
      if (zai) {
        const results = await zai.functions.invoke('web_search', { query, num })
        if (Array.isArray(results) && results.length > 0) {
          return results
        }
      }
    } catch (e: any) {
      if (e.message?.includes('429')) {
        zaiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      }
    }
  }

  // Fallback to Jina AI Search (free, no key needed!)
  try {
    return await jinaSearch(query, num)
  } catch (e: any) {
    console.log('[multi-ai] Jina search error:', e.message?.slice(0, 80))
  }

  return []
}

// ============================================================================
// PAGE READER — multi-provider (z-ai → Jina AI Reader) with retry
// ============================================================================
export async function pageRead(url: string): Promise<{
  title: string
  html: string
  text: string
  publishedTime?: string
}> {
  // Try z-ai first
  if (Date.now() > zaiRateLimitedUntil) {
    try {
      const zai = await getZai()
      if (zai) {
        const result = await zai.functions.invoke('page_reader', { url })
        if (result?.data?.html) {
          return {
            title: result.data.title || '',
            html: result.data.html || '',
            text: stripHtml(result.data.html || ''),
            publishedTime: result.data.publishedTime || result.data.publish_time,
          }
        }
      }
    } catch (e: any) {
      if (e.message?.includes('429') || e.message?.includes('rate limit')) {
        console.log('[multi-ai] page_reader rate limited — waiting 5s and retrying once')
        await new Promise((r) => setTimeout(r, 5000))
        try {
          const zai = await getZai()
          if (zai) {
            const result = await zai.functions.invoke('page_reader', { url })
            if (result?.data?.html) {
              console.log('[multi-ai] page_reader retry succeeded')
              return {
                title: result.data.title || '',
                html: result.data.html || '',
                text: stripHtml(result.data.html || ''),
                publishedTime: result.data.publishedTime || result.data.publish_time,
              }
            }
          }
        } catch (e2: any) {
          console.log('[multi-ai] page_reader retry failed — using Jina fallback')
          zaiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
        }
      }
    }
  }

  // Fallback to Jina AI Reader (free, no key needed!)
  try {
    return await jinaRead(url)
  } catch (e: any) {
    console.log('[multi-ai] Jina reader error:', e.message?.slice(0, 80))
  }

  throw new Error('All page reader providers failed')
}

// ============================================================================
// HELPERS
// ============================================================================

let zaiInstance: any = null
async function getZai(): Promise<any | null> {
  if (zaiInstance) return zaiInstance
  try {
    zaiInstance = await ZAI.create()
    return zaiInstance
  } catch {
    return null
  }
}

// OpenRouter chat completions (free tier, 50+ models, OpenAI-compatible)
// Sign up at https://openrouter.ai — free with generous limits.
// Uses 'meta-llama/llama-3.1-8b-instruct:free' (free model, fast, good quality).
async function openRouterChatComplete(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set — sign up at https://openrouter.ai for free')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://www.hirebase.in',
      'X-Title': 'Hirebase',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} ${errText.slice(0, 100)}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// Groq chat completions (free, OpenAI-compatible API)
async function groqChatComplete(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set — sign up at https://console.groq.com for free')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error: ${response.status} ${errText.slice(0, 100)}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// Google Gemini chat completions (free, generous tier — 15 RPM, 1500 req/day)
// Sign up at https://aistudio.google.com/app/apikey to get a free API key.
// Tries multiple model names: gemini-2.0-flash → gemini-flash-latest → gemini-1.5-flash
// NOTE: Gemini API may return "User location is not supported" if the Vercel
// function runs in a restricted region (e.g. Hong Kong). In that case, Gemini
// silently fails and the fallback chain continues to the next provider.
async function geminiChatComplete(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set — sign up at https://aistudio.google.com for free')
  }

  const systemMessage = messages.find((m) => m.role === 'system')
  const userMessages = messages.filter((m) => m.role !== 'system')

  const contents = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  }
  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage.content }] }
  }

  // Try multiple model names — Google keeps renaming them
  const models = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-001', 'gemini-flash-2.0-001']
  let lastError = ''

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 404 || errText.includes('not found')) {
          lastError = `Model ${model} not found`
          continue
        }
        if (errText.includes('location is not supported')) {
          throw new Error('Gemini API: User location is not supported for API use')
        }
        throw new Error(`Gemini API error: ${response.status} ${errText.slice(0, 100)}`)
      }

      const data = await response.json()
      const candidate = data.candidates?.[0]
      const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || ''
      return text
    } catch (e: any) {
      lastError = e.message
      if (e.message?.includes('location is not supported')) break
    }
  }

  throw new Error(lastError || 'Gemini API failed')
}

// Jina AI Search (free, no key needed)
async function jinaSearch(query: string, num: number): Promise<Array<any>> {
  const url = `https://s.jina.ai/${encodeURIComponent(query)}`
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Retain-Images': 'none',
    },
  })

  if (!response.ok) throw new Error(`Jina search HTTP ${response.status}`)

  const data = await response.json()
  const results = data.data || []

  return results.slice(0, num).map((r: any) => ({
    url: r.url || '',
    name: r.title || '',
    snippet: r.description || r.content?.slice(0, 200) || '',
    host_name: r.url ? new URL(r.url).hostname : '',
    date: '',
  }))
}

// Jina AI Reader (free, no key needed — just prepend r.jina.ai/)
async function jinaRead(url: string): Promise<{ title: string; html: string; text: string; publishedTime?: string }> {
  const jinaUrl = `https://r.jina.ai/${url}`
  const response = await fetch(jinaUrl, {
    headers: {
      'Accept': 'application/json',
      'X-Retain-Images': 'none',
    },
  })

  if (!response.ok) throw new Error(`Jina reader HTTP ${response.status}`)

  const data = await response.json()
  const content = data.data || {}

  return {
    title: content.title || '',
    html: content.html || content.content || '',
    text: content.text || content.content || stripHtml(content.html || ''),
    publishedTime: content.publishedTime || content.publish_time,
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
