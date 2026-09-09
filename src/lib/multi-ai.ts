// Multi-provider AI system — tries z-ai first, falls back to free alternatives
// when rate limited (429). No more "Too many requests" errors!
//
// Providers:
// 1. z-ai-web-dev-sdk (primary) — works in sandbox (Alibaba Cloud network)
// 2. Groq (fallback 1) — free, fast, OpenAI-compatible. Needs GROQ_API_KEY env var
// 3. (future) Google Gemini fallback
//
// For web_search and page_reader, falls back to Jina AI (free, no key needed).

import ZAI from 'z-ai-web-dev-sdk'

// Track rate limit status so we don't keep trying a rate-limited provider
let zaiRateLimitedUntil: number = 0
let groqRateLimitedUntil: number = 0

const RATE_LIMIT_COOLDOWN = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// CHAT COMPLETIONS — multi-provider
// ============================================================================
export async function chatComplete(
  messages: Array<{ role: string; content: string }>,
  options?: { thinking?: { type: string } }
): Promise<string> {
  // Try z-ai first (if not rate limited)
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
      if (e.message?.includes('429') || e.message?.includes('Too many requests')) {
        console.log('[multi-ai] z-ai rate limited, falling back to Groq')
        zaiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      } else {
        console.log('[multi-ai] z-ai error:', e.message?.slice(0, 80))
      }
    }
  }

  // Fallback to Groq (free, OpenAI-compatible)
  if (Date.now() > groqRateLimitedUntil) {
    try {
      const result = await groqChatComplete(messages)
      if (result) return result
    } catch (e: any) {
      if (e.message?.includes('429') || e.message?.includes('rate_limit')) {
        console.log('[multi-ai] Groq rate limited too')
        groqRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      }
    }
  }

  throw new Error('All AI providers are rate limited. Please try again in a few minutes.')
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
// PAGE READER — multi-provider (z-ai → Jina AI Reader)
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
      if (e.message?.includes('429')) {
        zaiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
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
      model: 'llama-3.1-8b-instant',
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
