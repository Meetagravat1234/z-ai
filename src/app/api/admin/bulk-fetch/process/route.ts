import { classifyJobDomain } from '@/lib/job-domains'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'
import { chatComplete } from '@/lib/multi-ai'
import { cleanJobTitle } from '@/lib/seo-routes'
import { fetchJobPage } from '@/lib/job-page-fetcher'
import crypto from 'crypto'

/**
 * POST /api/admin/bulk-fetch/process
 * Body: { jobId?: string, batchSize?: number }
 *
 * Picks the next N pending URLs from the specified job (or the oldest active
 * job if no jobId given) and processes them sequentially. Each URL goes
 * through the same AI extraction + save logic as /api/admin/fetch-job.
 *
 * Auth: admin OR x-cron-secret header (so cron-job.org can trigger it).
 *
 * Vercel Hobby function timeout is 60s. Each URL takes ~15-20s, so we cap
 * at 2 URLs per call by default. Setting batchSize higher risks timeout.
 *
 * Returns: { processed: N, saved: X, duplicates: Y, errors: Z, jobId, isComplete }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: admin OR cron-secret
    const admin = await getAdminUser()
    const cronSecret = req.headers.get('x-cron-secret')
    const validCronSecret = process.env.CRON_SECRET

    if (!admin && !(cronSecret && validCronSecret && cronSecret === validCronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const batchSize = Math.min(body.batchSize || 2, 3) // hard cap at 3 (60s timeout)
    const jobId = body.jobId

    // Find the job to process
    let where: any = { status: { in: ['pending', 'processing'] } }
    if (jobId) where = { id: jobId, ...where }
    const job = await db.bulkFetchJob.findFirst({
      where,
      orderBy: { createdAt: 'asc' },
    })

    if (!job) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        isComplete: true,
        message: 'No pending jobs to process',
      })
    }

    // Mark job as 'processing' if it was 'pending'
    if (job.status === 'pending') {
      await db.bulkFetchJob.update({
        where: { id: job.id },
        data: { status: 'processing', startedAt: new Date() },
      })
    }

    // Pick the next N pending URLs — atomically mark them as 'processing' so
    // concurrent /process calls don't double-process them
    const pendingUrls = await db.bulkFetchJobUrl.findMany({
      where: { jobId: job.id, status: 'pending' },
      orderBy: { id: 'asc' },
      take: batchSize,
    })

    if (pendingUrls.length === 0) {
      // No pending URLs left — check if job is complete
      await updateJobCompletion(job.id)
      const updated = await db.bulkFetchJob.findUnique({ where: { id: job.id } })
      return NextResponse.json({
        ok: true,
        processed: 0,
        isComplete: true,
        jobId: job.id,
        saved: updated?.savedCount || 0,
        duplicates: updated?.duplicateCount || 0,
        errors: updated?.failedCount || 0,
      })
    }

    // Mark these URLs as 'processing' (claim them)
    await db.bulkFetchJobUrl.updateMany({
      where: { id: { in: pendingUrls.map((u) => u.id) } },
      data: { status: 'processing' },
    })

    let savedCount = 0
    let dupCount = 0
    let errCount = 0
    let consecutiveRateLimits = 0  // Circuit breaker — stop after 3 consecutive rate-limit failures

    // Process each URL sequentially (parallel would blow AI rate limits)
    for (const urlRow of pendingUrls) {
      try {
        const result = await processSingleUrl(urlRow.url)

        // If the error is "rate limited", put the URL BACK to pending instead
        // of permanently marking it as error. It will be retried on the next
        // /process call (after the cooldown period).
        if (result.status === 'error' && result.error && result.error.includes('rate limited')) {
          // Put it back to pending — will be retried on next /process call
          await db.bulkFetchJobUrl.update({
            where: { id: urlRow.id },
            data: {
              status: 'pending', // BACK TO PENDING — will retry
              error: null,
              processedAt: new Date(),
            },
          })
          // Don't count as error or processed — it will be retried
          consecutiveRateLimits++
          // Circuit breaker: if 3 consecutive URLs fail with rate-limit,
          // stop processing for this cycle. z-ai is clearly down/rate-limited.
          // The next poll (25s later) will retry — by then z-ai may have recovered.
          if (consecutiveRateLimits >= 3) {
            console.log('[bulk-fetch] 3 consecutive rate-limit failures — pausing for this cycle')
            break
          }
          continue
        }

        // Reset counter on success or non-rate-limit error
        consecutiveRateLimits = 0

        await db.bulkFetchJobUrl.update({
          where: { id: urlRow.id },
          data: {
            status: result.status,
            title: result.title,
            company: result.company,
            error: result.error,
            processedAt: new Date(),
          },
        })

        if (result.status === 'saved') savedCount++
        else if (result.status === 'duplicate') dupCount++
        else errCount++
      } catch (e: any) {
        // Same logic: if rate limited, put back to pending
        if (e.message && e.message.includes('rate limited')) {
          await db.bulkFetchJobUrl.update({
            where: { id: urlRow.id },
            data: {
              status: 'pending',
              error: null,
              processedAt: new Date(),
            },
          })
          continue
        }

        await db.bulkFetchJobUrl.update({
          where: { id: urlRow.id },
          data: {
            status: 'error',
            error: e.message?.slice(0, 200) || 'Unknown error',
            processedAt: new Date(),
          },
        })
        errCount++
      }
    }

    // Update aggregate counts on the job
    await db.bulkFetchJob.update({
      where: { id: job.id },
      data: {
        processedCount: { increment: pendingUrls.length },
        savedCount: { increment: savedCount },
        duplicateCount: { increment: dupCount },
        failedCount: { increment: errCount },
      },
    })

    // Check if job is complete
    await updateJobCompletion(job.id)

    const updated = await db.bulkFetchJob.findUnique({ where: { id: job.id } })

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      processed: pendingUrls.length,
      saved: savedCount,
      duplicates: dupCount,
      errors: errCount,
      isComplete: updated?.status === 'completed',
      totals: {
        saved: updated?.savedCount || 0,
        duplicates: updated?.duplicateCount || 0,
        errors: updated?.failedCount || 0,
        processed: updated?.processedCount || 0,
        total: updated?.totalUrls || 0,
      },
    })
  } catch (e: any) {
    console.error('[bulk-fetch/process] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * Process a single URL — same logic as /api/admin/fetch-job, but inlined here
 * to avoid the extra HTTP call. Returns the final status + extracted metadata.
 */
async function processSingleUrl(url: string): Promise<{
  status: 'saved' | 'duplicate' | 'error'
  title?: string
  company?: string
  error?: string
}> {
  // Step 0: Validate that this looks like a single job posting URL, not a
  // homepage or search results page. Bulk fetch is designed for individual
  // job pages — feeding it homepages like "naukri.com" or search pages like
  // "naukri.com/software-fresher-jobs" causes the AI to fail because those
  // pages contain 20+ jobs mixed together.
  const validationError = validateJobUrl(url)
  if (validationError) {
    return { status: 'error', error: validationError }
  }

  // Step 1: Fetch the page content (with LinkedIn guest API fallback)
  let pageTitle = ''
  let html = ''
  let publishedTime: string | undefined
  try {
    const pageData = await fetchJobPage(url)
    pageTitle = pageData.title
    html = pageData.html
    publishedTime = pageData.publishedTime
  } catch (e: any) {
    const errMsg = e.message?.slice(0, 100) || 'unknown'
    // If the page fetch failed because ALL providers failed (z-ai rate-limited
    // + Jina couldn't bypass), put the URL back to 'pending' instead of 'error'.
    // This way, it retries on the next poll cycle (after z-ai recovers).
    // The bulk-fetch handler checks for 'rate limited' in the error message.
    if (errMsg.includes('All page reader providers failed') || errMsg.includes('rate limited')) {
      return {
        status: 'error' as const,
        error: 'rate limited — all page readers failed, will retry next cycle',
      }
    }
    return { status: 'error' as const, error: 'Failed to fetch page: ' + errMsg }
  }

  // Strip HTML to plain text
  const text = html
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
    .slice(0, 12000)

  if (text.length < 100) {
    return { status: 'error', error: 'Page content too short to be a real job posting' }
  }

  // Step 2: AI extraction
  const raw = await chatComplete([
    {
      role: 'system',
      content: `You are an expert job post parser. Given the raw text of a job page (scraped from any URL), extract structured fields.

Output STRICT JSON (no markdown fences) with this shape:
{
  "title": "<the job title>",
  "company": "<the hiring company name>",
  "location": "<city, country — extract from text; if remote, say 'Remote'>",
  "description": "<a clean, well-formatted version of the job description, 3-6 paragraphs in Markdown with ## headings for sections like 'About the role', 'What you'll do', 'Required qualifications', 'Benefits'>",
  "skills": ["<skill1>", "<skill2>", ...up to 8],
  "experience": "<one of: '0 Years' | '0-2 Years' | '1-3 Years' | '3-5 Years' | '5-8 Years' | '8+ Years' | 'Not specified'>",
  "category": "<one of: 'fresher' | 'internship' | 'experienced' | 'remote' | 'walk-in'>",
  "employmentType": "<'Full-time' | 'Part-time' | 'Contract' | 'Internship'>",
  "workMode": "<'Onsite' | 'Remote' | 'Hybrid'>",
  "salaryMin": <number or null, in LPA × 10 (e.g. 8 LPA = 80)>,
  "salaryMax": <number or null, in LPA × 10>
}

CRITICAL RULES for experience field:
- If the description explicitly mentions years of experience (e.g. "3+ years", "5-7 years"), use that.
- If the title contains "Senior", "Sr.", "Lead", "Staff", "Principal" → use '5-8 Years'
- If the title contains "Manager", "Director", "VP", "Head of", "Chief" → use '8+ Years'
- If the title contains "Junior", "Entry Level", "New Grad", "Associate", "Fresher", "Intern" → use '0 Years' or '0-2 Years'
- If you genuinely can't determine experience from the title or description → return 'Not specified'
- DO NOT default to '0-2 Years' when you're unsure — that breaks the fresher filter.

Rules:
- If the job title contains 'intern' or 'internship', set category='internship' and employmentType='Internship'
- If 'fresher', 'entry level', 'new grad', '0 years', or 'associate' appears, set category='fresher'
- If location mentions 'remote' or 'work from anywhere', set workMode='Remote'
- Convert any USD salary to INR LPA equivalent (1 USD ≈ ₹83, so $100k ≈ ₹83 LPA → 830)
- If salary isn't mentioned, return null for both
- Be conservative on skills — only include ones actually mentioned`,
    },
    {
      role: 'user',
      content: `PAGE TITLE: ${pageTitle}
PAGE URL: ${url}
PUBLISHED AT: ${publishedTime || 'unknown'}

RAW PAGE TEXT:
${text}

Extract the structured job fields.`,
    },
  ])

  let parsed: any
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return { status: 'error', error: 'AI returned unparseable JSON' }
  }

  // Step 3: Find or create the company
  const companyName = parsed.company || 'Unknown'
  const rawTitle = (parsed.title || '').trim()
  // Reject jobs with empty titles — these produce broken pages with empty <h1>
  // and misleading metadata. Better to fail here than publish a broken page.
  if (!rawTitle || rawTitle === 'Untitled' || rawTitle.length < 2) {
    return { status: 'error', error: 'Job has no valid title — skipping to avoid broken page' }
  }
  // Blocklist — same as ingest.ts: skip job aggregator sources to maintain
  // Ground Truth integrity ("we do not repost from other job boards").
  const companyNameLower = companyName.toLowerCase()
  const BLOCKED_COMPANIES = [
    'jobright', 'jobright.ai', 'simplyhired', 'glassdoor', 'linkedin jobs',
  ]
  if (BLOCKED_COMPANIES.some(b => companyNameLower.includes(b))) {
    return { status: 'error', error: `Blocked aggregator source: ${companyName}` }
  }
  const slug = companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  let company = await db.company.findUnique({ where: { slug } })
  if (!company) {
    company = await db.company.create({
      data: {
        name: companyName,
        slug,
        hiringActivity: 'Medium',
        sevenDayTrend: 0,
        verified: true,
      },
    })
  }

  // Step 4: Dedup check by hash
  const cleanTitle = cleanJobTitle(parsed.title, companyName)
  const hash = crypto
    .createHash('sha1')
    .update(`${cleanTitle}|${company.id}|${(parsed.location || '').split(',')[0].trim()}`)
    .digest('hex')

  const existing = await db.job.findFirst({ where: { hash } })
  if (existing) {
    return { status: 'duplicate', title: cleanTitle, company: companyName }
  }

  // Step 5: Save the job
  await db.job.create({
    data: {
      title: cleanTitle,
      companyId: company.id,
      category: parsed.category || 'experienced',
      domain: classifyJobDomain(parsed.title || '', Array.isArray(parsed.skills) ? parsed.skills.join(', ') : (parsed.skills || '')),
      employmentType: parsed.employmentType || 'Full-time',
      workMode: parsed.workMode || 'Onsite',
      experience: parsed.experience || inferExperienceFromTitle(parsed.title || ''),
      salaryMin: parsed.salaryMin ?? null,
      salaryMax: parsed.salaryMax ?? null,
      salaryCurrency: 'INR',
      location: parsed.location || 'Not specified',
      skills: Array.isArray(parsed.skills) ? parsed.skills.join(', ') : '',
      description: parsed.description || text.slice(0, 4000),
      applyUrl: url,
      source: 'admin-url',
      sourceRef: url,
      hash,
      verified: true,
      sourcePostedAt: publishedTime ? new Date(publishedTime) : null,
    },
  })

  return { status: 'saved', title: cleanTitle, company: companyName }
}

/**
 * Validate that a URL looks like a single job posting, not a homepage or
 * search results page. Returns an error message string if invalid, or
 * null if the URL looks like a real job posting.
 *
 * Why this exists:
 * - Users sometimes paste 75 URLs like "naukri.com", "indeed.com", "glassdoor.co.in"
 *   expecting the bulk fetch to extract jobs from those homepages.
 * - But the AI extraction expects a SINGLE job posting page. When fed a
 *   homepage with 20+ jobs mixed together, it fails with "All AI providers
 *   are rate limited" (because the page content is too long/complex and the
 *   AI burns through tokens trying to parse it).
 * - This validation catches the problem BEFORE making any AI calls, giving
 *   the user a clear actionable error.
 */
function validateJobUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    const host = parsed.hostname.toLowerCase()

    // Known patterns for individual job postings — these PASS validation:
    const isLinkedInJob = host.includes('linkedin.com') && path.includes('/jobs/view/')
    const isNaukriJob = host.includes('naukri.com') && path.includes('/job-listings/')
    const isIndeedJob = host.includes('indeed.com') && (path.includes('/viewjob') || path.includes('/rc/clk'))
    const isGlassdoorJob = host.includes('glassdoor.') && path.includes('/job-listing')
    const isInternshalaJob = host.includes('internshala.com') && (path.includes('/job/') || path.includes('/internship/'))
    const isGreenhouseJob = host.includes('greenhouse.io') && path.includes('/jobs/')
    const isLeverJob = host.includes('lever.co') && path.includes('/')
    const isAshbyJob = host.includes('ashbyhq.com') && path.includes('/')
    const isGoogleJob = host.includes('jobs.google.com') && path.length > 10
    // Generic: URL path has a long slug (likely a specific job posting)
    const hasLongSlug = path.length > 30 && /\d{5,}/.test(path) // contains 5+ digit ID

    const isValidJobUrl =
      isLinkedInJob ||
      isNaukriJob ||
      isIndeedJob ||
      isGlassdoorJob ||
      isInternshalaJob ||
      isGreenhouseJob ||
      isLeverJob ||
      isAshbyJob ||
      isGoogleJob ||
      hasLongSlug

    if (isValidJobUrl) {
      return null // looks like a real job posting
    }

    // If we get here, this looks like a homepage or search page. Build a
    // helpful error message explaining what went wrong.
    const isHomepage = path === '/' || path === ''
    const isSearchPage = /jobs|search|results|listings/.test(path)

    if (isHomepage) {
      return `This is a homepage, not a job posting. Paste the URL of a specific job — e.g. ${getExampleUrl(host)}`
    }
    if (isSearchPage) {
      return `This is a search results page, not a single job. Click into a job and paste that URL instead.`
    }
    return `This URL doesn't look like a single job posting. Make sure you're pasting the URL of a specific job listing, not a homepage or search page.`
  } catch {
    return 'Invalid URL'
  }
}

/** Generate an example job URL for the error message based on the domain. */
function getExampleUrl(host: string): string {
  if (host.includes('linkedin.com')) return 'https://linkedin.com/jobs/view/1234567890'
  if (host.includes('naukri.com')) return 'https://naukri.com/job-listings-12345'
  if (host.includes('indeed.com')) return 'https://indeed.com/viewjob?jk=abcdef'
  if (host.includes('glassdoor')) return 'https://glassdoor.com/job-listing/...-12345'
  if (host.includes('internshala.com')) return 'https://internshala.com/job/software-engineer-...'
  return `https://${host}/jobs/view/12345`
}

/**
 * Mark a job as completed if all its URLs have a non-pending status.
 */
async function updateJobCompletion(jobId: string) {
  const pending = await db.bulkFetchJobUrl.count({
    where: { jobId, status: 'pending' },
  })
  const processing = await db.bulkFetchJobUrl.count({
    where: { jobId, status: 'processing' },
  })

  if (pending === 0 && processing === 0) {
    await db.bulkFetchJob.update({
      where: { id: jobId },
      data: { status: 'completed', completedAt: new Date() },
    })
  }
}

/**
 * Infer experience level from job title when the AI didn't extract it.
 *
 * Pattern-based fallback — catches the common cases where the title itself
 * signals the seniority (Senior, Manager, Director, Intern, etc.).
 *
 * Returns "Not specified" when no signal is found — never returns "0-2 Years"
 * as a default, because that was breaking the fresher filter.
 */
function inferExperienceFromTitle(title: string): string {
  if (!title) return 'Not specified'
  const lower = title.toLowerCase()

  // Executive/leadership — most senior
  if (/\b(vp|vice president|chief|cto|ceo|cio|coo|cfo|director|head of)\b/i.test(lower)) {
    return '8+ Years'
  }
  // Senior/lead/principal roles
  if (/\b(senior|sr\.?|lead|staff|principal)\b/i.test(lower)) {
    return '5-8 Years'
  }
  // Manager roles (not "Engineering Manager" which is leadership, but "Product Manager" etc.)
  if (/\bmanager\b/i.test(lower) && !/engineering manager|tech manager/i.test(lower)) {
    return '5-8 Years'
  }
  // Entry-level / junior roles
  if (/\b(junior|jr\.?|entry level|entry-level|new grad|graduate|fresher|associate|intern)\b/i.test(lower)) {
    return '0 Years'
  }

  // No signal — don't default to "0-2 Years" (that's the bug we're fixing)
  return 'Not specified'
}
