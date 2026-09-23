// Find URLs that errored BEFORE cancel (with real error messages, not "Cancelled by user")
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('════════════════════════════════════════════════════════════')
  console.log('  REAL ERRORS (NOT cancelled-by-user)')
  console.log('════════════════════════════════════════════════════════════\n')

  const realErrors = await prisma.bulkFetchJobUrl.findMany({
    where: {
      status: 'error',
      error: { not: 'Cancelled by user' },
    },
    orderBy: { id: 'desc' },
    take: 20,
    select: { url: true, error: true, processedAt: true },
  })

  if (realErrors.length === 0) {
    console.log('  No real errors found — all errors are from cancel.\n')
    return
  }

  // Group by error message
  const byError: Record<string, number> = {}
  for (const u of realErrors) {
    const key = (u.error || '(none)').slice(0, 80)
    byError[key] = (byError[key] || 0) + 1
  }
  console.log('Error distribution (top 20):')
  for (const [err, count] of Object.entries(byError).sort((a,b)=>b[1]-a[1])) {
    console.log(`  [${count}x] ${err}`)
  }
  console.log('')

  // Show 5 sample URLs
  console.log('Sample real-error URLs:')
  for (const u of realErrors.slice(0, 5)) {
    console.log(`  URL: ${u.url.slice(0, 100)}`)
    console.log(`  processedAt: ${u.processedAt?.toISOString() || 'null'}`)
    console.log(`  error: ${u.error || '(none)'}`)
    console.log('')
  }

  // Count totals
  const cancelled = await prisma.bulkFetchJobUrl.count({
    where: { status: 'error', error: 'Cancelled by user' },
  })
  const realErrCount = await prisma.bulkFetchJobUrl.count({
    where: { status: 'error', error: { not: 'Cancelled by user' } },
  })
  const saved = await prisma.bulkFetchJobUrl.count({ where: { status: 'saved' } })
  const dup = await prisma.bulkFetchJobUrl.count({ where: { status: 'duplicate' } })
  const pending = await prisma.bulkFetchJobUrl.count({ where: { status: 'pending' } })

  console.log('════════════════════════════════════════════════════════════')
  console.log('  GRAND TOTALS')
  console.log('════════════════════════════════════════════════════════════\n')
  console.log(`  saved:       ${saved}`)
  console.log(`  duplicate:   ${dup}`)
  console.log(`  pending:     ${pending}`)
  console.log(`  error (real): ${realErrCount}`)
  console.log(`  error (cancelled): ${cancelled}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
