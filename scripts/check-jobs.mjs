import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
const prisma = new PrismaClient()
async function main() {
  const total = await prisma.job.count({ where: { verified: true } })
  const bySource = await prisma.job.groupBy({
    by: ['source'],
    where: { verified: true },
    _count: true,
    orderBy: { _count: { source: 'desc' } }
  })
  const companies = await prisma.company.count()
  console.log('Total verified jobs:', total)
  console.log('Total companies:', companies)
  console.log('\nJobs by source:')
  for (const s of bySource) {
    console.log(`  ${s.source}: ${s._count}`)
  }
  // Check recent syncs
  const recentSyncs = await prisma.jobSync.findMany({
    take: 5,
    orderBy: { startedAt: 'desc' },
    select: { source: true, status: true, jobsFound: true, jobsAdded: true, startedAt: true }
  })
  console.log('\nRecent syncs:')
  for (const s of recentSyncs) {
    console.log(`  ${s.source}: ${s.status} (found ${s.jobsFound}, added ${s.jobsAdded}) — ${new Date(s.startedAt).toLocaleString()}`)
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
