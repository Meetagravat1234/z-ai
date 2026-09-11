/**
 * Insert 5 SEO blog articles into the Hirebase Article table.
 *
 * Reads markdown content from /home/z/my-project/scripts/articles/*.md
 * and inserts each as a published Article row via Prisma.
 *
 * Idempotent: if an article with the same slug already exists, it's UPDATED
 * (not duplicated) so the script can be re-run safely.
 *
 * Usage: node scripts/insert-articles.mjs
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Article metadata (content is loaded from .md files)
const ARTICLES = [
  {
    title: 'Software Engineer Salary in Bengaluru (2026 Edition)',
    slug: 'software-engineer-salary-bengaluru-2026',
    file: '01-software-engineer-salary-bengaluru-2026.md',
    excerpt:
      'Real software engineer salaries in Bengaluru by experience, tech stack, and company type. Fresher ₹3.5-45 LPA. Mid ₹15-50 LPA. Senior ₹30-90 LPA. Plus negotiation tactics and cost of living breakdown.',
    category: 'Salary Guide',
    tags: 'salary,software-engineer,bengaluru,2026,fresher,experienced',
    author: 'Hirebase Editorial',
    readMinutes: 9,
    coverEmoji: '💰',
  },
  {
    title: 'How to Write an ATS-Friendly Resume (With Examples)',
    slug: 'ats-friendly-resume-guide',
    file: '02-ats-friendly-resume-guide.md',
    excerpt:
      '75% of resumes get rejected by ATS before a human sees them. Learn the 7 rules of ATS-friendly resumes — format, fonts, section headings, keywords. Plus a free ATS score checker to test yours.',
    category: 'Career Advice',
    tags: 'resume,ats,resume-format,fresher,job-search',
    author: 'Hirebase Editorial',
    readMinutes: 11,
    coverEmoji: '📄',
  },
  {
    title: 'Top 10 Companies Hiring Freshers in Bengaluru (Sept 2026)',
    slug: 'top-10-companies-freshers-bengaluru-2026',
    file: '03-top-10-companies-freshers-bengaluru-2026.md',
    excerpt:
      'TCS, Infosys, Wipro, Accenture, Cognizant, Swiggy, Flipkart, Zoho, Microsoft, Amazon — fresher salaries, hiring volume, required skills, and how to apply. Updated September 2026.',
    category: 'Industry Insights',
    tags: 'freshers,bengaluru,top-companies,hiring,2026',
    author: 'Hirebase Editorial',
    readMinutes: 10,
    coverEmoji: '🎓',
  },
  {
    title: 'How to Prepare for Amazon SDE Interview — Real Questions',
    slug: 'amazon-sde-interview-preparation',
    file: '04-amazon-sde-interview-preparation.md',
    excerpt:
      'Complete Amazon SDE interview guide: 4-5 round structure, 16 Leadership Principles, real coding problems (LRU Cache, Top K Frequent, Number of Islands), 8-week prep plan, and salary negotiation tips.',
    category: 'Interview Prep',
    tags: 'amazon,sde,interview,preparation,leadership-principles,big-tech',
    author: 'Hirebase Editorial',
    readMinutes: 12,
    coverEmoji: '📦',
  },
  {
    title: 'Data Scientist Salary in India — Real Numbers by City & Experience',
    slug: 'data-scientist-salary-india-2026',
    file: '05-data-scientist-salary-india-2026.md',
    excerpt:
      'Actual data scientist salaries in India (2026): Bengaluru ₹18-28 LPA avg, Hyderabad ₹15-25 LPA, Mumbai ₹13-22 LPA. Breakdown by experience, specialization (ML, NLP, CV), and negotiation tactics.',
    category: 'Salary Guide',
    tags: 'salary,data-scientist,india,2026,bengaluru,hyderabad,ml',
    author: 'Hirebase Editorial',
    readMinutes: 11,
    coverEmoji: '📊',
  },
]

const ARTICLES_DIR = '/home/z/my-project/scripts/articles'

async function main() {
  console.log(`Inserting ${ARTICLES.length} articles into Hirebase...\n`)

  let inserted = 0
  let updated = 0

  for (const meta of ARTICLES) {
    const filePath = path.join(ARTICLES_DIR, meta.file)
    if (!fs.existsSync(filePath)) {
      console.error(`✗ Missing file: ${filePath}`)
      continue
    }
    const content = fs.readFileSync(filePath, 'utf8')
    console.log(`  ${meta.slug}: ${content.length} chars, ~${Math.round(content.split(/\s+/).length / 250)} min read`)

    // Upsert — update if exists, create if not
    const existing = await prisma.article.findUnique({ where: { slug: meta.slug } })
    if (existing) {
      await prisma.article.update({
        where: { slug: meta.slug },
        data: {
          title: meta.title,
          excerpt: meta.excerpt,
          content,
          category: meta.category,
          tags: meta.tags,
          author: meta.author,
          readMinutes: meta.readMinutes,
          coverEmoji: meta.coverEmoji,
          published: true,
        },
      })
      console.log(`    → UPDATED existing article`)
      updated++
    } else {
      await prisma.article.create({
        data: {
          title: meta.title,
          slug: meta.slug,
          excerpt: meta.excerpt,
          content,
          category: meta.category,
          tags: meta.tags,
          author: meta.author,
          readMinutes: meta.readMinutes,
          coverEmoji: meta.coverEmoji,
          published: true,
        },
      })
      console.log(`    → INSERTED new article`)
      inserted++
    }
  }

  // Verify
  const total = await prisma.article.count()
  console.log(`\n✓ Done. Inserted: ${inserted}. Updated: ${updated}. Total articles in DB: ${total}.`)
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
