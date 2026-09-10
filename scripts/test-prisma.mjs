import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
const prisma = new PrismaClient({ log: ['error', 'warn'] })
async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
  const count = await prisma.job.count({ where: { verified: true } })
  console.log('Verified jobs:', count)
  const companies = await prisma.company.count()
  console.log('Companies:', companies)
  // Try a findMany
  const sample = await prisma.job.findMany({ take: 2, include: { company: true } })
  console.log('Sample job:', sample[0]?.title)
}
main().catch(e => { console.error('ERROR:', e); process.exit(1) }).finally(() => prisma.$disconnect())
