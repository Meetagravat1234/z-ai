import { PrismaClient } from '@prisma/client'
import { classifyJobDomain } from '../src/lib/job-domains'
const prisma = new PrismaClient()

async function main() {
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true, skills: true, domain: true },
  })

  console.log(`Backfilling ${jobs.length} jobs with domain classification...`)

  const domainCounts: Record<string, number> = {}
  let updated = 0

  for (const job of jobs) {
    const domain = classifyJobDomain(job.title, job.skills || '')
    domainCounts[domain] = (domainCounts[domain] || 0) + 1

    // Only update if domain changed
    if (job.domain !== domain) {
      await prisma.job.update({
        where: { id: job.id },
        data: { domain },
      })
      updated++
    }
  }

  console.log(`\n✅ Updated ${updated} jobs`)
  console.log('\nDomain distribution:')
  for (const [d, n] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${d}: ${n}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
