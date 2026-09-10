import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.article.count()
  console.log('Existing articles:', count)
  const sample = await prisma.article.findMany({ take: 3, select: { title: true, slug: true, category: true } })
  console.log('Sample:', sample)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
