const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function main() {
  const urls = [
    'https://in.linkedin.com/jobs/view/senior-economist-at-brickwork-ratings-4464866719',
    'https://in.linkedin.com/jobs/view/cable-technician-at-slb-4429483422',
    'https://in.linkedin.com/jobs/view/accountant-at-synthocure-pharma-llp-4465106390',
    'https://in.linkedin.com/jobs/view/tc-cs-crcr-ai-risk-and-compliance-manager-at-ey-4463491218',
  ]
  
  for (const url of urls) {
    const existing = await prisma.job.findFirst({
      where: { applyUrl: url },
      select: { id: true, title: true },
    })
    console.log(`${existing ? 'DUPE' : 'NEW'}: ${url.split('/').pop()} → ${existing ? existing.title : 'not in DB'}`)
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
