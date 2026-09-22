// Diagnostic + recovery script for stuck bulk-fetch URLs.
// Run with: npx tsx scripts/diagnose-bulk-fetch.ts
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main() {
  console.log('══════════════════════════════════════════════════════════')
  console.log('  BULK FETCH DIAGNOSTIC REPORT')
  console.log('══════════════════════════════════════════════════════════\n')

  // 1. List all bulk fetch jobs
  const jobs = await prisma.bulkFetchJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      status: true,
      totalUrls: true,
      processedCount: true,
      savedCount: true,
      duplicateCount: true,
      failedCount: true,
      createdAt: true,
      completedAt: true,
    },
  })

  console.log('Last 10 BulkFetchJobs:\n')
  for (const j of jobs) {
    console.log(`  Job ${j.id}`)
    console.log(`    status:         ${j.status}`)
    console.log(`    total:          ${j.totalUrls}`)
    console.log(`    processed:      ${j.processedCount} (saved=${j.savedCount} dup=${j.duplicateCount} err=${j.failedCount})`)
    console.log(`    createdAt:      ${j.createdAt.toISOString()}`)
    if (j.completedAt) console.log(`    completedAt:    ${j.completedAt.toISOString()}`)
    console.log('')
  }

  // 2. For each non-completed job, count URL statuses
  console.log('══════════════════════════════════════════════════════════')
  console.log('  URL STATUS BREAKDOWN (per job)')
  console.log('══════════════════════════════════════════════════════════\n')
  for (const j of jobs) {
    const counts = await prisma.bulkFetchJobUrl.groupBy({
      by: ['status'],
      where: { jobId: j.id },
      _count: true,
    })
    const map: Record<string, number> = {}
    for (const c of counts) map[c.status] = c._count
    console.log(`Job ${j.id} (${j.status}):`)
    console.log(`   pending:     ${map['pending'] || 0}`)
    console.log(`   processing:  ${map['processing'] || 0}  ⚠️ stuck if > 0`)
    console.log(`   saved:       ${map['saved'] || 0}`)
    console.log(`   duplicate:   ${map['duplicate'] || 0}`)
    console.log(`   error:       ${map['error'] || 0}`)
    console.log('')
  }

  // 3. List the oldest stuck 'processing' URLs
  console.log('══════════════════════════════════════════════════════════')
  console.log('  STUCK URLS (oldest first, max 10)')
  console.log('══════════════════════════════════════════════════════════\n')
  const stuck = await prisma.bulkFetchJobUrl.findMany({
    where: { status: 'processing' },
    orderBy: { id: 'asc' },
    take: 10,
    select: { id: true, url: true, processedAt: true, jobId: true },
  })
  if (stuck.length === 0) {
    console.log('   ✅ No stuck URLs found.\n')
  } else {
    for (const u of stuck) {
      const age = u.processedAt
        ? Math.round((Date.now() - u.processedAt.getTime()) / 1000 / 60) + ' min ago'
        : 'null (old code, never set)'
      console.log(`   ${u.id} | job=${u.jobId}`)
      console.log(`     url: ${u.url.slice(0, 100)}`)
      console.log(`     processedAt: ${age}`)
      console.log('')
    }
  }

  // 4. Check if the new "Recover stuck" code has been deployed
  console.log('══════════════════════════════════════════════════════════')
  console.log('  RECOVERY OPTIONS')
  console.log('══════════════════════════════════════════════════════════\n')

  const stuckCount = await prisma.bulkFetchJobUrl.count({ where: { status: 'processing' } })
  const pendingCount = await prisma.bulkFetchJobUrl.count({ where: { status: 'pending' } })

  if (stuckCount === 0 && pendingCount === 0) {
    console.log('   ✅ Nothing to recover. All URLs are in final states (saved/duplicate/error).\n')
    return
  }

  console.log(`   Found ${stuckCount} stuck 'processing' URLs.`)
  console.log(`   Found ${pendingCount} 'pending' URLs.`)
  console.log('')
  console.log('   To recover NOW (without waiting for Vercel deploy):')
  console.log('   Run: npx tsx scripts/diagnose-bulk-fetch.ts --recover')
}

async function recover() {
  console.log('══════════════════════════════════════════════════════════')
  console.log('  RECOVERING STUCK URLS')
  console.log('══════════════════════════════════════════════════════════\n')

  // Reset all 'processing' URLs back to 'pending'
  const result = await prisma.bulkFetchJobUrl.updateMany({
    where: { status: 'processing' },
    data: { status: 'pending', error: null, processedAt: null },
  })
  console.log(`✅ Recovered ${result.count} stuck URL(s) — reset to 'pending'\n`)

  // Also unfreeze any jobs stuck in 'processing' state
  const jobResult = await prisma.bulkFetchJob.updateMany({
    where: { status: 'processing' },
    data: { status: 'pending' },
  })
  if (jobResult.count > 0) {
    console.log(`✅ Unfroze ${jobResult.count} stuck job(s) — reset to 'pending'\n`)
  }

  // Verify
  const remaining = await prisma.bulkFetchJobUrl.count({ where: { status: 'processing' } })
  console.log(`Remaining stuck URLs: ${remaining}`)
  console.log('\nDone. Go to /admin → Bulk Fetch tab and click "Process now" to resume.')
}

// Entry point — handle --recover flag
const shouldRecover = process.argv.includes('--recover')
main()
  .then(() => shouldRecover ? recover() : null)
  .catch((e) => { console.error('ERROR:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
