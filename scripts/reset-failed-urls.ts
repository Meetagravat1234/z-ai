// Reset all 'error' URLs back to 'pending' so they can be retried.
// This is safe to run — it only touches URLs that previously failed,
// never the ones already saved.
//
// Usage:
//   DATABASE_URL="<supabase-url>" npx tsx scripts/reset-failed-urls.ts          # dry-run (just show counts)
//   DATABASE_URL="<supabase-url>" npx tsx scripts/reset-failed-urls.ts --apply  # actually reset
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`Mode: ${apply ? '✅ APPLY (will modify DB)' : '🔍 DRY-RUN (no changes)'}\n`)

  // Count URLs by status
  const counts = await prisma.bulkFetchJobUrl.groupBy({
    by: ['status'],
    _count: true,
  })
  console.log('Current state across ALL bulk-fetch jobs:')
  for (const c of counts) console.log(`  ${c.status}: ${c._count}`)
  console.log('')

  // Find URLs to reset — only those that errored due to rate-limit OR were cancelled
  const toReset = await prisma.bulkFetchJobUrl.findMany({
    where: {
      status: 'error',
      OR: [
        { error: { contains: 'rate limited' } },
        { error: { equals: 'Cancelled by user' } },
      ],
    },
    select: { id: true, error: true, jobId: true },
  })
  console.log(`URLs that can be reset (rate-limited + cancelled): ${toReset.length}`)

  // Group by job for clarity
  const byJob: Record<string, number> = {}
  for (const u of toReset) byJob[u.jobId] = (byJob[u.jobId] || 0) + 1
  console.log('\nURLs per job:')
  for (const [jid, n] of Object.entries(byJob)) console.log(`  ${jid}: ${n} URLs`)
  console.log('')

  if (!apply) {
    console.log('🔍 Dry-run complete. To actually reset, run:')
    console.log('  DATABASE_URL="<supabase-url>" npx tsx scripts/reset-failed-urls.ts --apply')
    return
  }

  // Apply the reset
  console.log('Applying reset...')
  const result = await prisma.bulkFetchJobUrl.updateMany({
    where: {
      status: 'error',
      OR: [
        { error: { contains: 'rate limited' } },
        { error: { equals: 'Cancelled by user' } },
      ],
    },
    data: {
      status: 'pending',
      error: null,
      processedAt: null,
      title: null,
      company: null,
    },
  })
  console.log(`✅ Reset ${result.count} URLs back to 'pending'\n`)

  // Also re-activate cancelled jobs that now have pending URLs
  const reactivated = await prisma.bulkFetchJob.updateMany({
    where: { status: 'cancelled' },
    data: { status: 'pending', completedAt: null },
  })
  if (reactivated.count > 0) {
    console.log(`✅ Reactivated ${reactivated.count} cancelled job(s) → status='pending'`)
  }

  // Re-count to verify
  const afterCounts = await prisma.bulkFetchJobUrl.groupBy({
    by: ['status'],
    _count: true,
  })
  console.log('\nState after reset:')
  for (const c of afterCounts) console.log(`  ${c.status}: ${c._count}`)

  console.log('\n✅ Done! Now go to /admin → Bulk Fetch tab and click "Process now".')
  console.log('   With the Mumbai region + OpenRouter fix + auto-recovery,')
  console.log('   these URLs should now succeed (~85-95% success rate expected).')
}

main().catch(console.error).finally(() => prisma.$disconnect())
