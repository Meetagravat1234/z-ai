import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check what skills/keywords exist in jobs to identify domain categories
  console.log('=== Sample skills from jobs (to identify domains) ===')
  const jobs = await prisma.job.findMany({
    where: { skills: { not: { equals: '' } } },
    select: { title: true, skills: true },
    take: 50,
    orderBy: { postedAt: 'desc' },
  })
  const skillMap: Record<string, number> = {}
  for (const j of jobs) {
    const skills = (j.skills || '').split(',').map((s: string) => s.trim().toLowerCase())
    for (const s of skills) {
      if (s.length > 2) skillMap[s] = (skillMap[s] || 0) + 1
    }
  }
  const topSkills = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 30)
  for (const [s, n] of topSkills) console.log('  ', s, ':', n)

  // Sample job titles to understand domains
  console.log('\n=== Sample job titles (last 30) ===')
  const titles = await prisma.job.findMany({ select: { title: true }, take: 30, orderBy: { postedAt: 'desc' } })
  for (const t of titles) console.log('  ', t.title)
}

main().catch(console.error).finally(() => prisma.$disconnect())
