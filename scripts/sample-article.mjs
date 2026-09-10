// Fetch one sample article to see the content format
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
const prisma = new PrismaClient()
async function main() {
  const a = await prisma.article.findFirst({
    where: { slug: 'how-companies-hire-freshers-india' },
    select: { title: true, slug: true, category: true, tags: true, author: true, readMinutes: true, coverEmoji: true, excerpt: true, content: true }
  })
  console.log('Title:', a.title)
  console.log('Category:', a.category)
  console.log('Tags:', a.tags)
  console.log('Author:', a.author)
  console.log('Read minutes:', a.readMinutes)
  console.log('Cover emoji:', a.coverEmoji)
  console.log('Excerpt:', a.excerpt)
  console.log('--- Content (first 2000 chars) ---')
  console.log(a.content.substring(0, 2000))
  console.log('--- Content length ---', a.content.length)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
