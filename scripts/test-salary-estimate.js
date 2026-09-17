/**
 * Verify salary estimation works for the AI Engineer job and a few others
 * that previously had no salary data.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Test jobs with no salary
  const testJobs = await prisma.job.findMany({
    where: { AND: [{ salaryMin: null }, { salaryMax: null }] },
    include: { company: true },
    take: 10,
  })

  console.log(`Testing ${testJobs.length} jobs with null salary\n`)

  // Pull all salary data so we can simulate the estimator
  const allJobs = await prisma.job.findMany({
    where: { AND: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }] },
    select: {
      title: true, salaryMin: true, salaryMax: true,
      location: true, category: true, experience: true,
    },
  })

  console.log(`Have ${allJobs.length} jobs with salary data for benchmarking\n`)

  // Helper functions (mirror of src/lib/salary-estimate.ts)
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
  ]
  const normalizeRole = (title) => {
    if (!title) return 'Other'
    for (const { pattern, canonical } of ROLE_PATTERNS) {
      if (pattern.test(title)) return canonical
    }
    return 'Other'
  }
  const toLpa = (n) => n / 10

  // Group by role to see benchmark
  const byRole = new Map()
  for (const j of allJobs) {
    const role = normalizeRole(j.title)
    const mid = (toLpa(j.salaryMin) + toLpa(j.salaryMax)) / 2
    if (!byRole.has(role)) byRole.set(role, { count: 0, mids: [] })
    byRole.get(role).count++
    byRole.get(role).mids.push(mid)
  }

  console.log('=== Salary benchmarks by role ===')
  for (const [role, v] of byRole.entries()) {
    const sorted = v.mids.sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    console.log(`  ${role}: ${v.count} samples, min=${min.toFixed(1)}, median=${median.toFixed(1)}, max=${max.toFixed(1)} LPA`)
  }

  // Now show what the estimator would produce for each test job
  console.log('\n=== Estimation for jobs with null salary ===')
  for (const job of testJobs) {
    const role = normalizeRole(job.title)
    const benchmark = byRole.get(role)
    if (benchmark) {
      const sorted = benchmark.mids.sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      console.log(`  ${job.title} @ ${job.company.name} (exp: ${job.experience}, loc: ${job.location})`)
      console.log(`    → role: ${role}, ${benchmark.count} samples, median ${median.toFixed(1)} LPA`)
      console.log(`    → estimated range: ₹${(median * 0.85).toFixed(1)} – ₹${(median * 1.15).toFixed(1)} LPA`)
    } else {
      console.log(`  ${job.title} @ ${job.company.name} → role: ${role}, no benchmark available`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
