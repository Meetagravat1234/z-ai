const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get all bulk fetch jobs
  const jobs = await prisma.bulkFetchJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      totalUrls: true,
      processedCount: true,
      savedCount: true,
      duplicateCount: true,
      failedCount: true,
      status: true,
      createdAt: true,
      completedAt: true,
    },
  })
  
  console.log('=== Recent Bulk Fetch Jobs ===')
  for (const job of jobs) {
    console.log(`\nJob ${job.id}`)
    console.log(`  Status: ${job.status}`)
    console.log(`  Total: ${job.totalUrls} | Processed: ${job.processedCount} | Saved: ${job.savedCount} | Dup: ${job.duplicateCount} | Failed: ${job.failedCount}`)
    console.log(`  Created: ${job.createdAt.toISOString()}`)
    if (job.completedAt) console.log(`  Completed: ${job.completedAt.toISOString()}`)
    
    // Get the actual error messages from failed URLs
    const errors = await prisma.bulkFetchJobUrl.findMany({
      where: { jobId: job.id, status: 'error' },
      select: { url: true, error: true, title: true, company: true },
      take: 10,
    })
    
    if (errors.length > 0) {
      console.log(`\n  Errors (showing first 10):`)
      for (const e of errors) {
        console.log(`    - URL: ${e.url.slice(0, 80)}...`)
        console.log(`      Error: ${e.error || '(no error message)'}`)
      }
      
      // Group errors by type
      const errorGroups = {}
      for (const e of errors) {
        const err = e.error || 'No error message'
        // Normalize: take first 80 chars
        const key = err.slice(0, 80)
        errorGroups[key] = (errorGroups[key] || 0) + 1
      }
      console.log(`\n  Error types (grouped):`)
      for (const [err, count] of Object.entries(errorGroups).sort((a, b) => b[1] - a[1])) {
        console.log(`    [${count}x] ${err}`)
      }
    }
    
    // Also count successes
    const saved = await prisma.bulkFetchJobUrl.findMany({
      where: { jobId: job.id, status: 'saved' },
      select: { url: true, title: true, company: true },
      take: 3,
    })
    if (saved.length > 0) {
      console.log(`\n  Sample saved jobs (first 3):`)
      for (const s of saved) {
        console.log(`    - ${s.title} @ ${s.company} — ${s.url.slice(0, 60)}...`)
      }
    }
  }
  
  // Test if Groq API key is actually set + working
  console.log('\n\n=== Testing AI Providers ===')
  
  // Test 1: Test Groq directly
  console.log('\nTesting Groq API...')
  try {
    // We can't read Vercel env vars from here, but we can hit our own /api endpoint
    // to see if Groq is configured. Use the debug endpoint if it exists, or
    // just test a small chat completion via fetch-job
    console.log('  (Cannot test Groq directly from local — need to test on production)')
  } catch (e) {
    console.log(`  Error: ${e.message}`)
  }
  
  // Test 2: Test Gemini API key
  console.log('\nTesting Gemini API key (env var presence)...')
  // We can hit the production /api/debug/zai-test if it exists
}

main().catch(console.error).finally(() => prisma.$disconnect())
