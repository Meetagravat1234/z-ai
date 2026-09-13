/**
 * Server-side salary estimator.
 *
 * Why this exists:
 * - Many job listings (especially from LinkedIn, The Muse, manual entry) do not
 *   publish a salary range. Previously the UI fell back to a hardcoded
 *   "Estimated ₹3-15 LPA" everywhere, which is misleading — a fresher role at
 *   a services company is not paid the same as a Staff Engineer at a product
 *   startup.
 * - This module looks at the *actual* salary data we have for similar jobs in
 *   the database (same role family + similar experience + similar location)
 *   and produces a realistic estimate.
 * - If we don't have enough similar jobs with salary data, we return null and
 *   the UI hides the salary display entirely (per the product owner's request:
 *   "either estimate salary based on job/company/location, or don't show it").
 *
 * Caching:
 * - The benchmark aggregation runs once and is cached in-memory for 10 minutes.
 *   The cache is keyed by nothing (it's a global benchmark table) — when jobs
 *   are added/updated, the cache will refresh on the next expiry.
 */

import { db } from '@/lib/db'

export interface SalaryEstimate {
  min: number // LPA * 10 (matches the salaryMin / salaryMax convention in the DB)
  max: number // LPA * 10
  confidence: 'high' | 'medium' | 'low'
  basis: string // human-readable description of what we based the estimate on
}

interface Benchmark {
  samples: number
  minLpa: number
  maxLpa: number
  avgLpa: number
  p25Lpa: number
  p75Lpa: number
  medianLpa: number
}

interface BenchmarkBucket {
  samples: number
  salaries: Array<{ minLpa: number; maxLpa: number }>
}

interface BenchmarkTable {
  byRole: Map<string, Benchmark>
  byRoleAndExp: Map<string, Benchmark>
  byRoleAndCity: Map<string, Benchmark>
  byCategory: Map<string, Benchmark>
  overall: Benchmark | null
  builtAt: number
}

let CACHE: BenchmarkTable | null = null
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (kept consistent with /api/analytics/salary so the same role / city /
// experience buckets are used everywhere)
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PATTERNS: Array<{ pattern: RegExp; canonical: string; baseExpMultiplier: number }> = [
  // Order matters — first match wins. More specific patterns first.
  { pattern: /staff|principal|distinguished/i, canonical: 'Staff/Principal Engineer', baseExpMultiplier: 2.0 },
  { pattern: /senior.*software|sr\.?\s*software|sde.?3|sde.?iii|software engineer\s*iii|senior.*developer|sr\.?\s*developer/i, canonical: 'Senior Software Engineer', baseExpMultiplier: 1.5 },
  { pattern: /software engineer|sde|software developer|developer/i, canonical: 'Software Engineer', baseExpMultiplier: 1.0 },
  { pattern: /frontend|front.?end|react|ui developer|ui.?engineer/i, canonical: 'Frontend Engineer', baseExpMultiplier: 1.0 },
  { pattern: /backend|back.?end|api|server|node|django|spring/i, canonical: 'Backend Engineer', baseExpMultiplier: 1.0 },
  { pattern: /full.?stack/i, canonical: 'Full Stack Engineer', baseExpMultiplier: 1.05 },
  { pattern: /devops|sre|site reliability|platform engineer|infrastructure/i, canonical: 'DevOps/SRE', baseExpMultiplier: 1.15 },
  { pattern: /data scientist|ml engineer|machine learning|ai engineer|ai scientist|deep learning|artificial intelligence|computer vision|nlp engineer/i, canonical: 'ML/Data Engineer', baseExpMultiplier: 1.2 },
  { pattern: /data engineer|data analyst|analytics/i, canonical: 'Data Engineer/Analyst', baseExpMultiplier: 1.0 },
  { pattern: /product manager|product manager/i, canonical: 'Product Manager', baseExpMultiplier: 1.3 },
  { pattern: /program manager|project manager|pm\b/i, canonical: 'Program/Project Manager', baseExpMultiplier: 1.1 },
  { pattern: /designer|ux|ui\/ux|graphic/i, canonical: 'Designer', baseExpMultiplier: 0.9 },
  { pattern: /qa|test|automation|sdet/i, canonical: 'QA Engineer', baseExpMultiplier: 0.85 },
  { pattern: /architect/i, canonical: 'Architect', baseExpMultiplier: 1.7 },
  { pattern: /engineering manager|tech lead|tech manager|team lead|lead developer|lead engineer/i, canonical: 'Engineering Manager', baseExpMultiplier: 1.8 },
  { pattern: /head of|director|vp|cto/i, canonical: 'Engineering Director+', baseExpMultiplier: 2.5 },
  { pattern: /intern/i, canonical: 'Intern', baseExpMultiplier: 0.3 },
  { pattern: /fresher|entry|graduate/i, canonical: 'Fresher', baseExpMultiplier: 0.5 },
  { pattern: /marketing|seo|content|growth/i, canonical: 'Marketing', baseExpMultiplier: 0.7 },
  { pattern: /sales|business development|bde|account executive/i, canonical: 'Sales', baseExpMultiplier: 0.8 },
  { pattern: /hr|recruiter|talent|human resources/i, canonical: 'HR', baseExpMultiplier: 0.7 },
  { pattern: /finance|accountant|financial/i, canonical: 'Finance', baseExpMultiplier: 0.9 },
  { pattern: /operations|ops|supply chain/i, canonical: 'Operations', baseExpMultiplier: 0.75 },
  { pattern: /customer success|support|customer service/i, canonical: 'Customer Success', baseExpMultiplier: 0.6 },
]

const TIER1_CITIES = ['Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Chennai', 'Gurgaon', 'Gurugram', 'Noida', 'Delhi']
const TIER2_CITIES = ['Kolkata', 'Kochi', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Coimbatore', 'Indore', 'Bhubaneswar', 'Thiruvananthapuram', 'Lucknow']

const CITY_TIER_MULTIPLIER: Record<string, number> = {
  tier1: 1.0,
  tier2: 0.85,
  remote: 1.05, // Remote roles at product companies often pay slightly above tier-1 avg
  other: 0.75,
  india: 0.9, // Generic "India" location — assume slightly below tier-1 average
}

/**
 * Known tier-1 global employers that pay significantly above the Indian market
 * median. When the estimator encounters a job at one of these companies, it
 * applies a multiplier so we don't mislead candidates with underestimates.
 *
 * Without this list, the estimator would compute ₹8-12 LPA for a Stripe SDE
 * role based on generic Indian SDE benchmarks — when Stripe's actual pay band
 * is ₹30-50+ LPA. That misleading underestimate damages platform credibility.
 *
 * Multipliers are calibrated to publicly available compensation data
 * (levels.fyi, Glassdoor, Blind) for India roles as of 2025.
 *
 * NOTE: When we don't have enough role-specific benchmark data AND the company
 * is in this list, we actually prefer to return null (hide salary entirely)
 * rather than publish a low-confidence estimate that's likely wrong.
 */
const TIER1_EMPLOYER_MULTIPLIER: Array<{ pattern: RegExp; multiplier: number; minLpa: number }> = [
  // FAANG / top-tier US tech — pay 2.5-4x Indian market median
  { pattern: /\b(stripe|openai|anthropic|nvidia|databricks|snowflake)\b/i, multiplier: 3.2, minLpa: 25 },
  { pattern: /\b(google|alphabet|microsoft|amazon|meta|facebook|apple|netflix|adobe)\b/i, multiplier: 2.5, minLpa: 18 },
  { pattern: /\b(uber|airbnb|linkedin|salesforce|oracle|vmware|cisco|intel)\b/i, multiplier: 2.2, minLpa: 15 },
  { pattern: /\b(atlassian|samsung|qualcomm|samsung research|siemens)\b/i, multiplier: 1.8, minLpa: 12 },
  // Indian top-tier product companies
  { pattern: /\b(flipkart|swiggy|zomato|razorpay|phonepe|cRED|cred|zepto|browserstack|freshworks|zoho|postman)\b/i, multiplier: 1.7, minLpa: 12 },
  // Tier-2 global tech
  { pattern: /\b(sap|vmware|servicenow|workday|intuit|paypal|visa|mastercard|vmware|citrix|symantec|mcafee)\b/i, multiplier: 1.6, minLpa: 10 },
  // Major Indian services companies — at or slightly below market median
  { pattern: /\b(tcs|infosys|wipro|hcl|tech mahindra|cognizant|capgemini|accenture|ibm|deloitte)\b/i, multiplier: 0.85, minLpa: 3 },
]

/**
 * Look up the company-tier multiplier for a given company name.
 * Returns null if the company isn't a known tier-1 employer.
 */
function getCompanyTierMultiplier(companyName?: string | null): { multiplier: number; minLpa: number; maxLpa: number } | null {
  if (!companyName) return null
  for (const { pattern, multiplier, minLpa } of TIER1_EMPLOYER_MULTIPLIER) {
    if (pattern.test(companyName)) {
      // The maxLpa caps the estimate so we don't show absurd numbers for
      // a fresher role at, say, Stripe (where actual max could be 80 LPA
      // for someone with exceptional offers, but we don't want to overstate)
      return { multiplier, minLpa, maxLpa: minLpa * 4 }
    }
  }
  return null
}

export function normalizeRole(title: string): string {
  if (!title) return 'Other'
  for (const { pattern, canonical } of ROLE_PATTERNS) {
    if (pattern.test(title)) return canonical
  }
  return 'Other'
}

export function extractCityTier(location: string): keyof typeof CITY_TIER_MULTIPLIER {
  if (!location) return 'other'
  const lower = location.toLowerCase()
  if (/remote|work from home|wfh/i.test(lower)) return 'remote'
  for (const c of TIER1_CITIES) {
    if (lower.includes(c.toLowerCase())) return 'tier1'
  }
  for (const c of TIER2_CITIES) {
    if (lower.includes(c.toLowerCase())) return 'tier2'
  }
  if (lower.includes('india')) return 'india'
  return 'other'
}

export function normalizeExperience(exp: string): string {
  if (!exp) return 'Not specified'
  const lower = exp.toLowerCase()
  // Extract first number found
  const match = lower.match(/(\d+)\s*[-+]/) || lower.match(/(\d+)/)
  const firstNum = match ? parseInt(match[1]) : null
  if (/intern|fresher|entry|0\s*year|0-\d/i.test(lower) || firstNum === 0) return '0-1'
  if (firstNum != null) {
    if (firstNum <= 1) return '0-2'
    if (firstNum <= 3) return '1-3'
    if (firstNum <= 5) return '3-5'
    if (firstNum <= 8) return '5-8'
    if (firstNum <= 12) return '8-12'
    return '12+'
  }
  if (/senior|lead|staff|principal/i.test(lower)) return '5-8'
  if (/manager|head|director|vp|cto/i.test(lower)) return '8-12'
  return 'Not specified'
}

const EXPERIENCE_MULTIPLIER: Record<string, number> = {
  '0-1': 0.55,
  '0-2': 0.6,
  '1-3': 0.75,
  '3-5': 1.0,
  '5-8': 1.4,
  '8-12': 1.85,
  '12+': 2.3,
  'Not specified': 1.0,
}

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark builder
// ─────────────────────────────────────────────────────────────────────────────

function toLpa(n: number): number {
  // stored value is LPA * 10 (so 8 LPA = 80)
  return n / 10
}

function computeBenchmark(salaries: Array<{ minLpa: number; maxLpa: number }>): Benchmark | null {
  if (salaries.length === 0) return null
  const mids = salaries.map((s) => (s.minLpa + s.maxLpa) / 2).sort((a, b) => a - b)
  const mins = salaries.map((s) => s.minLpa)
  const maxs = salaries.map((s) => s.maxLpa)
  const median = mids[Math.floor(mids.length / 2)]
  const p25 = mids[Math.floor(mids.length * 0.25)]
  const p75 = mids[Math.min(mids.length - 1, Math.floor(mids.length * 0.75))]
  const avg = mids.reduce((a, b) => a + b, 0) / mids.length
  return {
    samples: salaries.length,
    minLpa: Math.min(...mins),
    maxLpa: Math.max(...maxs),
    avgLpa: avg,
    p25Lpa: p25,
    p75Lpa: p75,
    medianLpa: median,
  }
}

async function buildBenchmarkTable(): Promise<BenchmarkTable> {
  const jobs = await db.job.findMany({
    where: {
      AND: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
    },
    select: {
      title: true,
      salaryMin: true,
      salaryMax: true,
      location: true,
      category: true,
      experience: true,
    },
  })

  const byRole = new Map<string, BenchmarkBucket>()
  const byRoleAndExp = new Map<string, BenchmarkBucket>()
  const byRoleAndCity = new Map<string, BenchmarkBucket>()
  const byCategory = new Map<string, BenchmarkBucket>()
  const allSalaries: Array<{ minLpa: number; maxLpa: number }> = []

  for (const job of jobs) {
    const minLpa = toLpa(job.salaryMin!)
    const maxLpa = toLpa(job.salaryMax!)
    if (!isFinite(minLpa) || !isFinite(maxLpa) || minLpa <= 0 || maxLpa <= 0) continue
    const salary = { minLpa, maxLpa }
    allSalaries.push(salary)

    const role = normalizeRole(job.title)
    const exp = normalizeExperience(job.experience)
    const tier = extractCityTier(job.location)
    const cityKey = tier

    const getBucket = (m: Map<string, BenchmarkBucket>, k: string): BenchmarkBucket => {
      let b = m.get(k)
      if (!b) {
        b = { samples: 0, salaries: [] }
        m.set(k, b)
      }
      return b
    }

    getBucket(byRole, role).salaries.push(salary)
    byRole.get(role)!.samples++
    getBucket(byRoleAndExp, `${role}__${exp}`).salaries.push(salary)
    byRoleAndExp.get(`${role}__${exp}`)!.samples++
    getBucket(byRoleAndCity, `${role}__${cityKey}`).salaries.push(salary)
    byRoleAndCity.get(`${role}__${cityKey}`)!.samples++
    const cat = job.category || 'unknown'
    getBucket(byCategory, cat).salaries.push(salary)
    byCategory.get(cat)!.samples++
  }

  const finalize = (m: Map<string, BenchmarkBucket>): Map<string, Benchmark> => {
    const out = new Map<string, Benchmark>()
    for (const [k, v] of m.entries()) {
      const b = computeBenchmark(v.salaries)
      if (b) out.set(k, b)
    }
    return out
  }

  return {
    byRole: finalize(byRole),
    byRoleAndExp: finalize(byRoleAndExp),
    byRoleAndCity: finalize(byRoleAndCity),
    byCategory: finalize(byCategory),
    overall: computeBenchmark(allSalaries),
    builtAt: Date.now(),
  }
}

async function getBenchmarkTable(): Promise<BenchmarkTable> {
  if (CACHE && Date.now() - CACHE.builtAt < CACHE_TTL_MS) {
    return CACHE
  }
  try {
    CACHE = await buildBenchmarkTable()
  } catch (e) {
    console.error('[salary-estimate] Failed to build benchmark table:', e)
    if (!CACHE) {
      // Return an empty table rather than crashing — UI will just hide salaries
      CACHE = {
        byRole: new Map(),
        byRoleAndExp: new Map(),
        byRoleAndCity: new Map(),
        byCategory: new Map(),
        overall: null,
        builtAt: Date.now(),
      }
    }
  }
  return CACHE
}

/**
 * Estimate a salary range for a job that doesn't have one.
 *
 * Returns null when there isn't enough data to produce a confident estimate
 * — in that case the UI hides the salary entirely instead of showing a
 * misleading hardcoded range.
 */
export async function estimateSalaryForJob(job: {
  title: string
  location: string
  experience: string
  category: string
  company?: { name?: string | null } | null
}): Promise<SalaryEstimate | null> {
  const table = await getBenchmarkTable()
  const role = normalizeRole(job.title)
  const exp = normalizeExperience(job.experience)
  const tier = extractCityTier(job.location)

  // Try most-specific first, fall back to broader buckets.
  // We require at least 3 samples in a bucket to trust it.
  const candidates: Array<{ benchmark: Benchmark; confidence: 'high' | 'medium' | 'low'; basis: string }> = []

  const reKey = `${role}__${exp}`
  const reBenchmark = table.byRoleAndExp.get(reKey)
  if (reBenchmark && reBenchmark.samples >= 3 && role !== 'Other') {
    candidates.push({
      benchmark: reBenchmark,
      confidence: 'high',
      basis: `${role} with ${exp} years experience (${reBenchmark.samples} similar listings)`,
    })
  }

  const rcKey = `${role}__${tier}`
  const rcBenchmark = table.byRoleAndCity.get(rcKey)
  if (rcBenchmark && rcBenchmark.samples >= 3 && role !== 'Other') {
    candidates.push({
      benchmark: rcBenchmark,
      confidence: candidates.length === 0 ? 'high' : 'medium',
      basis: `${role} in ${tier} cities (${rcBenchmark.samples} similar listings)`,
    })
  }

  const roleBenchmark = table.byRole.get(role)
  if (roleBenchmark && roleBenchmark.samples >= 5 && role !== 'Other') {
    candidates.push({
      benchmark: roleBenchmark,
      confidence: candidates.length === 0 ? 'medium' : 'low',
      basis: `${role} overall (${roleBenchmark.samples} similar listings)`,
    })
  }

  // CRITICAL: We deliberately do NOT fall back to the category-based benchmark
  // or the "Other" role bucket. Doing so would produce the same generic
  // estimate (₹8-15 LPA) for very different jobs — "VP Business Head" and
  // "Lead Clocking Design Engineer" would both show the same range, which
  // is misleading and damages platform credibility.
  //
  // When we don't have enough role-specific data, we return null and the UI
  // hides the salary entirely. This is the user's explicit preference:
  // "either show real data based on the actual job, or don't show salary."

  if (candidates.length === 0) {
    // Not enough role-specific data — return null so UI hides salary entirely
    return null
  }

  // Use the highest-confidence candidate
  const best = candidates[0]
  const baseMedian = best.benchmark.medianLpa

  // Apply experience multiplier ONLY when we're not already using a role+exp benchmark
  // (otherwise the multiplier would double-count, since the benchmark is already filtered by exp)
  const expMultiplier = candidates[0].confidence === 'high' && reBenchmark
    ? 1.0 // benchmark already includes the experience filter
    : EXPERIENCE_MULTIPLIER[exp] ?? 1.0

  // Apply city tier multiplier ONLY when we're not already using a role+city benchmark
  const cityMultiplier = best.basis.includes('in tier') || best.basis.includes('in remote')
    ? 1.0 // benchmark already includes the city filter
    : CITY_TIER_MULTIPLIER[tier]

  // Apply company-tier multiplier for known tier-1 employers (Stripe, Google, etc.)
  // This corrects the gross underestimate where a generic SDE benchmark of
  // ₹10 LPA median would be applied to a Stripe SDE role (actual: ₹30-50+ LPA).
  const companyTier = getCompanyTierMultiplier(job.company?.name)
  const companyMultiplier = companyTier?.multiplier ?? 1.0

  let adjustedMedian = baseMedian * expMultiplier * cityMultiplier * companyMultiplier

  // For tier-1 employers, ensure the estimate doesn't fall below the
  // company's floor (minLpa) — those companies simply don't pay below
  // that floor for full-time engineering roles in India.
  if (companyTier && adjustedMedian < companyTier.minLpa) {
    adjustedMedian = companyTier.minLpa
  }
  // Also enforce an upper cap so we don't publish absurd numbers
  if (companyTier && adjustedMedian > companyTier.maxLpa) {
    adjustedMedian = companyTier.maxLpa
  }

  // Build a range with reasonable spread:
  // - For high confidence, use a tighter band (±15% around median)
  // - For medium confidence, wider band (±22%)
  // - For low confidence, even wider (±30%)
  // - For tier-1 employers, widen the band to ±25% (their bands are wider)
  const baseSpread = best.confidence === 'high' ? 0.15 : best.confidence === 'medium' ? 0.22 : 0.30
  const spread = companyTier ? Math.max(baseSpread, 0.25) : baseSpread
  let estimatedMin = adjustedMedian * (1 - spread)
  let estimatedMax = adjustedMedian * (1 + spread)

  // For tier-1 employers, ensure min doesn't fall below the floor
  if (companyTier) {
    estimatedMin = Math.max(estimatedMin, companyTier.minLpa)
  }

  // Round to nearest 0.5 LPA for cleaner display
  const roundToHalf = (n: number) => Math.round(n * 2) / 2
  const finalMin = Math.max(1, roundToHalf(estimatedMin))
  const finalMax = Math.max(finalMin + 0.5, roundToHalf(estimatedMax))

  // Build the basis description — include company-tier context when applicable
  let basis = best.basis
  if (companyTier) {
    basis += `, adjusted for ${job.company?.name}'s known compensation tier`
  }

  return {
    min: Math.round(finalMin * 10), // convert back to LPA*10 for DB convention
    max: Math.round(finalMax * 10),
    confidence: best.confidence,
    basis,
  }
}

/**
 * Reset the in-memory cache. Useful for tests or after a bulk import.
 */
export function resetSalaryCache(): void {
  CACHE = null
}
