import { NextResponse } from 'next/server'
import { fetchJobPage, fetchLinkedInGuestApi } from '@/lib/job-page-fetcher'
import { pageRead } from '@/lib/multi-ai'

/**
 * GET /api/debug/linkedin-test?url=<linkedin-url>
 *
 * Tests the LinkedIn URL fetching chain step by step to diagnose where
 * the failure is happening. No auth required (only does a fetch + logs).
 *
 * Usage:
 *   /api/debug/linkedin-test?url=https://www.linkedin.com/jobs/view/4463471455
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url') || 'https://www.linkedin.com/jobs/view/4463471455'

  const results: any = {
    timestamp: new Date().toISOString(),
    testUrl: url,
    isLinkedInUrl: /linkedin\.com\/jobs\/view\/(\d+)/i.test(url),
    extractedJobId: url.match(/linkedin\.com\/jobs\/view\/(\d+)/i)?.[1] || null,
  }

  // Extract job ID for direct guest API test
  const jobId = results.extractedJobId
  if (jobId) {
    results.guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`

    // Test 1: Direct fetch of guest API from this Vercel function
    console.log(`[linkedin-test] Testing guest API for job ${jobId}`)
    try {
      const guestContent = await fetchLinkedInGuestApi(jobId)
      if (guestContent) {
        results.guestApiTest = {
          status: 'success',
          titleExtracted: guestContent.title,
          htmlLength: guestContent.html.length,
          textLength: guestContent.text.length,
          publishedTime: guestContent.publishedTime,
        }
      } else {
        results.guestApiTest = { status: 'failed', reason: 'Returned null' }
      }
    } catch (e: any) {
      results.guestApiTest = { status: 'error', error: e.message?.slice(0, 200) }
    }

    // Test 2: Raw fetch (no job-page-fetcher wrapper) to see raw response
    try {
      const rawRes = await fetch(results.guestApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      const rawText = await rawRes.text()
      results.rawFetch = {
        status: rawRes.status,
        ok: rawRes.ok,
        contentLength: rawText.length,
        isCloudflareChallenge: rawText.includes('Just a moment') || rawText.includes('cf_chl_opt'),
        hasTopcardTitle: rawText.includes('topcard__title'),
        firstChars: rawText.slice(0, 200).replace(/\n/g, ' '),
      }
    } catch (e: any) {
      results.rawFetch = { error: e.message?.slice(0, 200) }
    }
  }

  // Test 3: Full fetchJobPage() call
  try {
    const content = await fetchJobPage(url)
    results.fetchJobPage = {
      status: 'success',
      title: content.title,
      htmlLength: content.html.length,
      textLength: content.text.length,
    }
  } catch (e: any) {
    results.fetchJobPage = { status: 'error', error: e.message?.slice(0, 200) }
  }

  // Test 4: Direct pageRead() (z-ai + Jina) for comparison
  try {
    const content = await pageRead(url)
    results.pageReadDirect = {
      status: 'success',
      title: content.title,
      htmlLength: content.html.length,
    }
  } catch (e: any) {
    results.pageReadDirect = { status: 'error', error: e.message?.slice(0, 200) }
  }

  return NextResponse.json(results, { status: 200 })
}
