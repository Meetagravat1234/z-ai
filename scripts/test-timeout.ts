import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== Test chatComplete with timeout protection ===')
  const { chatComplete } = await import('/home/z/my-project/src/lib/multi-ai.ts')
  
  // Test with a normal prompt - should complete in 5-10s
  const start1 = Date.now()
  try {
    const result = await chatComplete([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello in one word.' }
    ])
    console.log('✅ Short prompt completed in', Date.now() - start1, 'ms')
    console.log('  Response:', result?.slice(0, 100))
  } catch (e: any) {
    console.log('❌ Short prompt FAILED in', Date.now() - start1, 'ms:', e.message)
  }
  
  // Test with a real resume prompt
  console.log('\n=== Test with resume optimization prompt ===')
  const start2 = Date.now()
  try {
    const result = await chatComplete([
      {
        role: 'system',
        content: "You are an expert ATS resume optimizer. Output a tailored resume in Markdown. Start with # Name. Include ## Professional Summary, ## Core Skills, ## Professional Experience, ## Education. Output ONLY the resume."
      },
      { role: 'user', content: 'MY RESUME:\nJohn Doe\nSoftware Engineer\n3 years Python, React\n\nTARGET JOB:\nGoogle Software Engineer requiring Python, React, AWS\n\nProduce the tailored resume in Markdown.' }
    ])
    console.log('✅ Resume prompt completed in', Date.now() - start2, 'ms')
    console.log('  Response length:', result?.length || 0)
    console.log('  First 200 chars:', result?.slice(0, 200))
  } catch (e: any) {
    console.log('❌ Resume prompt FAILED in', Date.now() - start2, 'ms:', e.message)
  }
  
  // Verify total time stays well under 60s (Vercel limit)
  const totalTime = (Date.now() - start1) + (Date.now() - start2)
  console.log('\n=== Total time:', totalTime, 'ms ===')
  if (totalTime < 30000) {
    console.log('✅ Well within 60s Vercel timeout')
  } else {
    console.log('⚠️  Approaching timeout limit')
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
