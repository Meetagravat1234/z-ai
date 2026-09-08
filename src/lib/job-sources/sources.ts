// Job source adapters — fetch raw job listings from public APIs.
// Each adapter returns an array of RawJob objects.
// All adapters are read-only and use only public endpoints.

export interface RawJob {
  title: string
  company: string
  companyWebsite?: string
  companyLogo?: string
  industry?: string
  location?: string
  description: string
  applyUrl?: string
  sourceRef?: string
  sourcePostedAt?: string
  skills?: string
  employmentType?: string
  workMode?: string
  experience?: string
  category?: string
  salaryMin?: number
  salaryMax?: number
}

export interface FetchResult {
  source: string
  sourceParam?: string
  jobs: RawJob[]
  error?: string
}

// ============================================================================
// GREENHOUSE — public boards API
// https://boards-api.greenhouse.io/v1/boards/{company}/jobs
// ============================================================================
const GREENHOUSE_COMPANIES = [
  'airbnb', 'stripe', 'pinterest', 'figma', 'datadog',
  'cloudflare', 'hubspot', 'block', 'robinhood', 'grammarly',
]

export async function fetchGreenhouse(company: string): Promise<FetchResult> {
  try {
    const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.jobs || [])
      .filter((j: any) => j.title && j.absolute_url)
      .slice(0, 5) // limit per source
      .map((j: any) => {
        const loc = j.location?.name || j.departments?.[0]?.location?.name || 'Not specified'
        return {
          title: j.title,
          company: prettyName(company),
          companyWebsite: `https://${company}.com`,
          location: loc.includes(',') ? loc : `${loc}, India`,
          description: j.content || j.metadata?.find((m: any) => m.name === 'Job Description')?.value || j.title,
          applyUrl: j.absolute_url,
          sourceRef: `greenhouse-${j.id}`,
          sourcePostedAt: j.updated_at || undefined,
          employmentType: 'Full-time',
          workMode: /remote/i.test(loc) ? 'Remote' : 'Onsite',
        }
      })
    return { source: 'greenhouse', sourceParam: company, jobs }
  } catch (e: any) {
    return { source: 'greenhouse', sourceParam: company, jobs: [], error: e.message }
  }
}

// ============================================================================
// LEVER — public postings API (disabled: most companies have moved off Lever)
// https://api.lever.co/v0/postings/{company}?mode=json
// ============================================================================
const LEVER_COMPANIES: string[] = []

export async function fetchLever(company: string): Promise<FetchResult> {
  return { source: 'lever', sourceParam: company, jobs: [], error: 'Lever adapter disabled (most boards moved to Ashby/Greenhouse)' }
}

// ============================================================================
// ASHBY — public job board API
// https://api.ashbyhq.com/posting-api/job-board/{company}
// ============================================================================
const ASHBY_COMPANIES = [
  'vercel', 'replit', 'deepgram', 'mercury', 'ramp',
]

export async function fetchAshby(company: string): Promise<FetchResult> {
  try {
    const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}?includeCompensation=true`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.jobs || [])
      .slice(0, 5)
      .map((j: any) => ({
        title: j.title,
        company: prettyName(company),
        companyWebsite: `https://${company}.com`,
        location: j.locationName || 'Not specified',
        description: j.descriptionHtml?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || j.title,
        applyUrl: j.externalLink || j.ashbyPostingUrl,
        sourceRef: `ashby-${j.id}`,
        sourcePostedAt: j.publishedDate || undefined,
        employmentType: 'Full-time',
        workMode: j.isRemote ? 'Remote' : 'Onsite',
        salaryMin: j.compensation?.lowEndAmount ? Math.round(j.compensation.lowEndAmount / 100000) : null,
        salaryMax: j.compensation?.highEndAmount ? Math.round(j.compensation.highEndAmount / 100000) : null,
      }))
    return { source: 'ashby', sourceParam: company, jobs }
  } catch (e: any) {
    return { source: 'ashby', sourceParam: company, jobs: [], error: e.message }
  }
}

// ============================================================================
// REMOTIVE — free remote jobs API
// https://remotive.com/api/remote-jobs
// ============================================================================
export async function fetchRemotive(): Promise<FetchResult> {
  try {
    const r = await fetch('https://remotive.com/api/remote-jobs?limit=8')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.jobs || [])
      .slice(0, 8)
      .map((j: any) => ({
        title: j.title,
        company: j.company_name || 'Unknown',
        companyLogo: j.company_logo ? undefined : undefined, // skip URL since we use emoji
        location: j.candidate_required_location || 'Remote',
        description: j.description || j.title,
        applyUrl: j.url,
        sourceRef: `remotive-${j.id}`,
        sourcePostedAt: j.publication_date || undefined,
        category: 'remote',
        workMode: 'Remote',
        employmentType: j.job_type || 'Full-time',
        salaryMin: j.salary_currency === 'USD' && j.salary ? Math.round(parseFloat(j.salary) * 83 / 100000) : null,
        salaryMax: null,
      }))
    return { source: 'remotive', jobs }
  } catch (e: any) {
    return { source: 'remotive', jobs: [], error: e.message }
  }
}

// ============================================================================
// ARBEITNOW — free job board API
// https://www.arbeitnow.com/api/job-board-api
// ============================================================================
export async function fetchArbeitnow(): Promise<FetchResult> {
  try {
    const r = await fetch('https://www.arbeitnow.com/api/job-board-api')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.data || [])
      .filter((j: any) => j.title && j.description && j.url)
      .slice(0, 8)
      .map((j: any) => ({
        title: j.title,
        company: j.company_name || 'Unknown',
        location: j.location || 'Remote',
        description: j.description,
        applyUrl: j.url,
        sourceRef: `arbeitnow-${j.slug}`,
        sourcePostedAt: j.created_at || undefined,
        category: j.remote ? 'remote' : 'experienced',
        workMode: j.remote ? 'Remote' : 'Onsite',
        employmentType: (j.job_types && j.job_types[0]) || 'Full-time',
        skills: (j.tags || []).slice(0, 6).join(','),
      }))
    return { source: 'arbeitnow', jobs }
  } catch (e: any) {
    return { source: 'arbeitnow', jobs: [], error: e.message }
  }
}

// Round-robin queue — returns the next source to sync
export function getNextSource(lastIdx: number): { adapter: () => Promise<FetchResult>, idx: number } {
  // Build a flat list of source calls
  const queue: Array<() => Promise<FetchResult>> = [
    fetchRemotive,
    fetchArbeitnow,
    ...GREENHOUSE_COMPANIES.map((c) => () => fetchGreenhouse(c)),
    ...LEVER_COMPANIES.map((c) => () => fetchLever(c)),
    ...ASHBY_COMPANIES.map((c) => () => fetchAshby(c)),
  ]
  const idx = (lastIdx + 1) % queue.length
  return { adapter: queue[idx], idx }
}

export const SOURCE_QUEUE_LENGTH =
  2 + GREENHOUSE_COMPANIES.length + LEVER_COMPANIES.length + ASHBY_COMPANIES.length

function prettyName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
