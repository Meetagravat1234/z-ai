/**
 * Verify the salary estimator now produces sensible output for tier-1 employers.
 * Previously: Stripe SDE → ₹8-11 LPA (way too low, generic fresher benchmark)
 * Expected:  Stripe SDE → ₹25-40+ LPA (with company-tier multiplier applied)
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Mirror of cleanJobTitle from seo-routes.ts
function cleanJobTitle(title, companyName) {
  if (!title) return ''
  let cleaned = title.trim()
  if (companyName) {
    const company = companyName.trim()
    if (company) {
      const esc = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const patterns = [
        new RegExp(`\\s+at\\s+${esc}\\s*$`, 'i'),
        new RegExp(`\\s*\\|\\s*${esc}\\s*$`, 'i'),
        new RegExp(`\\s*-\\s*${esc}\\s*$`, 'i'),
      ]
      for (const p of patterns) cleaned = cleaned.replace(p, '')
    }
  }
  const generic = cleaned.match(/^(.+?)\s+at\s+[A-Z][\w&.\s-]{1,40}$/)
  if (generic && generic[1].trim().length >= 3) {
    cleaned = generic[1].trim()
  }
  return cleaned.trim()
}

// Mirror of TIER1_EMPLOYER_MULTIPLIER from salary-estimate.ts
const TIER1 = [
  { pattern: /\b(stripe|openai|anthropic|nvidia|databricks|snowflake)\b/i, multiplier: 3.2, minLpa: 25 },
  { pattern: /\b(google|alphabet|microsoft|amazon|meta|facebook|apple|netflix|adobe)\b/i, multiplier: 2.5, minLpa: 18 },
  { pattern: /\b(uber|airbnb|linkedin|salesforce|oracle|vmware|cisco|intel)\b/i, multiplier: 2.2, minLpa: 15 },
  { pattern: /\b(flipkart|swiggy|zomato|razorpay|phonepe|cred|zepto|browserstack|freshworks|zoho|postman)\b/i, multiplier: 1.7, minLpa: 12 },
  { pattern: /\b(tcs|infosys|wipro|hcl|tech mahindra|cognizant|capgemini|accenture|ibm|deloitte)\b/i, multiplier: 0.85, minLpa: 3 },
]

function getTier(name) {
  for (const t of TIER1) {
    if (t.pattern.test(name)) return t
  }
  return null
}

async function main() {
  console.log('\n=== Test: cleanJobTitle ===')
  const testCases = [
    ['Software Engineer at Stripe', 'Stripe', 'Software Engineer'],
    ['Software Engineer at Stripe', null, 'Software Engineer'],
    ['Software Engineer', 'Stripe', 'Software Engineer'],
    ['Backend Engineer at Razorpay', 'Razorpay', 'Backend Engineer'],
    ['Senior Product Manager', 'Google', 'Senior Product Manager'],
    ['SDE II at Amazon Web Services', 'Amazon', 'SDE II at Amazon Web Services'], // should NOT strip Amazon since AWS != Amazon
    ['Frontend Engineer at Google', 'Google', 'Frontend Engineer'],
  ]
  let pass = 0, fail = 0
  for (const [title, company, expected] of testCases) {
    const result = cleanJobTitle(title, company)
    const ok = result === expected
    if (ok) pass++
    else fail++
    console.log(`${ok ? '✓' : '✗'} cleanJobTitle(${JSON.stringify(title)}, ${JSON.stringify(company)}) = ${JSON.stringify(result)} (expected: ${JSON.stringify(expected)})`)
  }
  console.log(`\n${pass} passed, ${fail} failed`)

  console.log('\n=== Test: Tier-1 employer salary multiplier ===')
  // Find real jobs in DB from tier-1 employers
  const tier1Companies = ['Stripe', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Adobe', 'Flipkart', 'Swiggy', 'Zomato', 'Razorpay', 'PhonePe', 'Uber', 'Airbnb', 'LinkedIn', 'Netflix', 'OpenAI']
  const jobs = await prisma.job.findMany({
    where: {
      AND: [{ salaryMin: null }, { salaryMax: null }],
      company: { name: { in: tier1Companies } },
    },
    include: { company: true },
    take: 10,
  })
  console.log(`Found ${jobs.length} jobs without salary at tier-1 companies`)
  for (const job of jobs) {
    const tier = getTier(job.company.name)
    if (tier) {
      // Get the role benchmark median
      const rolePattern = /software engineer|sde|developer/i
      const roleBenchmark = rolePattern.test(job.title) ? 14 : 11.5 // approx median from our DB
      const adjusted = Math.max(roleBenchmark * tier.multiplier, tier.minLpa)
      console.log(`  ${job.title} @ ${job.company.name}`)
      console.log(`    → tier: ${tier.multiplier}x multiplier, min floor: ${tier.minLpa} LPA`)
      console.log(`    → estimated median: ${adjusted.toFixed(1)} LPA`)
      console.log(`    → estimated range: ₹${(adjusted * 0.75).toFixed(1)} – ₹${(adjusted * 1.25).toFixed(1)} LPA`)
    } else {
      console.log(`  ${job.title} @ ${job.company.name} — no tier match (unexpected)`)
    }
  }

  console.log('\n=== Test: cleanJobTitle applied to existing DB jobs ===')
  const allJobs = await prisma.job.findMany({
    where: { title: { contains: ' at ', mode: 'insensitive' } },
    include: { company: true },
    take: 5,
  })
  for (const job of allJobs) {
    const cleaned = cleanJobTitle(job.title, job.company.name)
    console.log(`  ${JSON.stringify(job.title)} @ ${job.company.name}`)
    console.log(`    → cleaned: ${JSON.stringify(cleaned)}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
