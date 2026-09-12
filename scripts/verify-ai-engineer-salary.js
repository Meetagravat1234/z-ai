/**
 * Quick verification: call estimateSalaryForJob for the AI Engineer job
 * and a few others to confirm the estimator produces sensible output
 * (or correctly returns null when there isn't enough data).
 */
require('dotenv').config({ path: '.env' })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Inline copies of the estimator's role normalizer & city tier extractor
const ROLE_PATTERNS = [
  { pattern: /staff|principal|distinguished/i, canonical: 'Staff/Principal Engineer' },
  { pattern: /senior.*software|sr\.?\s*software|sde.?3|sde.?iii|software engineer\s*iii|senior.*developer|sr\.?\s*developer/i, canonical: 'Senior Software Engineer' },
  { pattern: /software engineer|sde|software developer|developer/i, canonical: 'Software Engineer' },
  { pattern: /frontend|front.?end|react|ui developer|ui.?engineer/i, canonical: 'Frontend Engineer' },
  { pattern: /backend|back.?end|api|server|node|django|spring/i, canonical: 'Backend Engineer' },
  { pattern: /full.?stack/i, canonical: 'Full Stack Engineer' },
  { pattern: /devops|sre|site reliability|platform engineer|infrastructure/i, canonical: 'DevOps/SRE' },
  { pattern: /data scientist|ml engineer|machine learning|ai engineer|ai scientist|deep learning/i, canonical: 'ML/Data Engineer' },
  { pattern: /data engineer|data analyst|analytics/i, canonical: 'Data Engineer/Analyst' },
  { pattern: /product manager/i, canonical: 'Product Manager' },
  { pattern: /designer|ux|ui\/ux|graphic/i, canonical: 'Designer' },
  { pattern: /qa|test|automation|sdet/i, canonical: 'QA Engineer' },
  { pattern: /architect/i, canonical: 'Architect' },
  { pattern: /engineering manager|tech lead|tech manager|team lead|lead developer|lead engineer/i, canonical: 'Engineering Manager' },
  { pattern: /intern/i, canonical: 'Intern' },
  { pattern: /fresher|entry|graduate/i, canonical: 'Fresher' },
  { pattern: /marketing|seo|content|growth/i, canonical: 'Marketing' },
  { pattern: /sales|business development|bde|account executive/i, canonical: 'Sales' },
]
const normalizeRole = (t) => {
  for (const { pattern, canonical } of ROLE_PATTERNS) {
    if (pattern.test(t)) return canonical
  }
  return 'Other'
}

async function main() {
  // The AI Engineer job
  const aiJob = await prisma.job.findUnique({
    where: { id: 'cmtyrcbcr0047moxauiywjve3' },
    include: { company: true },
  })
  console.log('\n=== AI Engineer Job ===')
  console.log({
    title: aiJob.title,
    location: aiJob.location,
    experience: aiJob.experience,
    category: aiJob.category,
    salaryMin: aiJob.salaryMin,
    salaryMax: aiJob.salaryMax,
    applyUrl: aiJob.applyUrl,
  })
  console.log(`Normalized role: ${normalizeRole(aiJob.title)}`)

  // Get benchmark for ML/Data Engineer role
  const mlJobs = await prisma.job.findMany({
    where: {
      AND: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
    },
    select: { title: true, salaryMin: true, salaryMax: true, location: true, experience: true, category: true },
  })
  console.log(`\nTotal jobs with salary data: ${mlJobs.length}`)
  // Group by role to see what the AI Engineer would match against
  const byRole = {}
  for (const j of mlJobs) {
    const role = normalizeRole(j.title)
    if (!byRole[role]) byRole[role] = []
    byRole[role].push({
      title: j.title,
      min: j.salaryMin / 10,
      max: j.salaryMax / 10,
      loc: j.location,
      exp: j.experience,
    })
  }
  console.log('\n=== Benchmark by role ===')
  for (const [role, jobs] of Object.entries(byRole)) {
    console.log(`\n${role} (${jobs.length} samples):`)
    for (const j of jobs.slice(0, 3)) {
      console.log(`  ${j.title}: ₹${j.min}-${j.max} LPA (${j.exp}, ${j.loc})`)
    }
  }

  // For the AI Engineer: role = "ML/Data Engineer", only 1 sample → won't pass >=5 threshold
  // Then fallback to category (need >=5 samples)
  const aiCategory = aiJob.category
  console.log(`\n=== AI Engineer category: ${aiCategory} ===`)
  const catJobs = mlJobs.filter(j => j.category === aiCategory)
  console.log(`Found ${catJobs.length} jobs in same category`)
  if (catJobs.length >= 5) {
    const mids = catJobs.map(j => (j.salaryMin + j.salaryMax) / 20).sort((a, b) => a - b)
    const median = mids[Math.floor(mids.length / 2)]
    console.log(`Median: ${median} LPA, est range: ₹${(median * 0.7).toFixed(1)} – ₹${(median * 1.3).toFixed(1)} LPA (low confidence)`)
  } else {
    console.log('Not enough category samples — salary will be HIDDEN on UI (no estimate shown)')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
