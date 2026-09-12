const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()
async function main() {
  const jobs = await prisma.job.findMany({
    where: { applyUrl: null, verified: true },
    select: { id: true, title: true, source: true, sourceRef: true, company: { select: { name: true } } },
    take: 10,
  })
  for (const j of jobs) {
    console.log(`${j.title} @ ${j.company.name} — source: ${j.source}, sourceRef: ${j.sourceRef}`)
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
