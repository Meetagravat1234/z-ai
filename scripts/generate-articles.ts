/**
 * AI Article Generator
 *
 * Generates career-advice articles targeting Indian job-seeker keywords.
 * Uses z-ai (with OpenRouter fallback) to generate SEO-friendly content.
 *
 * Usage:
 *   npx tsx scripts/generate-articles.ts            # dry-run, shows topics
 *   npx tsx scripts/generate-articles.ts --apply    # actually generate + save
 *
 * Each article:
 *   - 800-1500 words, Markdown format
 *   - Targeted at a specific long-tail keyword (e.g. "fresher jobs in bangalore")
 *   - Includes: intro, 4-6 sections with ## headings, conclusion, FAQ
 *   - Optimized for SEO (keyword in title, first paragraph, H2s)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Article topics — each is a long-tail keyword with decent Indian search volume.
// Topics chosen to avoid overlap with existing 12 articles.
const ARTICLE_TOPICS = [
  {
    title: 'Top 15 High-Paying Remote Jobs in India for Freshers (2026)',
    keyword: 'remote jobs india freshers',
    category: 'Remote Work',
    tags: 'remote,jobs,freshers,india',
    emoji: '🏠',
  },
  {
    title: 'How to Crack the TCS NQT Exam: Complete Preparation Guide',
    keyword: 'tcs nqt preparation',
    category: 'Placement',
    tags: 'tcs,nqt,placement,aptitude',
    emoji: '📝',
  },
  {
    title: 'Software Engineer Salary in Bangalore: What to Expect in 2026',
    keyword: 'software engineer salary bangalore',
    category: 'Salary',
    tags: 'salary,software-engineer,bangalore',
    emoji: '💰',
  },
  {
    title: 'Data Scientist vs Data Analyst: Which Career Path Should You Choose?',
    keyword: 'data scientist vs data analyst',
    category: 'Career Advice',
    tags: 'data-science,career,comparison',
    emoji: '🔬',
  },
  {
    title: 'Top 10 In-Demand Tech Skills for 2026 (With Free Resources to Learn)',
    keyword: 'in-demand tech skills 2026',
    category: 'Skills',
    tags: 'skills,learning,tech,career',
    emoji: '🎯',
  },
  {
    title: 'How to Write a Resume with No Experience: A Fresher\'s Guide',
    keyword: 'resume for freshers no experience',
    category: 'Resume Tips',
    tags: 'resume,fresher,guide',
    emoji: '📄',
  },
  {
    title: 'Product Manager Salary in India: Entry-Level to Senior (2026 Guide)',
    keyword: 'product manager salary india',
    category: 'Salary',
    tags: 'salary,product-manager,india',
    emoji: '💼',
  },
  {
    title: 'MERN Stack Developer Roadmap 2026: Complete Learning Path',
    keyword: 'mern stack developer roadmap',
    category: 'Learning',
    tags: 'mern,web-development,roadmap',
    emoji: '⚛️',
  },
  {
    title: 'How to Prepare for Amazon SDE Interview: 30-Day Study Plan',
    keyword: 'amazon sde interview preparation',
    category: 'Interview Prep',
    tags: 'amazon,sde,interview,preparation',
    emoji: '🛒',
  },
  {
    title: 'Government vs Private Jobs in India: Which is Better in 2026?',
    keyword: 'government vs private jobs india',
    category: 'Career Advice',
    tags: 'government,private,comparison,career',
    emoji: '⚖️',
  },
  {
    title: 'How to Switch Careers from Non-IT to IT in India: A Complete Guide',
    keyword: 'career switch to it india',
    category: 'Career Advice',
    tags: 'career-switch,it,transition',
    emoji: '🔄',
  },
  {
    title: 'Top 20 Internship Opportunities for Engineering Students in India 2026',
    keyword: 'internships for engineering students india',
    category: 'Internships',
    tags: 'internship,engineering,students,india',
    emoji: '🎓',
  },
  {
    title: 'DevOps Engineer Salary in India: Freshers to Senior (2026)',
    keyword: 'devops engineer salary india',
    category: 'Salary',
    tags: 'salary,devops,india',
    emoji: '🔧',
  },
  {
    title: 'How to Build a LinkedIn Profile That Gets You Job Offers',
    keyword: 'linkedin profile for job search',
    category: 'Career Advice',
    tags: 'linkedin,job-search,personal-branding',
    emoji: '💼',
  },
  {
    title: 'Full Stack Developer Salary in India: City-Wise Breakdown 2026',
    keyword: 'full stack developer salary india',
    category: 'Salary',
    tags: 'salary,full-stack,india',
    emoji: '💻',
  },
  {
    title: 'Top 10 Highest Paying Jobs in India Without Coding (2026)',
    keyword: 'high paying jobs without coding india',
    category: 'Career Advice',
    tags: 'high-paying,non-coding,jobs,india',
    emoji: '💵',
  },
  {
    title: 'How to Pass the Wipro Elite NLTH Test: Preparation Strategy',
    keyword: 'wipro elite nlth preparation',
    category: 'Placement',
    tags: 'wipro,nlth,placement',
    emoji: '🔵',
  },
  {
    title: 'Cloud Computing Career Path: AWS vs Azure vs Google Cloud in 2026',
    keyword: 'aws vs azure vs gcp career',
    category: 'Learning',
    tags: 'cloud,aws,azure,gcp,career',
    emoji: '☁️',
  },
  {
    title: 'UI UX Designer Salary in India: What You\'ll Earn in 2026',
    keyword: 'ui ux designer salary india',
    category: 'Salary',
    tags: 'salary,ui-ux,designer,india',
    emoji: '🎨',
  },
  {
    title: 'How to Negotiate Your Salary in India: 7 Proven Tips for Freshers',
    keyword: 'salary negotiation tips india',
    category: 'Career Advice',
    tags: 'salary,negotiation,fresher,india',
    emoji: '🤝',
  },
]

async function generateArticle(topic: typeof ARTICLE_TOPICS[0]): Promise<string> {
  const { chatComplete } = await import('../../src/lib/multi-ai')

  const prompt = `You are an expert career advisor and content writer for Indian job seekers. Write a comprehensive, SEO-optimized article.

TITLE: ${topic.title}
TARGET KEYWORD: ${topic.keyword}
CATEGORY: ${topic.category}

REQUIREMENTS:
1. Length: 1000-1500 words
2. Start with an engaging intro paragraph (2-3 sentences) that naturally includes the target keyword
3. Use 4-6 main sections with ## Markdown headings (e.g. "## Why ${topic.category} Matters in 2026")
4. Include actionable tips, real examples, and specific numbers/data where possible
5. Add a "## Key Takeaways" section near the end with 3-5 bullet points
6. End with a "## Frequently Asked Questions" section with 3 Q&A pairs
7. Use **bold** for important terms and key phrases
8. Tone: professional but friendly, written for Indian audience (use ₹ for salaries, Indian cities, etc.)
9. Don't use placeholder text like "lorem ipsum" — write actual content
10. Don't include any meta-commentary about the article itself

OUTPUT FORMAT:
- Plain Markdown only
- No frontmatter, no YAML, no HTML
- Start directly with the intro paragraph (no # H1 heading — the title is already shown separately)
- The article should read like it was written by an expert human, not AI-generated

Write the article now:`

  const content = await chatComplete([
    { role: 'system', content: 'You are an expert SEO content writer specializing in Indian career advice. You write engaging, well-structured articles that rank well on Google and genuinely help job seekers.' },
    { role: 'user', content: prompt },
  ])

  return content || ''
}

function estimateReadMinutes(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(3, Math.round(words / 200)) // 200 wpm reading speed
}

function extractExcerpt(content: string): string {
  // Take first paragraph, strip markdown, truncate to ~160 chars
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
  console.log(`\nMode: ${apply ? '✅ APPLY (will generate + save articles)' : '🔍 DRY-RUN (no changes)'}\n`)
  console.log(`Article topics to generate: ${ARTICLE_TOPICS.length}\n`)

  // Check which articles already exist (by slug)
  const existingSlugs = await prisma.article.findMany({
    select: { slug: true },
  })
  const existingSet = new Set(existingSlugs.map((a) => a.slug))

  const toGenerate = ARTICLE_TOPICS.filter((t) => !existingSet.has(slugify(t.title)))
  console.log(`Already exist: ${ARTICLE_TOPICS.length - toGenerate.length}`)
  console.log(`To generate: ${toGenerate.length}\n`)

  if (toGenerate.length === 0) {
    console.log('✅ All articles already exist. Nothing to do.')
    return
  }

  if (!apply) {
    console.log('Topics to generate:')
    for (const t of toGenerate) {
      console.log(`  - ${t.title} (slug: ${slugify(t.title)})`)
    }
    console.log('\nRun with --apply to actually generate:')
    console.log('  npx tsx scripts/generate-articles.ts --apply')
    return
  }

  // Generate each article
  let success = 0
  let failed = 0
  for (let i = 0; i < toGenerate.length; i++) {
    const topic = toGenerate[i]
    console.log(`\n[${i + 1}/${toGenerate.length}] Generating: ${topic.title}`)

    try {
      const content = await generateArticle(topic)
      if (!content || content.length < 500) {
        console.log(`  ❌ Content too short (${content.length} chars) — skipping`)
        failed++
        continue
      }

      const slug = slugify(topic.title)
      const article = await prisma.article.create({
        data: {
          title: topic.title,
          slug,
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
      console.log(`  ✅ Saved (slug: ${article.slug}, ${content.split(/\s+/).length} words, ${estimateReadMinutes(content)} min read)`)
      success++

      // Small delay between calls to avoid rate limiting
      if (i < toGenerate.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    } catch (e: any) {
      console.log(`  ❌ Error: ${e.message?.slice(0, 100)}`)
      failed++
    }
  }

  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  GENERATION COMPLETE`)
  console.log(`══════════════════════════════════════════════`)
  console.log(`  ✅ Generated: ${success}`)
  console.log(`  ❌ Failed:    ${failed}`)
  console.log(`  Total articles in DB: ${await prisma.article.count()}`)
}

main()
  .catch((e) => { console.error('ERROR:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
