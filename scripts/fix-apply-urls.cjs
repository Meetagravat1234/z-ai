const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function main() {
  // Get all jobs with no applyUrl
  const jobs = await prisma.job.findMany({
    where: { applyUrl: null, verified: true },
    select: { id: true, source: true, sourceRef: true, companyId: true },
    take: 100,
  })
  
  let fixed = 0
  for (const job of jobs) {
    let applyUrl = null
    
    if (job.source === 'ashby' && job.sourceRef) {
      // Ashby jobs have sourceRef like "ashby-{uuid}" — the UUID is the job ID
      // Ashby job URLs: https://ashbyhq.com/api/posting-api/job-board/{company}/jobs/{id}
      // But we don't have the company slug. Set applyUrl to the sourceRef as-is.
      // The Ashby posting URL format is: https://boards.ashbyhq.com/{company}/{jobId}
      // Since we don't have the company slug, set it to a search on the company name
      const company = await prisma.company.findUnique({
        where: { id: job.companyId },
        select: { name: true, slug: true },
      })
      if (company) {
        applyUrl = `https://boards.ashbyhq.com/${company.slug}`
      }
    } else if (job.source === 'greenhouse' && job.sourceRef) {
      // Greenhouse sourceRef is the greenhouse job ID
      // URL format: https://boards.greenhouse.io/{company}/jobs/{id}
      const company = await prisma.company.findUnique({
        where: { id: job.companyId },
        select: { name: true, slug: true },
      })
      if (company) {
        applyUrl = `https://boards.greenhouse.io/${company.slug}/jobs/${job.sourceRef}`
      }
    }
    
    if (applyUrl) {
      await prisma.job.update({
        where: { id: job.id },
        data: { applyUrl },
      })
      fixed++
    }
  }
  
  console.log(`Fixed ${fixed} applyUrls out of ${jobs.length} jobs`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
