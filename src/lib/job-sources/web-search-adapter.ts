// Web-search adapter — uses z-ai-web-dev-sdk's web_search + page_reader
// to discover and fetch job postings from ANY public website (LinkedIn,
// Naukri public pages, small company career pages, etc.)
//
// This is the "real crawler" — it doesn't bypass anti-bot systems; it uses
// the z-ai-web-dev-sdk's search + reader infrastructure, which legitimately
// indexes public web pages.

import ZAI from 'z-ai-web-dev-sdk'

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

// Search queries that target different job sources — varied so we get diverse results
const SEARCH_QUERIES = [
  'site:linkedin.com/jobs software engineer India 2026',
  'site:naukri.com software developer fresher India',
  'site:jobs.ashbyhq.com software engineer remote',
  'site:lever.co software engineer India',
  'site:greenhouse.io software engineer India',
  'software engineer jobs India freshers 2026',
  'frontend developer jobs India remote 2026',
  'backend engineer jobs Bengaluru Hyderabad',
  'data scientist jobs India fresher',
  'devops engineer jobs India remote',
  'full stack developer jobs India 2026',
  'site:indeed.com software engineer India',
  'site:glassdoor.com software engineer India',
  'product manager jobs India Bengaluru',
  'UI UX designer jobs India remote',
]

let zaiInstance: any = null
async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// Search the web for jobs, then fetch each result page to extract job content
export async function fetchWebSearch(query: string): Promise<FetchResult> {
  try {
    const zai = await getZai()

    // Step 1: Search the web for job postings
    const searchResults: any[] = await zai.functions.invoke('web_search', {
      query,
      num: 8,
    })

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return { source: 'web-search', sourceParam: query, jobs: [] }
    }

    // Filter to likely job-posting URLs
    const jobUrlPatterns = [
      /linkedin\.com\/jobs\//i,
      /naukri\.com\/job/i,
      /indeed\.com\/viewjob/i,
      /glassdoor\.com\/job-listing/i,
      /jobs\.lever\.co\//i,
      /boards\.greenhouse\.io\//i,
      /jobs\.ashbyhq\.com\//i,
      /careers\./i,
      /\/jobs?\//i,
    ]
    const filtered = searchResults.filter((r: any) => {
      const url = r.url || r.host_name || ''
      return jobUrlPatterns.some((p) => p.test(url))
    })

    const candidates = (filtered.length > 0 ? filtered : searchResults).slice(0, 5)

    // Step 2: For each candidate URL, fetch the page content
    const jobs: RawJob[] = []
    for (const result of candidates) {
      try {
        const url = result.url
        if (!url) continue

        const pageData: any = await zai.functions.invoke('page_reader', { url })
        if (!pageData || !pageData.data) continue

        const title = pageData.data.title || result.name || 'Untitled Role'
        const html = pageData.data.html || ''
        const text = stripHtml(html)

        // Skip if too short to be a real job posting
        if (text.length < 200) continue

        // Extract company name — heuristic: from URL or page title
        const company = extractCompany(url, title, result.host_name)

        // Extract location from text — heuristic
        const location = extractLocation(text) || 'India'

        jobs.push({
          title: cleanTitle(title),
          company,
          companyWebsite: `https://${result.host_name}`,
          location,
          description: text.slice(0, 8000), // Cap at 8k chars for AI processing
          applyUrl: url,
          sourceRef: `web-${Buffer.from(url).toString('base64').slice(0, 20)}`,
          sourcePostedAt: pageData.data.publishedTime || result.date || undefined,
          category: 'experienced',
          workMode: /remote|work from home|wfh/i.test(text) ? 'Remote' : 'Onsite',
        })
      } catch (e) {
        // Skip this URL if fetch fails
        continue
      }
    }

    return { source: 'web-search', sourceParam: query, jobs }
  } catch (e: any) {
    return { source: 'web-search', sourceParam: query, jobs: [], error: e.message }
  }
}

// Direct career-page crawler — fetches a company's careers page and extracts job links
// Uses a curated list of company careers page URLs
const CAREER_PAGES: Array<{ company: string; url: string; industry: string }> = [
  // Indian IT majors
  { company: 'TCS', url: 'https://www.tcs.com/careers', industry: 'IT Services' },
  { company: 'Infosys', url: 'https://www.infosys.com/careers/', industry: 'IT Services' },
  { company: 'Wipro', url: 'https://careers.wipro.com/careers/', industry: 'IT Services' },
  { company: 'HCLTech', url: 'https://www.hcltech.com/careers', industry: 'IT Services' },
  { company: 'Tech Mahindra', url: 'https://careers.techmahindra.com/', industry: 'IT Services' },
  { company: 'Cognizant', url: 'https://careers.cognizant.com/global/en', industry: 'IT Services' },
  { company: 'Capgemini', url: 'https://www.capgemini.com/careers/', industry: 'IT Services' },
  { company: 'IBM', url: 'https://www.ibm.com/careers/', industry: 'IT Services' },
  { company: 'Accenture India', url: 'https://www.accenture.com/in-en/careers', industry: 'IT Services' },
  // Indian startups & product companies
  { company: 'Flipkart', url: 'https://www.flipkartcareers.com/', industry: 'E-commerce' },
  { company: 'Swiggy', url: 'https://careers.swiggy.com/', industry: 'Food Delivery' },
  { company: 'Zomato', url: 'https://www.zomato.com/careers', industry: 'Food Delivery' },
  { company: 'Paytm', url: 'https://paytm.com/careers', industry: 'Fintech' },
  { company: 'Razorpay', url: 'https://razorpay.com/jobs/', industry: 'Fintech' },
  { company: 'PhonePe', url: 'https://www.phonepe.com/careers/', industry: 'Fintech' },
  { company: 'Zerodha', url: 'https://zerodha.com/careers/', industry: 'Fintech' },
  { company: 'Cred', url: 'https://cred.club/careers', industry: 'Fintech' },
  { company: 'Groww', url: 'https://groww.in/careers', industry: 'Fintech' },
  { company: 'UPI', url: 'https://www.upi.com/careers', industry: 'Fintech' },
  { company: 'Ola', url: 'https://www.olacabs.com/careers', industry: 'Mobility' },
  { company: 'Uber India', url: 'https://www.uber.com/in/en/careers/', industry: 'Mobility' },
  { company: 'Dream11', url: 'https://dream11.com/careers', industry: 'Gaming' },
  { company: 'Meesho', url: 'https://www.meesho.io/careers', industry: 'E-commerce' },
  { company: 'Lenskart', url: 'https://www.lenskart.com/careers', industry: 'Retail' },
  { company: 'Nykaa', url: 'https://www.nykaa.com/careers', industry: 'Beauty Retail' },
  { company: 'Byjus', url: 'https://byjus.com/careers/', industry: 'EdTech' },
  { company: 'Unacademy', url: 'https://unacademy.com/careers/', industry: 'EdTech' },
  { company: 'Freshworks', url: 'https://www.freshworks.com/company/careers/', industry: 'SaaS' },
  { company: 'Zoho', url: 'https://www.zoho.com/careers/', industry: 'SaaS' },
  { company: 'Postman', url: 'https://www.postman.com/company/careers/', industry: 'SaaS' },
  { company: 'Hasura', url: 'https://hasura.io/careers/', industry: 'SaaS' },
  { company: 'Databricks India', url: 'https://www.databricks.com/company/careers', industry: 'Data' },
  { company: 'Atlassian India', url: 'https://www.atlassian.com/company/careers/all-jobs', industry: 'SaaS' },
  { company: 'Adobe India', url: 'https://careers.adobe.com/us/en', industry: 'Software' },
  { company: 'Oracle India', url: 'https://www.oracle.com/in/corporate/careers/', industry: 'Software' },
  { company: 'SAP India', url: 'https://www.sap.com/about/careers.html', industry: 'Software' },
  { company: 'VMware', url: 'https://careers.vmware.com/', industry: 'Software' },
  { company: 'Salesforce India', url: 'https://www.salesforce.com/in/company/careers/', industry: 'SaaS' },
  { company: 'ServiceNow', url: 'https://careers.servicenow.com/', industry: 'SaaS' },
]

export async function fetchCareerPage(companyEntry: { company: string; url: string; industry: string }): Promise<FetchResult> {
  try {
    const zai = await getZai()
    const pageData: any = await zai.functions.invoke('page_reader', { url: companyEntry.url })

    if (!pageData || !pageData.data) {
      return { source: 'career-page', sourceParam: companyEntry.company, jobs: [] }
    }

    const html = pageData.data.html || ''
    const text = stripHtml(html)

    // Try to extract job links from the page — look for /job, /jobposting, /apply URLs
    const jobLinkPatterns = [
      /href=["']([^"']*(?:job|career|position|role)[^"']*)["']/gi,
      /href=["']([^"']*(?:apply|posting|view)[^"']*)["']/gi,
    ]
    const jobUrls = new Set<string>()
    for (const pattern of jobLinkPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const link = match[1]
        // Skip obvious non-job links
        if (link.includes('javascript:') || link.includes('#')) continue
        // Make absolute
        const abs = link.startsWith('http') ? link : new URL(link, companyEntry.url).href
        jobUrls.add(abs)
      }
    }

    // If we found job links, fetch up to 5 of them in parallel
    const candidateUrls = Array.from(jobUrls).slice(0, 5)
    const jobs: RawJob[] = []

    if (candidateUrls.length > 0) {
      const pagePromises = candidateUrls.map(async (jobUrl) => {
        try {
          const jobPage: any = await zai.functions.invoke('page_reader', { url: jobUrl })
          if (!jobPage || !jobPage.data) return null
          const jobHtml = jobPage.data.html || ''
          const jobText = stripHtml(jobHtml)
          if (jobText.length < 200) return null
          const title = jobPage.data.title || extractTitleFromText(jobText) || `${companyEntry.company} Role`
          return {
            title: cleanTitle(title),
            company: companyEntry.company,
            companyWebsite: companyEntry.url,
            industry: companyEntry.industry,
            location: extractLocation(jobText) || 'India',
            description: jobText.slice(0, 8000),
            applyUrl: jobUrl,
            sourceRef: `career-${Buffer.from(jobUrl).toString('base64').slice(0, 20)}`,
            category: 'experienced',
            workMode: /remote|work from home|wfh/i.test(jobText) ? 'Remote' : 'Onsite',
          } as RawJob
        } catch {
          return null
        }
      })
      const results = await Promise.all(pagePromises)
      for (const r of results) {
        if (r) jobs.push(r)
      }
    }

    // If no job links found but the page itself looks like a jobs listing page,
    // treat the page content as a meta-listing
    if (jobs.length === 0 && text.length > 500) {
      // The careers page itself — save as a "company hiring" job so users at least see it
      jobs.push({
        title: `${companyEntry.company} — Multiple Open Roles`,
        company: companyEntry.company,
        companyWebsite: companyEntry.url,
        industry: companyEntry.industry,
        location: 'India',
        description: `${companyEntry.company} is actively hiring. Visit their careers page to see all current openings.\n\n${text.slice(0, 3000)}`,
        applyUrl: companyEntry.url,
        sourceRef: `career-page-${Buffer.from(companyEntry.url).toString('base64').slice(0, 20)}`,
        category: 'experienced',
        workMode: 'Onsite',
      })
    }

    return { source: 'career-page', sourceParam: companyEntry.company, jobs }
  } catch (e: any) {
    return { source: 'career-page', sourceParam: companyEntry.company, jobs: [], error: e.message }
  }
}

// Pick a random search query — varied per cycle so we get diversity
export async function fetchRandomWebSearch(): Promise<FetchResult> {
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)]
  return fetchWebSearch(query)
}

// Pick a random career page — varied per cycle
export async function fetchRandomCareerPage(): Promise<FetchResult> {
  const entry = CAREER_PAGES[Math.floor(Math.random() * CAREER_PAGES.length)]
  return fetchCareerPage(entry)
}

export const WEB_SEARCH_QUERIES = SEARCH_QUERIES
export const CAREER_PAGES_LIST = CAREER_PAGES

// ---- Helpers ----

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

function extractCompany(url: string, title: string, host: string): string {
  // Try to extract company from URL host
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const parts = host.split('.')
    if (parts.length >= 2) {
      // For linkedin.com/jobs/view/{id}, we can't get company from URL easily
      if (host.includes('linkedin.com')) {
        // Try to extract from title: "Company Name - Job Title - LinkedIn"
        const titleParts = title.split(/[-|·]/)
        if (titleParts.length >= 2) return titleParts[0].trim()
      }
      if (host.includes('naukri.com')) {
        const titleParts = title.split(/[-|·]/)
        if (titleParts.length >= 2) return titleParts[0].trim()
      }
      // For company career pages
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    }
    return host || 'Unknown'
  } catch {
    return host || 'Unknown'
  }
}

function extractLocation(text: string): string | null {
  // Heuristic — look for common Indian city names
  const cities = [
    'Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune',
    'Noida', 'Gurugram', 'Gurgaon', 'Delhi', 'Kolkata', 'Kochi', 'Coimbatore',
    'Ahmedabad', 'Jaipur', 'Chandigarh', 'Remote', 'India',
  ]
  const found: string[] = []
  for (const c of cities) {
    const regex = new RegExp(`\\b${c}\\b`, 'i')
    if (regex.test(text) && !found.includes(c)) {
      found.push(c)
    }
  }
  if (found.length === 0) return null
  // Dedupe (Bangalore/Bengaluru, Gurgaon/Gurugram)
  const unique: string[] = []
  for (const f of found) {
    if (f === 'Bangalore' && found.includes('Bengaluru')) continue
    if (f === 'Gurgaon' && found.includes('Gurugram')) continue
    unique.push(f)
  }
  return unique.slice(0, 3).join(', ')
}

function extractTitleFromText(text: string): string | null {
  // First 100 chars often contain the job title
  const firstLine = text.slice(0, 200).split(/[.·\n]/)[0]
  if (firstLine && firstLine.length > 5 && firstLine.length < 100) {
    return firstLine.trim()
  }
  return null
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|·]\s*(LinkedIn|Naukri|Indeed|Glassdoor|.*Careers).*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}
