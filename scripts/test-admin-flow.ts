// Simulate what happens when admin calls resume-optimize
// by directly invoking the route handler
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) {
    console.log('No admin user found')
    return
  }
  console.log('Admin found:', admin.email, '| tier:', admin.subscriptionTier, '| used:', admin.resumeOptimizationsUsed)
  
  // Simulate the canUseAIToolWithAdGate check
  const { canUseAIToolWithAdGate } = await import('/home/z/my-project/src/lib/subscription.ts')
  const usage = await canUseAIToolWithAdGate('resumeOptimizations', admin, undefined, undefined as any)
  console.log('\\n=== Usage check ===')
  console.log('  allowed:', usage.allowed)
  console.log('  reason:', usage.reason)
  console.log('  message:', usage.message)
  console.log('  used:', usage.used, '/', usage.limit)
  console.log('  isPro:', usage.isPro)
  console.log('  requiresAd:', (usage as any).requiresAd)
  
  if (!usage.allowed) {
    console.log('\\n❌ Paywall would BLOCK this request')
    console.log('  → This is the bug! Admin is being blocked by paywall')
    return
  }
  
  // Now actually call the AI
  console.log('\\n=== Calling AI ===')
  const { chatComplete } = await import('/home/z/my-project/src/lib/multi-ai.ts')
  const start = Date.now()
  try {
    const result = await chatComplete([
      {
        role: 'system',
        content: "You are an expert ATS resume optimizer. Produce a tailored, ATS-friendly resume in Markdown. Start with the person's name as # H1 heading. Include sections: ## Professional Summary, ## Core Skills, ## Professional Experience, ## Education. Output ONLY the resume."
      },
      {
        role: 'user',
        content: 'MY CURRENT RESUME:\nJohn Doe\nSoftware Engineer\n3 years Python, React experience\n\nTARGET JOB:\nGoogle Software Engineer requiring Python, React, AWS\n\nProduce the tailored ATS-optimized resume in Markdown.'
      }
    ])
    console.log('  ✅ AI call succeeded in', Date.now() - start, 'ms')
    console.log('  Response length:', result?.length || 0)
  } catch (e: any) {
    console.log('  ❌ AI call FAILED in', Date.now() - start, 'ms')
    console.log('  Error:', e.message)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
