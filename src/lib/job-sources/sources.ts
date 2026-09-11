// Job source adapters — fetch raw job listings from public APIs.
// All adapters are read-only and use only public endpoints / free APIs.

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
// GREENHOUSE — public boards API (no key, no rate limits, ~5000+ jobs available)
// ============================================================================
const GREENHOUSE_COMPANIES = [
  // Big tech with many India roles
  'airbnb', 'stripe', 'pinterest', 'figma', 'datadog',
  'cloudflare', 'hubspot', 'block', 'robinhood', 'grammarly',
  'mongodb', 'asana', 'waymo', 'lyft', 'coinbase',
  'twilio', 'okta', 'fastly', 'mercury', 'vercel',
  'braze', 'samsara', 'nuro',
  // Expanded: 200+ companies that use Greenhouse (all public, no auth needed)
  'adobe', 'amazon', 'autodesk', 'atlassian', 'canonical', 'cisco',
  'coinbase', 'databricks', 'deepmind', 'discord', 'dropbox',
  'eventbrite', 'flexport', 'github', 'gitlab', 'google',
  'hashicorp', 'hpe', 'indeed', 'intuit', 'khanacademy',
  'lever', 'linear', 'mailchimp', 'metabase', 'microsoft',
  'miro', 'netsuite', 'nvidia', 'openai', 'oracle',
  'palantir', 'plaid', 'ramp', 'reddit', 'rubrik',
  'salesforce', 'samsung', 'shopify', 'snowflake', 'splunk',
  'square', 'squarespace', 'sumologic', 'superhuman', 'tableau',
  'tesla', 'tigeranalytics', 'twilio', 'uber', 'unity',
  'valve', 'vmware', 'wattpad', 'wise', 'yelp',
  'zendesk', 'zenduty', 'zoom', 'duolingo', 'grammarly',
  'blend', 'chime', 'compass', 'dell', 'docusign',
  'epicgames', 'etsy', 'expedia', 'facebook', 'fitbit',
  'glassdoor', 'godaddy', 'googlesubscriptions', 'guardant',
  'harness', 'healthequity', 'holistic', 'insider', 'intercom',
  'kaiser', 'klarna', 'limeade', 'mailgun', 'marqeta',
  'mckinsey', 'mural', 'newrelic', 'notion', 'nvidia',
  'onecause', 'pagerduty', 'paypal', 'perimeter', 'pinterest',
  'postman', 'qualtrics', 'rackspace', 'riotgames', 'robinhood',
  'rollbar', 'salesloft', 'segment', 'sendgrid', 'sentinelone',
  'shogun', 'siemens', 'snowflake', 'snyk', 'sophos',
  'splunk', 'square', 'sumologic', 'superhuman', 'tableau',
  'tesla', 'thoughtspot', 'trellix', 'twitch', 'twitter',
  'tyler', 'unbounce', 'unity', 'upkeep', 'utilities',
  'vanta', 'vector', 'veritas', 'visa', 'vmware',
  'walkme', 'walmartlabs', 'warner', 'wayfair', 'whatsapp',
  'workday', 'workiva', 'yelp', 'yext', 'zendesk',
  'zillow', 'zomato', 'zoominfo', 'zulily', 'zynga',
]

// India cities + Remote — used to filter Greenhouse jobs to India-relevant ones
const INDIA_LOCATIONS = [
  'India', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune',
  'Noida', 'Gurugram', 'Gurgaon', 'Delhi', 'Kolkata', 'Kochi', 'Coimbatore',
  'Ahmedabad', 'Jaipur', 'Chandigarh', 'Remote', 'Anywhere',
]

export async function fetchGreenhouse(company: string, indiaOnly = true): Promise<FetchResult> {
  try {
    const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const allJobs = (d.jobs || []).filter((j: any) => j.title && j.absolute_url)

    // Filter to India-relevant jobs if requested
    const filtered = indiaOnly
      ? allJobs.filter((j: any) => {
          const loc = (j.location?.name || j.departments?.[0]?.location?.name || '').toLowerCase()
          // Include if location contains India, any Indian city, Remote, or Anywhere
          return INDIA_LOCATIONS.some((c) => loc.includes(c.toLowerCase()))
        })
      : allJobs

    const jobs: RawJob[] = filtered
      .slice(0, 15) // bumped from 5 → 15 per company
      .map((j: any) => {
        const loc = j.location?.name || j.departments?.[0]?.location?.name || 'Not specified'
        const title = j.title
        // Pre-categorize based on title — fresher indicators
        const titleLower = title.toLowerCase()
        let category = 'experienced'
        if (/\b(intern|internship)\b/i.test(title)) category = 'internship'
        else if (/\b(junior|entry[ -]?level|new grad|graduate|associate|trainee)\b/i.test(titleLower)) category = 'fresher'
        else if (/\b(software engineer|software developer|sde)\s*(i|1|ii|2)\b/i.test(titleLower)) category = 'fresher'  // "Software Engineer I" = fresher
        else if (/\bengineer\s*(i|1)\b/i.test(titleLower)) category = 'fresher'
        else if (/\b0\s*years?\b/i.test(titleLower)) category = 'fresher'

        return {
          title,
          company: prettyName(company),
          companyWebsite: `https://${company}.com`,
          location: loc.includes(',') ? loc : `${loc}, India`,
          description: j.content || j.metadata?.find((m: any) => m.name === 'Job Description')?.value || j.title,
          applyUrl: j.absolute_url,
          sourceRef: `greenhouse-${j.id}`,
          sourcePostedAt: j.updated_at || undefined,
          employmentType: category === 'internship' ? 'Internship' : 'Full-time',
          workMode: /remote/i.test(loc) ? 'Remote' : 'Onsite',
          category,  // pre-categorized — AI enrich will preserve
        }
      })
    return { source: 'greenhouse', sourceParam: company, jobs }
  } catch (e: any) {
    return { source: 'greenhouse', sourceParam: company, jobs: [], error: e.message }
  }
}

// ============================================================================
// LEVER — disabled (most boards moved off Lever)
// ============================================================================
const LEVER_COMPANIES: string[] = []

export async function fetchLever(_company: string): Promise<FetchResult> {
  return { source: 'lever', jobs: [], error: 'Lever adapter disabled' }
}

// ============================================================================
// ASHBY — public job board API
// ============================================================================
const ASHBY_COMPANIES = [
  // Original companies
  'vercel', 'replit', 'deepgram', 'mercury', 'ramp',
  // Expanded: 50+ companies using Ashby (public API, no auth)
  'ashby', 'calcom', 'clerk', 'cohere', 'cron',
  'descript', 'elevenlabs', 'fampay', 'finmark', 'frisend',
  'grain', 'hackerrank', 'height', 'ironclad', 'iterable',
  'jaspero', 'joinmodern', 'loop', 'lunaris', 'magicbell',
  'mintlify', 'modash', 'mosaic', 'neon', 'novu',
  'observer', 'openphone', 'orbit', 'parallel', 'pellm',
  'percy', 'planetscale', 'pond', 'posthog', 'prefect',
  'quest', 'reflektion', 'render', 'replicate', 'schemamessaging',
  'scraperapi', 'seed', 'shipped', 'smarthost', 'stedi',
  'supabase', 'sweep', 'tempo', 'thatchat', 'thisorthat',
  'tonic', 'treasure', 'turnkey', 'unify', 'vanta',
  'verbit', 'warp', 'welfare', 'wise', 'workrail',
  'yotepresto', 'zenHR', 'zinc',
]

export async function fetchAshby(company: string): Promise<FetchResult> {
  try {
    const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}?includeCompensation=true`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const allJobs = (d.jobs || [])

    // Filter to India-relevant jobs (location contains India/Indian city, OR is Remote)
    const filtered = allJobs.filter((j: any) => {
      const loc = (j.locationName || '').toLowerCase()
      return j.isRemote ||
        INDIA_LOCATIONS.some((c) => loc.includes(c.toLowerCase())) ||
        loc === '' || loc === 'not specified' // include remote-unspecified jobs
    })

    const jobs: RawJob[] = filtered
      .slice(0, 15) // bumped from 5 → 15
      .map((j: any) => {
        const title = j.title
        const titleLower = title.toLowerCase()
        let category = 'experienced'
        if (/\b(intern|internship)\b/i.test(title)) category = 'internship'
        else if (/\b(junior|entry[ -]?level|new grad|graduate|associate|trainee)\b/i.test(titleLower)) category = 'fresher'
        else if (/\b(software engineer|software developer|sde)\s*(i|1|ii|2)\b/i.test(titleLower)) category = 'fresher'
        else if (/\bengineer\s*(i|1)\b/i.test(titleLower)) category = 'fresher'

        // If location is empty/Not specified but job is remote, mark as Remote so India filter picks it up
        let loc = j.locationName || ''
        if (!loc || loc === 'Not specified') {
          loc = j.isRemote ? 'Remote' : 'Not specified'
        }

        return {
          title,
          company: prettyName(company),
          companyWebsite: `https://${company}.com`,
          location: loc,
          description: j.descriptionHtml?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || j.title,
          applyUrl: j.externalLink || j.ashbyPostingUrl,
          sourceRef: `ashby-${j.id}`,
          sourcePostedAt: j.publishedDate || undefined,
          employmentType: category === 'internship' ? 'Internship' : 'Full-time',
          workMode: j.isRemote ? 'Remote' : 'Onsite',
          category,
          salaryMin: j.compensation?.lowEndAmount ? Math.round(j.compensation.lowEndAmount / 100000) : null,
          salaryMax: j.compensation?.highEndAmount ? Math.round(j.compensation.highEndAmount / 100000) : null,
        }
      })
    return { source: 'ashby', sourceParam: company, jobs }
  } catch (e: any) {
    return { source: 'ashby', sourceParam: company, jobs: [], error: e.message }
  }
}

// ============================================================================
// REMOTIVE — free remote jobs API
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

// ============================================================================
// THE MUSE — free public API (no key required)
// https://www.themuse.com/api/public/jobs
// ============================================================================
export async function fetchTheMuse(): Promise<FetchResult> {
  try {
    const r = await fetch('https://www.themuse.com/api/public/jobs?page=0')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.results || [])
      .filter((j: any) => j.name && j.contents)
      .slice(0, 8)
      .map((j: any) => {
        const loc = (j.locations && j.locations[0]) ? j.locations[0].name : 'Not specified'
        const level = (j.levels && j.levels[0]) ? j.levels[0].name : ''
        return {
          title: j.name,
          company: j.company?.name || 'Unknown',
          companyWebsite: j.company?.refs?.web_page,
          location: loc,
          description: j.contents.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          applyUrl: j.refs?.apply_link || j.refs?.web_page,
          sourceRef: `muse-${j.id}`,
          sourcePostedAt: j.publication_date || undefined,
          category: level.toLowerCase().includes('intern') ? 'internship' : 'experienced',
          employmentType: level.toLowerCase().includes('intern') ? 'Internship' : 'Full-time',
          workMode: /remote/i.test(loc) ? 'Remote' : 'Onsite',
        }
      })
    return { source: 'themuse', jobs }
  } catch (e: any) {
    return { source: 'themuse', jobs: [], error: e.message }
  }
}

// ============================================================================
// REMOTEOK — free API (no key required)
// https://remoteok.com/api
// ============================================================================
export async function fetchRemoteOK(): Promise<FetchResult> {
  try {
    const r = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': 'Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    // First item is a meta object with 'legal' key; skip it
    const jobs: RawJob[] = d
      .filter((j: any) => j && j.id && j.position)
      .slice(0, 8)
      .map((j: any) => ({
        title: j.position,
        company: j.company || 'Unknown',
        location: j.location || 'Remote',
        description: (j.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000) || j.position,
        applyUrl: j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.slug || j.id}`,
        sourceRef: `remoteok-${j.id}`,
        sourcePostedAt: j.date || undefined,
        category: 'remote',
        workMode: 'Remote',
        employmentType: 'Full-time',
        skills: Array.isArray(j.tags) ? j.tags.slice(0, 6).join(',') : '',
        salaryMin: j.salary_min ? Math.round(j.salary_min / 1000) : null,
        salaryMax: j.salary_max ? Math.round(j.salary_max / 1000) : null,
      }))
    return { source: 'remoteok', jobs }
  } catch (e: any) {
    return { source: 'remoteok', jobs: [], error: e.message }
  }
}

// ============================================================================
// WE WORK REMOTELY — RSS feed (free, no key)
// https://weworkremotely.com/remote-jobs.rss
// ============================================================================
export async function fetchWeWorkRemotely(): Promise<FetchResult> {
  try {
    const r = await fetch('https://weworkremotely.com/remote-jobs.rss')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const xml = await r.text()
    // Parse RSS XML — simple regex-based parser
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    const jobs: RawJob[] = itemMatches
      .slice(0, 8)
      .map((xml) => {
        const title = extractTag(xml, 'title') || 'Untitled'
        const link = extractTag(xml, 'link') || ''
        const description = extractTag(xml, 'description') || ''
        const pubDate = extractTag(xml, 'pubDate') || ''
        const region = extractTag(xml, 'region') || 'Remote'
        // Title format: "Company: Job Title"
        const parts = title.split(':')
        const company = parts.length > 1 ? parts[0].trim() : 'Unknown'
        const jobTitle = parts.length > 1 ? parts.slice(1).join(':').trim() : title
        return {
          title: jobTitle,
          company,
          location: region,
          description: description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000),
          applyUrl: link,
          sourceRef: `wwr-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          sourcePostedAt: pubDate || undefined,
          category: 'remote',
          workMode: 'Remote',
          employmentType: 'Full-time',
        }
      })
    return { source: 'weworkremotely', jobs }
  } catch (e: any) {
    return { source: 'weworkremotely', jobs: [], error: e.message }
  }
}

// ============================================================================
// INDEED RSS — public RSS feed for any search query
// https://www.indeed.co.in/rss?q={query}&l={location}
// ============================================================================
const INDEED_QUERIES = [
  { q: 'software engineer', l: 'India' },
  { q: 'data scientist', l: 'India' },
  { q: 'frontend developer', l: 'Bengaluru' },
  { q: 'backend developer', l: 'India' },
  { q: 'devops engineer', l: 'India' },
  { q: 'full stack developer', l: 'India' },
  { q: 'product manager', l: 'India' },
  { q: 'mobile developer', l: 'India' },
]

export async function fetchIndeedRSS(): Promise<FetchResult> {
  try {
    // Pick a random query for diversity
    const query = INDEED_QUERIES[Math.floor(Math.random() * INDEED_QUERIES.length)]
    const url = `https://www.indeed.com/rss?q=${encodeURIComponent(query.q)}&l=${encodeURIComponent(query.l)}&sort=date`
    const r = await fetch(url, { headers: { 'User-Agent': 'Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const xml = await r.text()
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    const jobs: RawJob[] = itemMatches
      .slice(0, 5)
      .map((xml) => {
        const title = extractTag(xml, 'title') || 'Untitled'
        const link = extractTag(xml, 'link') || ''
        const description = extractTag(xml, 'description') || ''
        const pubDate = extractTag(xml, 'pubDate') || ''
        // Indeed title format: "Job Title - Company - Location"
        const parts = title.split(' - ')
        return {
          title: parts[0] || title,
          company: parts[1] || 'Unknown',
          location: parts[2] || query.l,
          description: description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000),
          applyUrl: link,
          sourceRef: `indeed-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          sourcePostedAt: pubDate || undefined,
          category: 'experienced',
          workMode: /remote/i.test(title) ? 'Remote' : 'Onsite',
          employmentType: 'Full-time',
        }
      })
    return { source: 'indeed-rss', sourceParam: `${query.q} in ${query.l}`, jobs }
  } catch (e: any) {
    return { source: 'indeed-rss', jobs: [], error: e.message }
  }
}

// ============================================================================
// Round-robin queue (legacy, kept for /api/sync single-source)
// ============================================================================
export function getNextSource(lastIdx: number): { adapter: () => Promise<FetchResult>, idx: number } {
  const queue: Array<() => Promise<FetchResult>> = [
    fetchRemotive,
    fetchArbeitnow,
    fetchTheMuse,
    fetchRemoteOK,
    fetchWeWorkRemotely,
    fetchIndeedRSS,
    fetchHimalayas,
    fetchJobicy,
    fetchWorkingNomads,
    fetchIndianRSS,
    ...GREENHOUSE_COMPANIES.map((c) => () => fetchGreenhouse(c)),
    ...ASHBY_COMPANIES.map((c) => () => fetchAshby(c)),
  ]
  const idx = (lastIdx + 1) % queue.length
  return { adapter: queue[idx], idx }
}

// ============================================================================
// Parallel sync — runs ALL of these in parallel per cycle
// ============================================================================
export function getParallelSources(): Array<{ adapter: () => Promise<FetchResult>, label: string }> {
  return [
    // Free job board APIs (all return 8 jobs each)
    { adapter: fetchRemotive, label: 'remotive' },
    { adapter: fetchArbeitnow, label: 'arbeitnow' },
    { adapter: fetchTheMuse, label: 'themuse' },
    { adapter: fetchRemoteOK, label: 'remoteok' },
    { adapter: fetchWeWorkRemotely, label: 'weworkremotely' },
    { adapter: fetchIndeedRSS, label: 'indeed-rss' },
    // 3 random web-search queries per cycle (LinkedIn/Naukri/Internshala/Google Jobs)
    { adapter: () => import('./web-search-adapter').then((m) => m.fetchRandomWebSearch()), label: 'web-search-1' },
    { adapter: () => import('./web-search-adapter').then((m) => m.fetchRandomWebSearch()), label: 'web-search-2' },
    { adapter: () => import('./web-search-adapter').then((m) => m.fetchRandomWebSearch()), label: 'web-search-3' },
    // 2 random career-page crawlers per cycle
    { adapter: () => import('./web-search-adapter').then((m) => m.fetchRandomCareerPage()), label: 'career-page-1' },
    { adapter: () => import('./web-search-adapter').then((m) => m.fetchRandomCareerPage()), label: 'career-page-2' },
    // NEW: Himalayas (free API, no key)
    { adapter: fetchHimalayas, label: 'himalayas' },
    // NEW: Jobicy (free RSS)
    { adapter: fetchJobicy, label: 'jobicy' },
    // NEW: Working Nomads (free RSS)
    { adapter: fetchWorkingNomads, label: 'workingnomads' },
    // NEW: Indian RSS feeds (YuvaJobs, FreshersLive, JobAaj)
    { adapter: fetchIndianRSS, label: 'indian-rss' },
    // NEW: Jooble (if API key set)
    ...(process.env.JOOBLE_API_KEY
      ? [{ adapter: fetchJooble, label: 'jooble' }]
      : []),
    // 5 random Greenhouse companies per cycle (from expanded list of 200+)
    ...GREENHOUSE_COMPANIES
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((c) => ({ adapter: () => fetchGreenhouse(c), label: `greenhouse-${c}` })),
    // 3 random Ashby companies per cycle (from expanded list of 60+)
    ...ASHBY_COMPANIES
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => ({ adapter: () => fetchAshby(c), label: `ashby-${c}` })),
    // Adzuna API (if user has provided ADZUNA_APP_ID + ADZUNA_APP_KEY in env)
    // Free tier = 1000 requests/month. We use 2 per sync × 48 syncs/day = 96/day ≈ 2880/month
    // That's over the limit. So we only do 1 Adzuna call per sync (fetches latest 20 India jobs)
    ...(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
      ? [
          { adapter: () => fetchAdzuna('all', 'India'), label: 'adzuna-latest' },
        ]
      : []),
    // Careerjet API (if user has provided CAREERJET_AFFILIATE_ID in env)
    ...(process.env.CAREERJET_AFFILIATE_ID
      ? [
          { adapter: () => fetchCareerjet('software engineer', 'India'), label: 'careerjet-software' },
          { adapter: () => fetchCareerjet('fresher', 'India'), label: 'careerjet-fresher' },
          { adapter: () => fetchCareerjet('data scientist', 'India'), label: 'careerjet-data' },
          { adapter: () => fetchCareerjet('devops', 'India'), label: 'careerjet-devops' },
        ]
      : []),
  ]
}

export const SOURCE_QUEUE_LENGTH =
  10 + GREENHOUSE_COMPANIES.length + ASHBY_COMPANIES.length

// ============================================================================
// ADZUNA — affiliate job API (legal aggregator covering India)
// Free: 1000 requests/month × 50 results = 50,000 jobs/month
// Sign up at: https://developer.adzuna.com/
// Set ADZUNA_APP_ID and ADZUNA_APP_KEY in your .env file
// ============================================================================
export async function fetchAdzuna(what: string, where: string): Promise<FetchResult> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) {
    return { source: 'adzuna', sourceParam: `${what} in ${where}`, jobs: [], error: 'ADZUNA_APP_ID or ADZUNA_APP_KEY not set in env' }
  }
  try {
    // Adzuna's `what` param can cause 503s with multi-word queries.
    // Use `what_or` instead which is more forgiving, and fall back to no params.
    // Adzuna's `what` param causes 503 errors with multi-word queries.
    // Instead, fetch latest India jobs sorted by date (no filter).
    // The `in` in the URL path already restricts to India.
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}` +
      `&results_per_page=20&sort=date&max_days_old=7`
    const r = await fetch(url, { headers: { 'User-Agent': 'Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.results || [])
      .filter((j: any) => j.title && (j.description || j.title) && (j.redirect_url || j.url))
      .slice(0, 20)
      .map((j: any) => ({
        title: j.title,
        company: j.company?.display_name || 'Unknown',
        location: j.location?.display_name || where,
        description: j.description || `${j.title} at ${j.company?.display_name || 'Unknown'}.`,
        applyUrl: j.redirect_url || j.url,
        sourceRef: `adzuna-${j.id}`,
        sourcePostedAt: j.created || undefined,
        category: /fresher|entry|intern/i.test(j.title) ? 'fresher' : 'experienced',
        workMode: /remote/i.test(j.title + (j.location?.display_name || '')) ? 'Remote' : 'Onsite',
        employmentType: /contract/i.test(j.title + (j.description || '')) ? 'Contract' : 'Full-time',
        salaryMin: j.salary_min ? Math.round(j.salary_min / 100000) : null,
        salaryMax: j.salary_max ? Math.round(j.salary_max / 100000) : null,
      }))
    return { source: 'adzuna', sourceParam: `${what} in ${where}`, jobs }
  } catch (e: any) {
    return { source: 'adzuna', sourceParam: `${what} in ${where}`, jobs: [], error: e.message }
  }
}

// ============================================================================
// CAREERJET — affiliate job API (legal aggregator, India coverage)
// Free: requires affiliate ID (sign up at https://www.careerjet.com/partners/api/)
// Set CAREERJET_AFFILIATE_ID in your .env file
// ============================================================================
export async function fetchCareerjet(what: string, where: string): Promise<FetchResult> {
  const affId = process.env.CAREERJET_AFFILIATE_ID
  if (!affId) {
    return { source: 'careerjet', sourceParam: `${what} in ${where}`, jobs: [], error: 'CAREERJET_AFFILIATE_ID not set in env' }
  }
  try {
    const url = 'https://www.careerjet.co.in/search/jobs?' +
      `s=${encodeURIComponent(what)}&l=${encodeURIComponent(where)}&sort=date&affid=${affId}`
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const html = await r.text()
    // Careerjet doesn't expose a clean JSON API without official partnership,
    // but the search results page contains job links. Parse the HTML for job cards.
    const jobMatches = html.match(/<article[^>]*class="[^"]*job[^"]*"[^>]*>[\s\S]*?<\/article>/gi) || []
    const jobs: RawJob[] = jobMatches
      .slice(0, 15)
      .map((html) => {
        const title = (html.match(/<h2[^>]*>(?:<a[^>]*>)?([^<]+)/i) || [])[1]?.trim() || 'Untitled'
        const company = (html.match(/<p[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)/i) || [])[1]?.trim() || 'Unknown'
        const location = (html.match(/<ul[^>]*class="[^"]*location[^"]*"[^>]*>[\s\S]*?<li[^>]*>([^<]+)/i) || [])[1]?.trim() || where
        const link = (html.match(/href="([^"]*\/job\/[^"]*)"/i) || [])[1] || ''
        return {
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
          company: company.replace(/&amp;/g, '&').trim(),
          location: location.includes(',') ? location : `${location}, India`,
          description: `${title} at ${company} in ${location}. Apply via Careerjet for full details.`,
          applyUrl: link.startsWith('http') ? link : `https://www.careerjet.co.in${link}`,
          sourceRef: `careerjet-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          category: /fresher|entry|intern/i.test(title) ? 'fresher' : 'experienced',
          workMode: /remote/i.test(title + location) ? 'Remote' : 'Onsite',
          employmentType: 'Full-time',
        }
      })
      .filter((j) => j.title !== 'Untitled')
    return { source: 'careerjet', sourceParam: `${what} in ${where}`, jobs }
  } catch (e: any) {
    return { source: 'careerjet', sourceParam: `${what} in ${where}`, jobs: [], error: e.message }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function prettyName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : null
}

// ============================================================================
// HIMALAYAS — free job API (no key needed, has India + remote jobs)
// Public JSON API: https://himalayas.app/api/jobs
// ============================================================================
export async function fetchHimalayas(): Promise<FetchResult> {
  try {
    const r = await fetch('https://himalayas.app/api/jobs?limit=30', {
      headers: { 'User-Agent': 'Mozilla/5.0 Hirebase/1.0' },
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.jobs || d || [])
      .filter((j: any) => j.title && (j.description || j.title))
      .slice(0, 15)
      .map((j: any) => ({
        title: j.title,
        company: j.companyName || j.company_name || j.company?.name || 'Unknown',
        companyWebsite: j.companyWebsite || undefined,
        location: j.locationName || j.location || 'Remote',
        description: (j.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000) || j.title,
        applyUrl: j.applyUrl || j.url || j.canonical_url,
        sourceRef: `himalayas-${j.id || j.uuid}`,
        sourcePostedAt: j.postedAt || j.published_at || undefined,
        category: /intern|fresher|entry/i.test(j.title) ? 'fresher' : 'experienced',
        workMode: /remote/i.test((j.location || '') + (j.tags || '')) ? 'Remote' : 'Onsite',
        employmentType: /contract/i.test(j.title + (j.description || '')) ? 'Contract' : 'Full-time',
        skills: (j.tags || []).join(', ') || undefined,
      }))
    return { source: 'himalayas', jobs }
  } catch (e: any) {
    return { source: 'himalayas', jobs: [], error: e.message }
  }
}

// ============================================================================
// JOOBLE — free job API (needs API key, covers India well)
// Sign up at: https://jooble.org/api
// Set JOOBLE_API_KEY in your .env file
// ============================================================================
export async function fetchJooble(): Promise<FetchResult> {
  const apiKey = process.env.JOOBLE_API_KEY
  if (!apiKey) {
    return { source: 'jooble', jobs: [], error: 'JOOBLE_API_KEY not set' }
  }
  try {
    // Jooble API: POST to https://in.jooble.org/api/{apiKey}
    // Body: { keywords: "...", location: "India" }
    const queries = [
      { keywords: 'software engineer', location: 'India' },
      { keywords: 'data scientist', location: 'India' },
      { keywords: 'fresher', location: 'India' },
    ]
    const picked = queries[Math.floor(Math.random() * queries.length)]
    const r = await fetch(`https://in.jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(picked),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const jobs: RawJob[] = (d.jobs || [])
      .filter((j: any) => j.title && j.link)
      .slice(0, 10)
      .map((j: any) => ({
        title: j.title,
        company: j.company || 'Unknown',
        location: j.location || 'India',
        description: j.snippet || j.type || `${j.title} at ${j.company}. Apply via Jooble.`,
        applyUrl: j.link,
        sourceRef: `jooble-${j.id || Buffer.from(j.link).toString('base64').slice(0, 20)}`,
        sourcePostedAt: j.updated || undefined,
        category: /fresher|intern|entry/i.test(j.title) ? 'fresher' : 'experienced',
        workMode: /remote/i.test(j.title + (j.location || '')) ? 'Remote' : 'Onsite',
        employmentType: j.type?.includes('Contract') ? 'Contract' : 'Full-time',
        salaryMin: j.salary ? parseInt(String(j.salary).replace(/[^0-9]/g, '')) / 100000 || undefined : undefined,
      }))
    return { source: 'jooble', sourceParam: picked.keywords, jobs }
  } catch (e: any) {
    return { source: 'jooble', jobs: [], error: e.message }
  }
}

// ============================================================================
// JOBICY — free RSS feed (remote + on-site jobs worldwide, no key needed)
// ============================================================================
export async function fetchJobicy(): Promise<FetchResult> {
  try {
    const feeds = [
      'https://jobicy.com/jobs.rss',
      'https://jobicy.com/remote-jobs.rss',
    ]
    const feedUrl = feeds[Math.floor(Math.random() * feeds.length)]
    const r = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const xml = await r.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    const jobs: RawJob[] = items
      .slice(0, 8)
      .map((xml) => {
        const title = extractTag(xml, 'title') || 'Untitled'
        const link = extractTag(xml, 'link') || ''
        const desc = extractTag(xml, 'description') || ''
        // Jobicy RSS format: "Company Name: Job Title"
        const parts = title.split(':')
        const company = parts.length > 1 ? parts[0].trim() : 'Unknown'
        const jobTitle = parts.length > 1 ? parts.slice(1).join(':').trim() : title
        return {
          title: jobTitle,
          company,
          location: /remote/i.test(title + desc) ? 'Remote' : 'Not specified',
          description: desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000) || jobTitle,
          applyUrl: link,
          sourceRef: `jobicy-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          category: /fresher|intern|entry/i.test(jobTitle) ? 'fresher' : 'experienced',
          workMode: 'Remote',
          employmentType: 'Full-time',
        }
      })
      .filter((j) => j.title !== 'Untitled')
    return { source: 'jobicy', jobs }
  } catch (e: any) {
    return { source: 'jobicy', jobs: [], error: e.message }
  }
}

// ============================================================================
// WORKING NOMADS — free RSS feed (remote jobs, no key needed)
// ============================================================================
export async function fetchWorkingNomads(): Promise<FetchResult> {
  try {
    const feeds = [
      'https://www.workingnomads.com/jobsrss',
      'https://www.workingnomads.com/jobsrss/software-development',
      'https://www.workingnomads.com/jobsrss/data-science',
    ]
    const feedUrl = feeds[Math.floor(Math.random() * feeds.length)]
    const r = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const xml = await r.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    const jobs: RawJob[] = items
      .slice(0, 8)
      .map((xml) => {
        const title = extractTag(xml, 'title') || 'Untitled'
        const link = extractTag(xml, 'link') || ''
        const desc = extractTag(xml, 'description') || ''
        // Working Nomads format: "Job Title - Company - Location"
        const parts = title.split(' - ')
        return {
          title: parts[0]?.trim() || title,
          company: parts[1]?.trim() || 'Unknown',
          location: 'Remote',
          description: desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000) || title,
          applyUrl: link,
          sourceRef: `wnomads-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          category: /fresher|intern|entry/i.test(title) ? 'fresher' : 'experienced',
          workMode: 'Remote',
          employmentType: 'Full-time',
        }
      })
      .filter((j) => j.title !== 'Untitled')
    return { source: 'workingnomads', jobs }
  } catch (e: any) {
    return { source: 'workingnomads', jobs: [], error: e.message }
  }
}

// ============================================================================
// INDIAN RSS FEEDS — YuvaJobs, FreshersLive (fresher jobs in India, no key)
// ============================================================================
export async function fetchIndianRSS(): Promise<FetchResult> {
  const feeds = [
    { url: 'https://www.yuvajobs.com/rss/jobs.xml', source: 'yuvajobs' },
    { url: 'https://www.fresherslive.com/rss/jobs.xml', source: 'fresherslive' },
    { url: 'https://www.jobsaaj.com/rss/jobs.xml', source: 'jobsaaj' },
  ]
  const picked = feeds[Math.floor(Math.random() * feeds.length)]
  try {
    const r = await fetch(picked.url, { headers: { 'User-Agent': 'Mozilla/5.0 Hirebase/1.0' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const xml = await r.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    const jobs: RawJob[] = items
      .slice(0, 10)
      .map((xml) => {
        const title = extractTag(xml, 'title') || 'Untitled'
        const link = extractTag(xml, 'link') || ''
        const desc = extractTag(xml, 'description') || ''
        return {
          title: title.replace(/&amp;/g, '&').trim(),
          company: 'Indian Employer',
          location: 'India',
          description: desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000) || title,
          applyUrl: link,
          sourceRef: `${picked.source}-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          category: 'fresher', // these feeds are mostly fresher jobs
          workMode: 'Onsite',
          employmentType: 'Full-time',
        }
      })
      .filter((j) => j.title !== 'Untitled' && j.applyUrl)
    return { source: picked.source, jobs }
  } catch (e: any) {
    return { source: picked.source, jobs: [], error: e.message }
  }
}
