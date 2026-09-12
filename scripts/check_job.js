const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const job = await prisma.job.findUnique({
    where: { id: 'cmtyrcbcr0047moxauiywjve3' },
    include: { company: true }
  })
  if (!job) {
    console.log('JOB NOT FOUND')
    return
  }
  console.log(JSON.stringify({
    id: job.id,
    title: job.title,
    applyUrl: job.applyUrl,
    source: job.source,
    sourceRef: job.sourceRef,
    company: job.company.name,
    location: job.location,
    experience: job.experience,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    descriptionLength: job.description?.length,
    descriptionPreview: job.description?.slice(0, 800)
  }, null, 2))
  
  // Also check how many jobs have null applyUrl
  const stats = await prisma.job.groupBy({
    by: ['source'],
    where: { applyUrl: null },
    _count: true,
  })
  console.log('\nJobs with null applyUrl by source:')
  console.log(JSON.stringify(stats, null, 2))
  
  const totalNull = await prisma.job.count({ where: { applyUrl: null } })
  const total = await prisma.job.count()
  console.log(`\nTotal jobs with null applyUrl: ${totalNull} / ${total}`)
  
  // Sample some null applyUrl jobs to see what source they are
  const sample = await prisma.job.findMany({
    where: { applyUrl: null },
    select: { id: true, title: true, source: true, company: { select: { name: true, website: true } } },
    take: 10,
  })
  console.log('\nSample jobs with null applyUrl:')
  console.log(JSON.stringify(sample, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
