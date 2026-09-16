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
 * This module detects LinkedIn URLs and uses the guest API instead of the
 * normal page reader. For all other URLs, falls back to the normal chain.
 */

import { pageRead } from '@/lib/multi-ai'

export interface PageContent {
  title: string
  html: string
  text: string
  publishedTime?: string
}

/**
 * Fetch a job page, with special handling for LinkedIn URLs.
 *
 * For LinkedIn URLs (linkedin.com/jobs/view/<id>):
 *   1. Extract the job ID
 *   2. Try the LinkedIn guest API first (returns clean HTML, no Cloudflare)
 *   3. Fall back to the normal page reader if guest API fails
 *
 * For all other URLs: just use the normal page reader (z-ai → Jina).
 */
export async function fetchJobPage(url: string): Promise<PageContent> {
  // Detect LinkedIn URLs and route to the guest API
  if (/linkedin\.com\/jobs\/view\/(\d+)/i.test(url)) {
    const match = url.match(/linkedin\.com\/jobs\/view\/(\d+)/i)
    if (match && match[1]) {
      const jobId = match[1]
      try {
        const guestContent = await fetchLinkedInGuestApi(jobId)
        if (guestContent) return guestContent
      } catch (e: any) {
        console.log(`[fetchJobPage] LinkedIn guest API failed for ${jobId}: ${e.message?.slice(0, 80)}`)
        // Fall through to the normal page reader as a fallback
      }
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
async function fetchLinkedInGuestApi(jobId: string): Promise<PageContent | null> {
  const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`

  const response = await fetch(guestUrl, {
    headers: {
      // LinkedIn's guest API works without auth but expects a browser-like UA
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
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
