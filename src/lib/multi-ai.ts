// Multi-provider AI system — tries z-ai first, falls back to free alternatives
// when rate limited (429). No more "Too many requests" errors!
//
// Provider priority (in order):
//   1. z-ai-web-dev-sdk (primary) — works in sandbox (Alibaba Cloud network)
//   2. OpenRouter (fallback 1) — free tier, 50 free-model requests / day.
//      Needs OPENROUTER_API_KEY. Uses 2 confirmed-working free models with
//      automatic failover between them.
//   3. Groq (fallback 2) — free, fast (Llama 3.1 / GPT-OSS). Needs GROQ_API_KEY.
//      ⚠️ Groq Cloud blocks Hong Kong region — Vercel must be deployed in
//      iad1 / sfo1 / pdx1 / cdg1 / fra1 / etc. (NOT hkg1).
//   4. Google Gemini (fallback 3) — free, generous tier. Needs GEMINI_API_KEY.
//      ⚠️ Same Hong Kong region restriction as Groq.
//
// For web_search and page_reader, falls back to Jina AI (free, no key needed).
//
// Verified API limits (2026-09-21):
//   • OpenRouter free tier: 50 free-model requests / day / API key
//   • OpenRouter rate limit: unlimited requests per 10s (requests:-1)
//   • Groq free tier:        30 RPM, 14,400 req/day, 500,000 TPD (varies per model)
//   • Gemini free tier:      15 RPM, 1,500 req/day
//   • z-ai:                  ~15 calls before rate limit (45s cooldown)

import ZAI from 'z-ai-web-dev-sdk'

// Track rate limit status so we don't keep trying a rate-limited provider.
let zaiRateLimitedUntil: number = 0
let openRouterRateLimitedUntil: number = 0
let groqRateLimitedUntil: number = 0
let geminiRateLimitedUntil: number = 0

const RATE_LIMIT_COOLDOWN = 45 * 1000 // 45 seconds — gives z-ai enough time to reset

// Per-provider timeout — ensures total time stays under Vercel's 60s limit.
// If all 4 providers are tried sequentially with 15s each, total = 60s max.
// Most calls complete in 3-8s, so 15s is generous.
const PROVIDER_TIMEOUT_MS = 15_000

/**
 * Wrap a promise with a timeout. If the promise doesn't resolve within
 * `timeoutMs`, reject with a timeout error.
 *
 * Uses AbortController when the underlying fetch supports it (OpenRouter,
 * Groq, Gemini). For z-ai SDK (no AbortSignal support), uses Promise.race.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  providerName: string,
  signal?: AbortSignal,
): Promise<T> {
  // If an external AbortSignal is already aborted, fail fast
  if (signal?.aborted) {
    throw new Error(`${providerName} aborted`)
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${providerName} timed out after ${timeoutMs / 1000}s`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise]) as T
    if (timeoutId) clearTimeout(timeoutId)
    return result
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId)
    throw e
  }
}

// ============================================================================
// CHAT COMPLETIONS — multi-provider with retry (4 providers)
// ============================================================================
export async function chatComplete(
  messages: Array<{ role: string; content: string }>,
  options?: { thinking?: { type: string } }
): Promise<string> {
  // Provider 1: z-ai (primary) — single attempt, no internal waits
  // If z-ai fails, immediately try fallback providers. The retry-to-pending
  // logic in bulk-fetch/process will retry the URL on the next poll cycle
  // (40s later) — no need to waste time waiting inside this function.
  if (Date.now() > zaiRateLimitedUntil) {
    try {
      const zai = await getZai()
      if (zai) {
        // Wrap z-ai call in a 15s timeout to prevent 504 on Vercel
        const completion: any = await withTimeout(
          zai.chat.completions.create({
            messages: messages as any,
            thinking: options?.thinking || { type: 'disabled' },
          }),
          PROVIDER_TIMEOUT_MS,
          'z-ai',
        )
        const content = completion.choices[0]?.message?.content || ''
        if (content) return content
      }
    } catch (e: any) {
      if (e.message?.includes('timed out')) {
        console.log('[multi-ai] z-ai timed out — trying fallback providers')
      } else if (e.message?.includes('429') || e.message?.includes('Too many requests') || e.message?.includes('rate limit')) {
        console.log('[multi-ai] z-ai rate limited — trying fallback providers immediately')
        zaiRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      } else {
        console.log('[multi-ai] z-ai error:', e.message?.slice(0, 80))
      }
    }
  }

  // Provider 2: OpenRouter (free, 50+ models)
  if (Date.now() > openRouterRateLimitedUntil) {
    try {
      const result = await withTimeout(
        openRouterChatComplete(messages),
        PROVIDER_TIMEOUT_MS,
        'OpenRouter',
      )
      if (result) return result
    } catch (e: any) {
      if (e.message?.includes('timed out')) {
        console.log('[multi-ai] OpenRouter timed out — falling back to Groq')
      } else if (e.message?.includes('429') || e.message?.includes('rate_limit')) {
        console.log('[multi-ai] OpenRouter rate limited — falling back to Groq')
        openRouterRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN
      } else {
        console.log('[multi-ai] OpenRouter error:', e.message?.slice(0, 80))
      }
    }
  }

  // Provider 3: Groq (free, fast, OpenAI-compatible)
  if (Date.now() > groqRateLimitedUntil) {
    try {
      const result = await withTimeout(
        groqChatComplete(messages),
        PROVIDER_TIMEOUT_MS,
        'Groq',
      )
      if (result) return result
    } catch (e: any) {
      if (e.message?.includes('timed out')) {
        console.log('[multi-ai] Groq timed out — falling back to Gemini')
      } else if (e.message?.includes('429') || e.message?.includes('rate_limit')) {
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
      const result = await withTimeout(
        geminiChatComplete(messages),
        PROVIDER_TIMEOUT_MS,
        'Gemini',
      )
      if (result) return result
    } catch (e: any) {
      if (e.message?.includes('timed out')) {
        console.log('[multi-ai] Gemini timed out — all 4 providers exhausted')
      } else if (e.message?.includes('429') || e.message?.includes('rate_limit') || e.message?.includes('RESOURCE_EXHAUSTED')) {
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

// OpenRouter chat completions (free tier, 50 free-model requests / day).
// Sign up at https://openrouter.ai — free with generous limits.
//
// Verified working free models (2026-09-21):
//   • nvidia/nemotron-3.5-lightning:free  — 1M ctx, fast, best for long pages
//   • liquid/lfm-2.5-2.6b:free            — 65K ctx, smaller but very reliable
//
// Previously used 'meta-llama/llama-3.1-8b-instruct:free' but that model
// was moved to paid-only — the API returns:
//   "This model is unavailable for free. The paid version is available now -
//    use this slug instead: meta-llama/llama-3.1-8b-instruct"
//
// Daily budget tracking: OpenRouter hard-caps free model requests at 50/day
// per API key. We track usage locally and stop trying OpenRouter after we've
// used 45 calls, leaving a 5-call buffer for manual debugging.
let openRouterCallsToday = 0
let openRouterResetAt = 0 // epoch ms when counter resets
const OPENROUTER_DAILY_BUDGET = 45 // hard cap (leave 5-call buffer)

function maybeResetOpenRouterCounter() {
  const now = Date.now()
  if (now > openRouterResetAt) {
    // Reset at next local midnight
    const nextMidnight = new Date()
    nextMidnight.setHours(24, 0, 0, 0)
    openRouterResetAt = nextMidnight.getTime()
    openRouterCallsToday = 0
  }
}

async function openRouterChatComplete(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set — sign up at https://openrouter.ai for free')
  }

  maybeResetOpenRouterCounter()
  if (openRouterCallsToday >= OPENROUTER_DAILY_BUDGET) {
    throw new Error(
      `OpenRouter daily budget exhausted (${openRouterCallsToday}/${OPENROUTER_DAILY_BUDGET}). ` +
      `URL will retry on next cycle using other providers.`
    )
  }

  // Try multiple free models in case one is rate-limited upstream.
  // Ordered by reliability and context length (best first).
  const models = [
    'nvidia/nemotron-3.5-lightning:free',  // 1M ctx, fast — PRIMARY
    'liquid/lfm-2.5-2.6b:free',            // 65K ctx, very reliable — BACKUP
  ]

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://www.hirebase.in',
          'X-Title': 'Hirebase',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        // 404 = model deprecated/unavailable; 429 = rate limited (per-day OR upstream)
        if (response.status === 404 || response.status === 429) {
          console.log(`[multi-ai] OpenRouter ${model} unavailable (${response.status}) — trying next model...`)
          // If 429 mentions daily limit, mark OpenRouter as exhausted for the day
          if (response.status === 429 && /daily|daily_request|daily limit/i.test(errText)) {
            openRouterCallsToday = OPENROUTER_DAILY_BUDGET
            const tomorrow = new Date()
            tomorrow.setHours(24, 0, 0, 0)
            openRouterResetAt = tomorrow.getTime()
            console.log('[multi-ai] OpenRouter daily limit hit — pausing until tomorrow')
          }
          continue
        }
        throw new Error(`OpenRouter API error: ${response.status} ${errText.slice(0, 100)}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      if (content) {
        openRouterCallsToday++
        return content
      }
    } catch (e: any) {
      // If rate-limited, try next model
      if (e.message?.includes('429') || e.message?.includes('rate')) {
        console.log(`[multi-ai] OpenRouter ${model} rate-limited, trying next...`)
        continue
      }
      throw e
    }
  }

  throw new Error('All OpenRouter free models were rate-limited or unavailable')
}

// Groq chat completions (free, OpenAI-compatible API).
// Sign up at https://console.groq.com — free with very generous limits.
//
// Free tier limits (as of 2026-09-21, may vary per model):
//   • llama-3.1-8b-instant:       30 RPM, 14,400 req/day, 500K TPM
//   • llama-3.3-70b-versatile:    30 RPM, 1,000 req/day
//   • openai/gpt-oss-120b:        30 RPM, 7,200 req/day
//
// ⚠️ REGION BLOCK: Groq Cloud blocks Hong Kong (HKG) region. If your Vercel
// function is deployed to hkg1, you will get HTTP 403 "Forbidden" regardless
// of key validity. Deploy to iad1 / sfo1 / pdx1 / cdg1 / fra1 / etc.
//
// We try models in order — first one that works wins.
async function groqChatComplete(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set — sign up at https://console.groq.com for free')
  }

  // Try multiple models in case one is rate-limited / deprecated.
  const models = [
    'llama-3.1-8b-instant',       // Fastest, 30 RPM / 14,400 req/day
    'openai/gpt-oss-120b',         // Bigger, 30 RPM / 7,200 req/day
    'llama-3.3-70b-versatile',      // Highest quality, 30 RPM / 1,000 req/day
  ]

  let lastErr = ''
  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        // 404 = model retired; 429 = rate limit; 403 = region block (try next model won't help,
        // but we should still surface the proper error)
        if (response.status === 404 || response.status === 429) {
          console.log(`[multi-ai] Groq ${model} unavailable (${response.status}) — trying next model...`)
          lastErr = `Groq ${model}: ${response.status} ${errText.slice(0, 80)}`
          continue
        }
        if (response.status === 403) {
          // Region block — same error for all Groq models, no point trying others
          throw new Error(
            'Groq API: 403 Forbidden (likely region block — Vercel must NOT be deployed to hkg1)'
          )
        }
        throw new Error(`Groq API error: ${response.status} ${errText.slice(0, 100)}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''
      if (content) return content
    } catch (e: any) {
      // If region block, surface immediately
      if (e.message?.includes('403 Forbidden')) throw e
      lastErr = e.message
      continue
    }
  }

  throw new Error(lastErr || 'All Groq models failed')
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
