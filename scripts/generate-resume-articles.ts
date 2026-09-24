/**
 * SEO Article Generator — Resume-focused articles
 *
 * Generates high-quality, SEO-optimized articles targeting Indian job seekers
 * searching for resume-related queries.
 *
 * Usage (run from project root):
 *   DATABASE_URL="..." npx tsx scripts/generate-resume-articles.ts --apply
 */

import { PrismaClient } from '@prisma/client'
import ZAI from 'z-ai-web-dev-sdk'

const prisma = new PrismaClient()

// Resume-focused article topics with high Indian search volume
const ARTICLE_TOPICS = [
  {
    title: 'How to Write a Resume for Freshers in India (With 3 Free Templates)',
    keyword: 'resume for freshers india',
    category: 'Resume Tips',
    tags: 'resume,fresher,india,template,guide',
    emoji: '📄',
  },
  {
    title: 'ATS-Friendly Resume Format 2026: How to Beat Applicant Tracking Systems',
    keyword: 'ats friendly resume format',
    category: 'Resume Tips',
    tags: 'ats,resume,format,2026',
    emoji: '🤖',
  },
  {
    title: 'Resume Headline Examples for Software Engineers (2026 Guide)',
    keyword: 'resume headline for software engineer',
    category: 'Resume Tips',
    tags: 'resume,headline,software-engineer',
    emoji: '💻',
  },
  {
    title: 'How to Write Work Experience in Resume (With Examples)',
    keyword: 'how to write work experience in resume',
    category: 'Resume Tips',
    tags: 'resume,work-experience,examples',
    emoji: '💼',
  },
  {
    title: 'Best Resume Format for Indian Jobs (2026 — Word, PDF, or Both?)',
    keyword: 'best resume format india',
    category: 'Resume Tips',
    tags: 'resume,format,india,pdf,word',
    emoji: '🇮🇳',
  },
  {
    title: 'Resume Summary vs Objective: Which One Should You Use in 2026?',
    keyword: 'resume summary vs objective',
    category: 'Resume Tips',
    tags: 'resume,summary,objective',
    emoji: '✍️',
  },
  {
    title: 'How Many Pages Should a Resume Be? (India vs US Standards)',
    keyword: 'how many pages should a resume be',
    category: 'Resume Tips',
    tags: 'resume,pages,length',
    emoji: '📐',
  },
  {
    title: 'Resume Skills Section: How to List Skills That Get You Hired',
    keyword: 'resume skills section examples',
    category: 'Resume Tips',
    tags: 'resume,skills,examples',
    emoji: '🎯',
  },
  {
    title: 'How to Write a Cover Letter in India (With Free Template)',
    keyword: 'how to write cover letter india',
    category: 'Cover Letter',
    tags: 'cover-letter,india,template',
    emoji: '💌',
  },
  {
    title: 'Resume Mistakes That Get You Rejected (Avoid These 15 Errors)',
    keyword: 'resume mistakes to avoid',
    category: 'Resume Tips',
    tags: 'resume,mistakes,errors',
    emoji: '⚠️',
  },
]

async function generateArticle(topic: typeof ARTICLE_TOPICS[0]): Promise<string> {
  const zai = await ZAI.create()

  const prompt = `You are an expert career advisor and SEO content writer for Indian job seekers. Write a comprehensive, SEO-optimized article.

TITLE: ${topic.title}
TARGET KEYWORD: ${topic.keyword}
CATEGORY: ${topic.category}

REQUIREMENTS:
1. Length: 1500-2000 words
2. Start with an engaging intro paragraph (2-3 sentences) that naturally includes the target keyword
3. Use 5-7 main sections with ## Markdown headings
4. Include actionable tips, real examples, and specific numbers/data where possible
5. Add a "## Step-by-Step Guide" section with numbered steps
6. Add a "## Common Mistakes to Avoid" section with 3-5 bullet points
7. End with a "## Frequently Asked Questions" section with 4-5 Q&A pairs
8. Use **bold** for important terms and key phrases
9. Tone: professional but friendly, written for Indian audience (use ₹ for amounts, Indian cities, Indian companies)
10. Don't use placeholder text — write actual content
11. Don't include any meta-commentary about the article itself

OUTPUT FORMAT:
- Plain Markdown only
- No frontmatter, no YAML, no HTML
- Start directly with the intro paragraph (no # H1 heading — the title is already shown separately)
- The article should read like it was written by an expert human, not AI-generated

Write the article now:`

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO content writer specializing in Indian career advice. You write engaging, well-structured articles that rank well on Google and genuinely help job seekers.',
      },
      { role: 'user', content: prompt },
    ],
    thinking: { type: 'disabled' },
  })

  return response.choices[0]?.message?.content || ''
}

function estimateReadMinutes(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(3, Math.round(words / 200))
}

function extractExcerpt(content: string): string {
  const firstPara = content.split('\n\n')[0] || content.slice(0, 200)
  const plain = firstPara.replace(/[#*`_~\[\]]/g, '').replace(/\s+/g, ' ').trim()
  return plain.slice(0, 157) + (plain.length > 157 ? '...' : '')
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`\nMode: ${apply ? '✅ APPLY' : '🔍 DRY-RUN'}\n`)

  const existingSlugs = await prisma.article.findMany({ select: { slug: true } })
  const existingSet = new Set(existingSlugs.map((a) => a.slug))

  const toGenerate = ARTICLE_TOPICS.filter((t) => !existingSet.has(slugify(t.title)))
  console.log(`Topics to generate: ${toGenerate.length}\n`)

  if (toGenerate.length === 0) {
    console.log('✅ All articles already exist.')
    return
  }

  if (!apply) {
    for (const t of toGenerate) console.log(`  - ${t.title}`)
    console.log('\nRun with --apply to generate.')
    return
  }

  let success = 0, failed = 0
  for (let i = 0; i < toGenerate.length; i++) {
    const topic = toGenerate[i]
    console.log(`[${i + 1}/${toGenerate.length}] ${topic.title}`)
    try {
      const content = await generateArticle(topic)
      if (!content || content.length < 500) {
        console.log(`  ❌ Too short (${content.length})`)
        failed++
        continue
      }
      await prisma.article.create({
        data: {
          title: topic.title,
          slug: slugify(topic.title),
          excerpt: extractExcerpt(content),
          content,
          category: topic.category,
          tags: topic.tags,
          author: 'Hirebase Editorial',
          readMinutes: estimateReadMinutes(content),
          coverEmoji: topic.emoji,
          published: true,
        },
      })
      console.log(`  ✅ ${content.split(/\s+/).length} words`)
      success++
      if (i < toGenerate.length - 1) await new Promise((r) => setTimeout(r, 3000))
    } catch (e: any) {
      console.log(`  ❌ ${e.message?.slice(0, 100)}`)
      failed++
    }
  }

  console.log(`\n✅ Generated: ${success}, ❌ Failed: ${failed}`)
  console.log(`Total articles in DB: ${await prisma.article.count()}`)
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) }).finally(() => prisma.$disconnect())
