// Check what's REALLY happening with the URLs from the screenshot
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Find any URL containing 'linkedin' that's currently in 'processing' state
  console.log('════════════════════════════════════════════════════════════')
  console.log('  LINKEDIN URLS IN "PROCESSING" STATE')
  console.log('════════════════════════════════════════════════════════════\n')
  const processing = await prisma.bulkFetchJobUrl.findMany({
    where: { status: 'processing', url: { contains: 'linkedin' } },
    take: 20,
    select: { id: true, url: true, status: true, processedAt: true, error: true, jobId: true },
  })
  if (processing.length === 0) {
    console.log('  ✅ NO LinkedIn URLs are currently in "processing" state in the DB.')
    console.log('     The "Processing..." badges you see in the UI are STALE BROWSER CACHE.\n')
  } else {
    for (const u of processing) {
      console.log(`  ${u.id} | status=${u.status} | job=${u.jobId}`)
      console.log(`    url: ${u.url.slice(0, 100)}`)
      console.log(`    processedAt: ${u.processedAt?.toISOString() || 'null'}`)
      console.log(`    error: ${u.error || '(none)'}`)
      console.log('')
    }
  }

  // Show what state the LinkedIn URLs from screenshot ARE actually in
  console.log('════════════════════════════════════════════════════════════')
  console.log('  ACTUAL STATE OF LINKEDIN URLS (last 200)')
  console.log('════════════════════════════════════════════════════════════\n')
  const linkedinUrls = await prisma.bulkFetchJobUrl.findMany({
    where: { url: { contains: 'linkedin' } },
    orderBy: { id: 'desc' },
    take: 200,
    select: { id: true, url: true, status: true, error: true, title: true, company: true, jobId: true },
  })
  const byStatus: Record<string, number> = {}
  for (const u of linkedinUrls) byStatus[u.status] = (byStatus[u.status] || 0) + 1
  console.log('  Status breakdown of last 200 LinkedIn URLs:')
  for (const [s, c] of Object.entries(byStatus)) {
    console.log(`    ${s}: ${c}`)
  }
  console.log('')

  // Show a few of the most recent errored LinkedIn URLs (to see why they failed)
  console.log('════════════════════════════════════════════════════════════')
  console.log('  WHY LINKEDIN URLS ARE FAILING (sample errors)')
  console.log('════════════════════════════════════════════════════════════\n')
  const errored = await prisma.bulkFetchJobUrl.findMany({
    where: { status: 'error', url: { contains: 'linkedin' } },
    orderBy: { id: 'desc' },
    take: 8,
    select: { url: true, error: true, title: true, company: true, processedAt: true },
  })
  for (const u of errored) {
    console.log(`  URL: ${u.url.slice(0, 120)}`)
    console.log(`  processedAt: ${u.processedAt?.toISOString() || 'null'}`)
    console.log(`  error: ${u.error || '(no error message stored)'}`)
    console.log('')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
