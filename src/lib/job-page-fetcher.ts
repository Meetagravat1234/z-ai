/**
 * Job page fetcher — wraps the multi-AI pageRead() with platform-specific
 * fallbacks for sites that block scrapers (LinkedIn, etc.).
 *
 * Why this exists:
 * - LinkedIn serves a Cloudflare "Just a moment..." challenge page to scrapers
 * - Both z-ai's page_reader and Jina AI fail to bypass it
 * - BUT LinkedIn has a public "guest" API endpoint that returns the actual
 *   job HTML without the Cloudflare challenge:
 *   https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/<jobId>
 *
 * Fallback chain for LinkedIn URLs:
 *   1. Try LinkedIn guest API (cleanest, fastest — no Cloudflare)
 *   2. Try guest API with different User-Agent (in case LinkedIn blocks one)
 *   3. Try z-ai page_reader (runs on Alibaba's network — different IP range)
 *   4. Try Jina AI reader (different IP range, free, no key)
 *
 * For all other URLs: just use the normal page reader (z-ai → Jina).
 */

import { pageRead } from '@/lib/multi-ai'

export interface PageContent {
  title: string
  html: string
  text: string
  publishedTime?: string
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
]

/**
 * Fetch a job page, with special handling for LinkedIn URLs.
 *
 * For LinkedIn URLs (linkedin.com/jobs/view/<id>):
 *   1. Extract the job ID
 *   2. Try the LinkedIn guest API with multiple User-Agents
 *   3. Fall back to z-ai page_reader (Alibaba's network — different IP)
 *   4. Fall back to Jina AI (different IP range)
 *
 * For all other URLs: just use the normal page reader (z-ai → Jina).
 */
export async function fetchJobPage(url: string): Promise<PageContent> {
  // Detect LinkedIn URLs and route to the guest API
  if (/linkedin\.com\/jobs\/view\/(\d+)/i.test(url)) {
    const match = url.match(/linkedin\.com\/jobs\/view\/(\d+)/i)
    if (match && match[1]) {
      const jobId = match[1]

      // Try guest API with each User-Agent in turn
      for (let i = 0; i < USER_AGENTS.length; i++) {
        try {
          const guestContent = await fetchLinkedInGuestApi(jobId, USER_AGENTS[i])
          if (guestContent) {
            console.log(`[fetchJobPage] LinkedIn guest API succeeded for ${jobId} (UA #${i + 1})`)
            return guestContent
          }
        } catch (e: any) {
          console.log(`[fetchJobPage] LinkedIn guest API failed for ${jobId} (UA #${i + 1}): ${e.message?.slice(0, 80)}`)
          // Try next User-Agent
        }
      }
      // Fall through to the normal page reader as a final fallback
      console.log(`[fetchJobPage] All guest API attempts failed for ${jobId}, falling back to page reader`)
    }
  }

  // Default: use the multi-provider page reader (z-ai → Jina)
  return await pageRead(url)
}

/**
 * Fetch a LinkedIn job posting via the public guest API.
 *
 * LinkedIn's main jobs page (linkedin.com/jobs/view/<id>) is protected by
 * Cloudflare's bot challenge — scrapers get a "Just a moment..." interstitial
 * instead of the actual content.
 *
 * BUT LinkedIn also exposes a guest API at:
 *   https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/<id>
 *
 * This endpoint:
 * - Returns clean HTML without the Cloudflare challenge
 * - Includes the job title, company, location, description
 * - Doesn't require authentication
 * - Is the same endpoint LinkedIn uses for its "public" embeds
 *
 * Returns null if the fetch fails or returns an empty/invalid response.
 */
export async function fetchLinkedInGuestApi(jobId: string, userAgent?: string): Promise<PageContent | null> {
  const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`
  const ua = userAgent || USER_AGENTS[0]

  const response = await fetch(guestUrl, {
    headers: {
      // LinkedIn's guest API works without auth but expects a browser-like UA
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`LinkedIn guest API returned HTTP ${response.status}`)
  }

  const html = await response.text()
  if (!html || html.length < 500) {
    throw new Error('LinkedIn guest API returned empty or too-short response')
  }

  // Check for Cloudflare challenge (in case LinkedIn changes their API)
  if (html.includes('Just a moment') || html.includes('cf_chl_opt')) {
    throw new Error('LinkedIn guest API returned Cloudflare challenge')
  }

  // Extract the title from the HTML — LinkedIn wraps it in <h2 class="topcard__title">
  let title = ''
  const titleMatch = html.match(/<h2[^>]*class="[^"]*topcard__title[^"]*"[^>]*>([^<]+)<\/h2>/i)
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim()
  }

  // Extract published time if available
  let publishedTime: string | undefined
  const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/i)
  if (timeMatch && timeMatch[1]) {
    publishedTime = timeMatch[1]
  }

  // Strip HTML to plain text for the AI extractor
  const text = stripHtml(html)

  return {
    title,
    html,
    text,
    publishedTime,
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

