import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const jobId = 'cmueg9d6l0002jp0458xroiks'

  const urls = await prisma.bulkFetchJobUrl.findMany({
    where: { jobId },
    select: { status: true, error: true, processedAt: true, url: true },
    orderBy: { id: 'asc' },
  })

  console.log('=== Processing timeline (first 50 URLs) ===')
  let savedCount = 0, errCount = 0
  for (let i = 0; i < Math.min(50, urls.length); i++) {
    const u = urls[i]
    if (u.status === 'saved') savedCount++
    if (u.status === 'error') errCount++
    let host = 'unknown'
    try { host = new URL(u.url).hostname.replace('www.', '').slice(0, 25) } catch {}
    const time = u.processedAt ? u.processedAt.toISOString().slice(11, 19) : '--:--:--'
    const status = u.status === 'saved' ? '✓' : u.status === 'error' ? '✗' : u.status === 'duplicate' ? '=' : '○'
    console.log(`  [${i+1}] ${status} ${time} | ${u.status.padEnd(10)} | saved=${savedCount} err=${errCount} | ${host}`)
  }

  console.log('\n=== Error pattern ===')
  const fetchErrors = urls.filter((u) => u.error && u.error.includes('Failed to fetch page'))
  if (fetchErrors.length > 0) {
    console.log('  Total fetch errors:', fetchErrors.length)
    const firstErrIdx = urls.indexOf(fetchErrors[0])
    console.log('  First fetch error at URL #:', firstErrIdx + 1)
    console.log('  Time:', fetchErrors[0].processedAt?.toISOString())

    console.log('\n=== URL just before first fetch error ===')
    if (firstErrIdx > 0) {
      console.log('  #', firstErrIdx, '-', urls[firstErrIdx - 1].status, '-', urls[firstErrIdx - 1].url.slice(0, 80))
    }
    console.log('  #', firstErrIdx + 1, '-', urls[firstErrIdx].status, '-', urls[firstErrIdx].url.slice(0, 80))
  }

  // Check error URLs by hostname
  console.log('\n=== Error URLs by hostname ===')
  const byHost: Record<string, number> = {}
  for (const u of urls.filter((u) => u.status === 'error')) {
    try {
      const h = new URL(u.url).hostname.replace('www.', '')
      byHost[h] = (byHost[h] || 0) + 1
    } catch {}
  }
  for (const [h, n] of Object.entries(byHost).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${h}: ${n}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
