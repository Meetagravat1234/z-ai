import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== BEFORE CLEANUP ===')
  console.log('  JobSync logs:', await prisma.jobSync.count())
  console.log('  BulkFetchJobUrl:', await prisma.bulkFetchJobUrl.count())
  console.log('  BulkFetchJob:', await prisma.bulkFetchJob.count())
  console.log('  Jobs with originalDescription:', await prisma.job.count({ where: { NOT: { originalDescription: null } } }))

  // 1. Delete old sync logs (>7 days)
  const r1 = await prisma.jobSync.deleteMany({ where: { startedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
  console.log('\n✅ Deleted', r1.count, 'old sync logs')

  // 2. Delete cancelled bulk fetch jobs + their URLs
  const cancelledJobs = await prisma.bulkFetchJob.findMany({ where: { status: 'cancelled' }, select: { id: true } })
  if (cancelledJobs.length > 0) {
    const r2 = await prisma.bulkFetchJobUrl.deleteMany({ where: { jobId: { in: cancelledJobs.map((j) => j.id) } } })
    console.log('✅ Deleted', r2.count, 'URLs from cancelled bulk jobs')
    const r3 = await prisma.bulkFetchJob.deleteMany({ where: { status: 'cancelled' } })
    console.log('✅ Deleted', r3.count, 'cancelled bulk jobs')
  }

  // 3. Delete error URLs older than 3 days
  const r4 = await prisma.bulkFetchJobUrl.deleteMany({
    where: { status: 'error', processedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
  })
  console.log('✅ Deleted', r4.count, 'old error URLs')

  // 4. Remove originalDescription (saves ~5 MB storage + egress)
  const r5 = await prisma.job.updateMany({ where: { NOT: { originalDescription: null } }, data: { originalDescription: null } })
  console.log('✅ Cleared originalDescription from', r5.count, 'jobs (saves ~5 MB)')

  console.log('\n=== AFTER CLEANUP ===')
  console.log('  JobSync logs:', await prisma.jobSync.count())
  console.log('  BulkFetchJobUrl:', await prisma.bulkFetchJobUrl.count())
  console.log('  BulkFetchJob:', await prisma.bulkFetchJob.count())
  console.log('  Jobs with originalDescription:', await prisma.job.count({ where: { NOT: { originalDescription: null } } }))

  console.log('\n🎉 Cleanup complete! This should free up significant space.')
  console.log('   Go to Supabase Dashboard → Settings → Usage to see updated numbers.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
