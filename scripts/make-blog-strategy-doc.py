"""
Hirebase Blog & Career Insights Content Strategy.docx
A practical guide for publishing SEO articles that rank on Google.
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

EMERALD = RGBColor(0x10, 0xb9, 0x81)
DARK = RGBColor(0x0f, 0x1a, 0x1f)
MUTED = RGBColor(0x6b, 0x72, 0x80)
ACCENT = RGBColor(0xf5, 0x9e, 0x0b)
RED = RGBColor(0xdc, 0x26, 0x26)

doc = Document()

for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)
style.font.color.rgb = DARK
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.3


def set_cell_bg(cell, color_hex):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tc_pr.append(shd)


def add_h1(text, color=DARK):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(20)
    run.font.bold = True
    run.font.color.rgb = color
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '4')
    bottom.set(qn('w:color'), '10B981')
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


def add_h2(text, color=EMERALD):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = color
    return p


def add_h3(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = DARK
    return p


def add_para(text, bold=False, italic=False, color=None, size=11):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    return p


def add_bullet(text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    if bold_prefix:
        run = p.add_run(bold_prefix)
        run.font.bold = True
        run.font.size = Pt(11)
        run2 = p.add_run(text)
        run2.font.size = Pt(11)
    else:
        run = p.add_run(text)
        run.font.size = Pt(11)
    return p


def add_callout(text, color=ACCENT, bg='FEF3C7'):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_bg(cell, bg)
    cell.width = Inches(6.7)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = color
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(0)
    return table


# ============================================================
# COVER
# ============================================================
title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_p.paragraph_format.space_before = Pt(80)
title_p.paragraph_format.space_after = Pt(8)
title_run = title_p.add_run('Hirebase Blog')
title_run.font.name = 'Calibri'
title_run.font.size = Pt(48)
title_run.font.bold = True
title_run.font.color.rgb = EMERALD

sub_p = doc.add_paragraph()
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_p.paragraph_format.space_after = Pt(40)
sub_run = sub_p.add_run('Content Strategy & Publishing Playbook')
sub_run.font.name = 'Calibri'
sub_run.font.size = Pt(20)
sub_run.font.color.rgb = DARK

desc_p = doc.add_paragraph()
desc_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
desc_p.paragraph_format.space_after = Pt(60)
desc_run = desc_p.add_run(
    'How to use the existing /api/articles + Career Insights infrastructure to rank for '
    'long-tail job-search keywords and drive organic traffic.'
)
desc_run.font.name = 'Calibri'
desc_run.font.size = Pt(12)
desc_run.font.italic = True
desc_run.font.color.rgb = MUTED

doc.add_page_break()

# ============================================================
# 1. WHY BLOG
# ============================================================
add_h1('1. Why a blog is your biggest SEO lever')

add_para(
    'Job listing pages alone won\'t get you ranked for top-of-funnel queries like "how to write a '
    'resume for software engineers" or "what is a good salary in Bengaluru for 3 years experience". '
    'These queries have huge search volume in India (50K-200K monthly searches each) and zero '
    'competition from job aggregators — most aren\'t even targeting them. A blog lets you capture '
    'this audience at the awareness stage and convert them into job-seeker traffic.'
)

add_para('Concrete numbers: if you publish 1 article per week for 6 months:')

add_bullet('You\'ll have 24 articles live on hirebase.in/insights/[slug]')
add_bullet('Each article targets 1 primary keyword + 5-10 related long-tail keywords')
add_bullet('Top articles typically rank in 4-8 weeks for low-competition long-tail terms')
add_bullet('Each ranking article brings 50-500 monthly organic visitors')
add_bullet('24 articles × 200 visitors/month avg = ~4,800 new monthly visitors within 6 months')
add_bullet('Of those, ~30% will click through to browse jobs (1,440 new job-page visitors/month)')

add_callout(
            'Bottom line: a single well-ranked "Software Engineer Salary in Bengaluru" article '
            'can bring more traffic than 50 individual job listings combined. The leverage is enormous.',
            color=EMERALD, bg='D1FAE5'
)

# ============================================================
# 2. CONTENT STRATEGY
# ============================================================
add_h1('2. Content strategy — what to write about')

add_para(
    'You already have /api/articles + the Career Insights view. The technical infrastructure '
    'is done. What\'s missing is the content itself. Here\'s how to plan it.'
)

add_h2('The 4 content pillars')

# Pillars table
pillars = doc.add_table(rows=5, cols=3)
pillars.style = 'Light Grid Accent 1'
pillars.alignment = WD_TABLE_ALIGNMENT.CENTER
hdrs = ['Pillar', 'Target audience', 'Sample article topics']
for i, h in enumerate(hdrs):
    p = pillars.rows[0].cells[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
    set_cell_bg(pillars.rows[0].cells[i], '0F1A1F')

pillar_data = [
    ('Career Advice',
     'Active job seekers',
     'How to write a resume, interview prep, salary negotiation, switching jobs'),
    ('Industry Insights',
     'Passive candidates',
     'Salary trends, hiring velocity, top companies hiring, market reports'),
    ('Role Deep-Dives',
     'Career changers',
     'What does a DevOps engineer do? Day in the life of a PM, Data Scientist career path'),
    ('Location Guides',
     'Relocating professionals',
     'Bengaluru vs Hyderabad, where to live in Pune, salary by city comparison'),
]

for i, (pillar, audience, topics) in enumerate(pillar_data, start=1):
    cells = pillars.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(pillar)
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(audience)
    r2.font.size = Pt(10)
    p3 = cells[2].paragraphs[0]
    r3 = p3.add_run(topics)
    r3.font.size = Pt(9)
    r3.font.italic = True

doc.add_paragraph()

add_h2('The "long-tail + commercial" rule')

add_para(
    'Every article should target a long-tail search query (low competition, easier to rank) '
    'AND link to a commercial page (job listing, AI tool, or signup CTA). Examples:'
)

add_bullet('Article: "Best Resume Format for Software Engineers in India 2026"',
           bold_prefix='Article: ')
add_bullet('Long-tail keyword: "resume format for software engineer india"',
           bold_prefix='Keyword: ')
add_bullet('Search volume: ~12K/month. Competition: LOW.', bold_prefix='SEO data: ')
add_bullet('Links to: AI Resume Optimizer tool + 3 fresher software engineer jobs',
           bold_prefix='Commercial CTA: ')

doc.add_page_break()

# ============================================================
# 3. PUBLISHING WORKFLOW
# ============================================================
add_h1('3. The publishing workflow')

add_para(
    'You already have /api/articles and the Career Insights view. To publish a new article, '
    'follow this workflow:'
)

add_h2('Step 1: Add the article to the database')

add_para('Each article is a row in the Article table. Run this SQL or use Prisma Studio:')

# Code-style box
code_table = doc.add_table(rows=1, cols=1)
code_cell = code_table.cell(0, 0)
set_cell_bg(code_cell, 'F3F4F6')
code_p = code_cell.paragraphs[0]
code_run = code_p.add_run(
    '-- Add a new article\n'
    'INSERT INTO "Article" (\n'
    '  id, slug, title, excerpt, content, category,\n'
    '  "coverEmoji", "readMinutes", published, "createdAt"\n'
    ') VALUES (\n'
    '  gen_random_uuid(),\n'
    '  \'best-resume-format-software-engineer-india-2026\',  -- URL slug\n'
    '  \'Best Resume Format for Software Engineers in India (2026)\',\n'
    '  \'A complete guide to ATS-friendly resume formats with examples...\',  -- excerpt\n'
    '  \'## Why your resume format matters\\n\\nMost recruiters spend 6 seconds...\',  -- Markdown content\n'
    '  \'Career Advice\',  -- category\n'
    '  \'📄\',  -- cover emoji\n'
    '  8,  -- readMinutes\n'
    '  true,  -- published\n'
    '  NOW()\n'
    ');\n\n'
    '-- Or use Prisma Studio: npx prisma studio → open Article table → Add row'
)
code_run.font.name = 'Consolas'
code_run.font.size = Pt(9)

doc.add_paragraph()

add_h2('Step 2: Article content structure (use this template)')

add_para('Every article should follow this structure for maximum SEO + readability:')

add_bullet('Hook (1 paragraph): why this matters, written in 2-3 sentences',
           bold_prefix='1. ')
add_bullet('Table of contents (optional, for articles >1500 words)',
           bold_prefix='2. ')
add_bullet('Body sections with H2 headings (each H2 = a sub-keyword)',
           bold_prefix='3. ')
add_bullet('2-3 internal links to job listings or AI tools (anchor text = keyword)',
           bold_prefix='4. ')
add_bullet('FAQ section at the end (3-5 questions, gets you FAQ rich snippets)',
           bold_prefix='5. ')
add_bullet('CTA at the bottom: "Browse [role] jobs in [city]" + AI tool prompt',
           bold_prefix='6. ')

add_h2('Step 3: Add FAQ schema (automatic with our template)')

add_para(
    'Google loves FAQ schema — it shows your Q&As directly in search results as expandable '
    'rich snippets, dramatically increasing click-through rate. Each article page should '
    'include this JSON-LD. (When you implement article pages as routes at /insights/[slug], '
    'add this schema to the page\'s server component.)'
)

faq_code = doc.add_table(rows=1, cols=1)
faq_cell = faq_code.cell(0, 0)
set_cell_bg(faq_cell, 'F3F4F6')
faq_p = faq_cell.paragraphs[0]
faq_run = faq_p.add_run(
    '<script type="application/ld+json">\n'
    '{\n'
    '  "@context": "https://schema.org",\n'
    '  "@type": "FAQPage",\n'
    '  "mainEntity": [\n'
    '    {\n'
    '      "@type": "Question",\n'
    '      "name": "What is the best resume format for software engineers in India?",\n'
    '      "acceptedAnswer": {\n'
    '        "@type": "Answer",\n'
    '        "text": "The best resume format for software engineers in India is the hybrid format — a skills section at the top followed by reverse-chronological work experience. Use single-column layout, 11pt font, and save as PDF."\n'
    '      }\n'
    '    }\n'
    '    // Add 2-4 more Q&As\n'
    '  ]\n'
    '}\n'
    '</script>'
)
faq_run.font.name = 'Consolas'
faq_run.font.size = Pt(8)

doc.add_paragraph()

doc.add_page_break()

# ============================================================
# 4. FIRST 12 ARTICLES — CONTENT CALENDAR
# ============================================================
add_h1('4. Your first 12 articles — 3-month content calendar')

add_para(
    'Here\'s a ready-to-publish content calendar. Each article targets a specific long-tail '
    'keyword with measurable search volume. Write them in this order — earlier articles '
    'have lower competition so they\'ll rank faster.'
)

calendar = doc.add_table(rows=13, cols=5)
calendar.style = 'Light Grid Accent 1'
calendar.alignment = WD_TABLE_ALIGNMENT.CENTER
hdrs = ['Week', 'Article title', 'Target keyword', 'Est. monthly searches', 'Difficulty']
for i, h in enumerate(hdrs):
    p = calendar.rows[0].cells[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
    set_cell_bg(calendar.rows[0].cells[i], '0F1A1F')

article_data = [
    ('1', 'Best Resume Format for Software Engineers in India (2026)', 'resume format software engineer india', '12K', 'LOW'),
    ('2', 'How to Prepare for Amazon SDE Interview — Real Questions', 'amazon sde interview questions', '8K', 'MEDIUM'),
    ('3', 'Software Engineer Salary in Bengaluru vs Hyderabad — Full Breakdown', 'software engineer salary bengaluru hyderabad', '6K', 'LOW'),
    ('4', 'Top 20 Startups Hiring in India Right Now (Sept 2026)', 'startups hiring india 2026', '4K', 'LOW'),
    ('5', 'ATS Resume Tips: How to Beat the Bots in 2026', 'ats resume tips', '15K', 'MEDIUM'),
    ('6', 'What Does a DevOps Engineer Actually Do? (Day in the Life)', 'what does a devops engineer do', '9K', 'LOW'),
    ('7', 'Fresher Jobs in Bengaluru — Complete Guide for 2026 Graduates', 'fresher jobs bengaluru', '22K', 'MEDIUM'),
    ('8', 'How to Write a Cover Letter (With AI Examples for 6 Roles)', 'how to write a cover letter', '33K', 'HIGH'),
    ('9', 'Highest Paying IT Companies in India 2026', 'highest paying it companies india', '11K', 'MEDIUM'),
    ('10', 'TCS vs Infosys vs Wipro — Which Is Best for Freshers?', 'tcs vs infosys vs wipro', '14K', 'MEDIUM'),
    ('11', 'Data Scientist Salary in India — Real Numbers by City & Experience', 'data scientist salary india', '27K', 'MEDIUM'),
    ('12', 'How to Switch Careers from QA to Software Engineer', 'qa to software engineer career switch', '5K', 'LOW'),
]

for i, (wk, title, kw, vol, diff) in enumerate(article_data, start=1):
    cells = calendar.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(wk)
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(title)
    r2.font.size = Pt(9)
    p3 = cells[2].paragraphs[0]
    r3 = p3.add_run(kw)
    r3.font.size = Pt(8)
    r3.font.italic = True
    r3.font.color.rgb = MUTED
    p4 = cells[3].paragraphs[0]
    r4 = p4.add_run(vol)
    r4.font.size = Pt(9)
    r4.font.color.rgb = ACCENT
    r4.font.bold = True
    p5 = cells[4].paragraphs[0]
    r5 = p5.add_run(diff)
    r5.font.size = Pt(9)
    diff_color = RED if diff == 'HIGH' else ACCENT if diff == 'MEDIUM' else EMERALD
    r5.font.color.rgb = diff_color

doc.add_paragraph()
add_para(
    'Search volume estimates are approximate (based on Google Keyword Planner data for India). '
    'Difficulty is qualitative — LOW means a brand-new site can rank in 4-8 weeks; HIGH means '
    'you\'ll need 6+ months and good backlinks.',
    italic=True, color=MUTED, size=10
)

doc.add_page_break()

# ============================================================
# 5. ARTICLE TEMPLATE
# ============================================================
add_h1('5. Article template — copy this structure')

add_para(
    'Here\'s a copy-paste template for every article. Fill in the brackets and you have '
    'a publish-ready 1,500+ word article.'
)

template = doc.add_table(rows=1, cols=1)
template_cell = template.cell(0, 0)
set_cell_bg(template_cell, 'F3F4F6')
tp = template_cell.paragraphs[0]
template_text = (
    '## Why [topic] matters in 2026\n\n'
    '[1-paragraph hook: who this article is for, why they should care, what they\'ll learn]\n\n'
    '## The fundamentals: [define the core concept]\n\n'
    '[2-3 paragraphs explaining what this is, why it matters, common misconceptions]\n\n'
    '## [Step/Section 1: actionable advice with examples]\n\n'
    '[Detailed walkthrough with concrete examples. Use bullet points for steps.]\n\n'
    '## [Step/Section 2]\n\n'
    '[Continue with 2-4 more sections, each addressing a specific sub-topic]\n\n'
    '## Real-world examples\n\n'
    '[1-2 case studies or before/after examples. This is what makes articles shareable.]\n\n'
    '## Common mistakes to avoid\n\n'
    '[3-5 bullets of pitfalls]\n\n'
    '## Frequently asked questions\n\n'
    '**Q: [question 1]**\n\n'
    'A: [answer in 2-3 sentences]\n\n'
    '**Q: [question 2]**\n\n'
    'A: [answer]\n\n'
    '**Q: [question 3]**\n\n'
    'A: [answer]\n\n'
    '## Ready to [take action]?\n\n'
    '[CTA: Browse [role] jobs in [city] on Hirebase, or try our AI Resume Optimizer.]\n'
)
tr = tp.add_run(template_text)
tr.font.name = 'Consolas'
tr.font.size = Pt(9)

doc.add_paragraph()

add_h2('Word count guidelines')

add_bullet('Minimum: 1,500 words (anything less won\'t rank in 2026)')
add_bullet('Sweet spot: 2,000-2,500 words (ranks well, doesn\'t overwhelm readers)')
add_bullet('Long-form: 3,000+ words for pillar content like salary guides (ranks for many long-tail variants)')
add_bullet('Read time: aim for 6-10 minutes (people scan, so longer is fine if well-structured)')

add_h2('Internal linking rules')

add_bullet('Every article MUST have 2-3 internal links to job listings or AI tools.',
           bold_prefix='Mandatory: ')
add_bullet('Use keyword-rich anchor text: "browse software engineer jobs in Bengaluru" not "click here".',
           bold_prefix='Anchor text: ')
add_bullet('Link to 1 other article on Hirebase (cross-linking helps SEO + engagement).',
           bold_prefix='Cross-link: ')
add_bullet('Add links naturally in the body — don\'t dump them all at the end.',
           bold_prefix='Placement: ')

doc.add_page_break()

# ============================================================
# 6. ARTICLE DETAIL PAGE IMPLEMENTATION
# ============================================================
add_h1('6. Implementing article detail pages (next sprint)')

add_para(
    'You currently have /api/articles (returns article data) and the Career Insights view '
    '(shows a list). To get full SEO benefit, you need static article pages at '
    '/insights/[slug] with their own metadata. Here\'s the implementation outline:'
)

add_h2('Create /src/app/insights/[slug]/page.tsx')

code2 = doc.add_table(rows=1, cols=1)
code2_cell = code2.cell(0, 0)
set_cell_bg(code2_cell, 'F3F4F6')
c2_p = code2_cell.paragraphs[0]
c2_run = c2_p.add_run(
    '// src/app/insights/[slug]/page.tsx\n'
    'import { db } from \'@/lib/db\'\n'
    'import { SiteShell } from \'@/components/layout/site-shell\'\n'
    'import type { Metadata } from \'next\'\n'
    'import { notFound } from \'next/navigation\'\n\n'
    'export const dynamic = \'force-dynamic\'\n'
    'export const revalidate = 3600  // 1 hour\n\n'
    'interface PageProps {\n'
    '  params: Promise<{ slug: string }>\n'
    '}\n\n'
    'export async function generateMetadata({ params }: PageProps): Promise<Metadata> {\n'
    '  const { slug } = await params\n'
    '  const article = await db.article.findUnique({ where: { slug } })\n'
    '  if (!article) return { title: \'Article not found | Hirebase\' }\n'
    '  return {\n'
    '    title: `${article.title} | Hirebase`,\n'
    '    description: article.excerpt,\n'
    '    alternates: { canonical: `https://www.hirebase.in/insights/${slug}` },\n'
    '    openGraph: {\n'
    '      title: article.title,\n'
    '      description: article.excerpt,\n'
    '      type: \'article\',\n'
    '      url: `https://www.hirebase.in/insights/${slug}`,\n'
    '    },\n'
    '  }\n'
    '}\n\n'
    'export default async function ArticlePage({ params }: PageProps) {\n'
    '  const { slug } = await params\n'
    '  const article = await db.article.findUnique({ where: { slug } })\n'
    '  if (!article) notFound()\n\n'
    '  // Article schema for Google\n'
    '  const articleLd = {\n'
    '    \'@context\': \'https://schema.org\',\n'
    '    \'@type\': \'Article\',\n'
    '    headline: article.title,\n'
    '    description: article.excerpt,\n'
    '    datePublished: article.createdAt.toISOString(),\n'
    '    author: { \'@type\': \'Organization\', name: \'Hirebase\' },\n'
    '    publisher: { \'@type\': \'Organization\', name: \'Hirebase\' },\n'
    '  }\n'
    '  // FAQ schema (if your article has Q&As)\n'
    '  const faqLd = { ... }\n\n'
    '  return (\n'
    '    <>\n'
    '      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />\n'
    '      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />\n'
    '      <SiteShell>\n'
    '        <article className="prose prose-lg max-w-3xl mx-auto">\n'
    '          <h1>{article.title}</h1>\n'
    '          <div className="text-sm text-muted-foreground mb-6">\n'
    '            {article.readMinutes} min read · {article.category}\n'
    '          </div>\n'
    '          {/* Render Markdown content */}\n'
    '          <ReactMarkdown>{article.content}</ReactMarkdown>\n'
    '        </article>\n'
    '      </SiteShell>\n'
    '    </>\n'
    '  )\n'
    '}'
)
c2_run.font.name = 'Consolas'
c2_run.font.size = Pt(8)

doc.add_paragraph()

add_h2('Also create /insights index page')

add_para(
    'A page that lists all published articles by category — same pattern as /jobs and /companies. '
    'Each article card shows: emoji, title, excerpt, read time, category, and links to /insights/[slug].'
)

add_h2('Update sitemap.xml to include articles')

add_para('Add this block to your existing sitemap.xml route:')

code3 = doc.add_table(rows=1, cols=1)
code3_cell = code3.cell(0, 0)
set_cell_bg(code3_cell, 'F3F4F6')
c3_p = code3_cell.paragraphs[0]
c3_run = c3_p.add_run(
    'const articles = await db.article.findMany({\n'
    '  where: { published: true },\n'
    '  select: { slug: true, createdAt: true },\n'
    '})\n'
    'const articlePages = articles.map((a) => ({\n'
    '  loc: `${baseUrl}/insights/${a.slug}`,\n'
    '  lastmod: a.createdAt.toISOString().split(\'T\')[0],\n'
    '  priority: \'0.7\',\n'
    '  changefreq: \'monthly\',\n'
    '}))'
)
c3_run.font.name = 'Consolas'
c3_run.font.size = Pt(9)

doc.add_page_break()

# ============================================================
# 7. MEASURING SUCCESS
# ============================================================
add_h1('7. Measuring success — what to track')

add_para(
    'Once you publish your first article, set up tracking so you can see what\'s working. '
    'These are the 4 metrics that matter most for blog SEO:'
)

metrics = doc.add_table(rows=5, cols=3)
metrics.style = 'Light Grid Accent 1'
metrics.alignment = WD_TABLE_ALIGNMENT.CENTER
hdrs = ['Metric', 'Where to check', 'Target (per article, 90 days post-publish)']
for i, h in enumerate(hdrs):
    p = metrics.rows[0].cells[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
    set_cell_bg(metrics.rows[0].cells[i], '0F1A1F')

metrics_data = [
    ('Indexed pages', 'GSC → Pages', '100% of articles indexed within 2 weeks'),
    ('Impressions', 'GSC → Performance → filter by URL prefix /insights/', '500+ per article'),
    ('Clicks', 'GSC → Performance', '20+ per article (CTR 4%+ from Google)'),
    ('Average position', 'GSC → Performance → Average position column', '< 20 for primary keyword'),
]

for i, (m, where, target) in enumerate(metrics_data, start=1):
    cells = metrics.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(m)
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(where)
    r2.font.size = Pt(9)
    p3 = cells[2].paragraphs[0]
    r3 = p3.add_run(target)
    r3.font.size = Pt(9)
    r3.font.italic = True

doc.add_paragraph()

add_h2('Tools to use')

add_bullet('Google Search Console (free) — already set up. Check Performance → Pages weekly.')
add_bullet('Google Analytics 4 (free) — set up via env var. Track /insights/* page views.')
add_bullet('Ahrefs Webmaster Tools (free) — backlinks + keyword tracking.')
add_bullet('Answer The Public (free tier) — find what questions people ask about your topic.')
add_bullet('Google Trends (free) — spot rising topics before competitors write about them.')

doc.add_page_break()

# ============================================================
# 8. QUICK WINS
# ============================================================
add_h1('8. Quick wins — first 3 articles to publish this week')

add_para(
    'If you only have time to write 3 articles this week, write these. They target high-volume, '
    'low-competition keywords and are the fastest path to your first organic traffic:'
)

add_h3('#1 — "Software Engineer Salary in Bengaluru (2026 Edition)"')
add_bullet('Target keyword: "software engineer salary bengaluru" — 12K/month, LOW competition')
add_bullet('Length: 2,000 words')
add_bullet('Structure: salary by experience (0-2 yrs / 3-5 yrs / 6-10 yrs / 10+), salary by company type (services vs product vs startup), salary by tech stack, negotiation tips')
add_bullet('CTA: Browse software engineer jobs in Bengaluru')
add_bullet('Why it works: Bengaluru has the highest concentration of software engineers in India. This is the most-searched salary query.')

add_h3('#2 — "How to Write an ATS-Friendly Resume (With Examples)"')
add_bullet('Target keyword: "ats friendly resume" — 18K/month, MEDIUM competition')
add_bullet('Length: 2,500 words')
add_bullet('Structure: what ATS is, how it parses resumes, 5 formatting rules, 3 before/after examples, common mistakes')
add_bullet('CTA: Try our free ATS Score Checker + AI Resume Optimizer')
add_bullet('Why it works: directly promotes your AI tools (high conversion).')

add_h3('#3 — "Top 10 Companies Hiring Freshers in Bengaluru (Sept 2026)"')
add_bullet('Target keyword: "fresher jobs bengaluru" — 22K/month, MEDIUM competition')
add_bullet('Length: 1,500 words')
add_bullet('Structure: brief intro, 10 company cards (logo, open fresher roles, salary range, application link), how to apply, tips for freshers')
add_bullet('CTA: Browse all fresher jobs in Bengaluru')
add_bullet('Why it works: directly drives job-page traffic + captures high-volume fresher search intent.')

add_callout(
              'Action plan: write article #1 today, #2 tomorrow, #3 by end of week. '
              'In 4-6 weeks, expect 200-500 monthly organic visitors from these 3 articles alone.',
              color=EMERALD, bg='D1FAE5'
)

# ============================================================
# 9. COMMON MISTAKES
# ============================================================
add_h1('9. Common content mistakes to avoid')

add_bullet('Don\'t write 500-word "blog posts" — they won\'t rank. Aim for 1,500+ words.',
           bold_prefix='Too short: ')
add_bullet('Don\'t keyword-stuff. Use your target keyword 3-5 times naturally in 2,000 words.',
           bold_prefix='Stuffing: ')
add_bullet('Don\'t publish without internal links. Every article must link to jobs/tools.',
           bold_prefix='No links: ')
add_bullet('Don\'t copy-paste from other sites. Google penalizes duplicate content.',
           bold_prefix='Copying: ')
add_bullet('Don\'t use AI to mass-generate thin content. Each article should solve a real problem.',
           bold_prefix='AI spam: ')
add_bullet('Don\'t ignore the title tag. <title> is the #1 on-page ranking factor.',
           bold_prefix='Title: ')
add_bullet('Don\'t forget the meta description. It affects CTR even if not rankings.',
           bold_prefix='Meta desc: ')
add_bullet('Don\'t publish and forget. Update articles every 6 months to keep them fresh.',
           bold_prefix='Set-and-forget: ')

doc.add_page_break()

# ============================================================
# 10. SUMMARY
# ============================================================
add_h1('10. Summary — your 90-day blog plan')

plan = doc.add_table(rows=4, cols=2)
plan.style = 'Light Grid Accent 1'
hdrs = ['Phase', 'What to do']
for i, h in enumerate(hdrs):
    p = plan.rows[0].cells[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
    set_cell_bg(plan.rows[0].cells[i], '0F1A1F')

plan_data = [
    ('Week 1-2',
     'Implement /insights/[slug] route. Write first 2 articles from the calendar above. Add Article schema + FAQ schema to each. Submit URLs to GSC for indexing.'),
    ('Week 3-8',
     'Publish 1 article per week. Track impressions in GSC. After 4 weeks, identify which articles are getting traction and double-down on that topic cluster.'),
    ('Week 9-12',
     'You should have 6-10 articles live, with 500-2000 monthly organic visitors. Update underperforming articles. Write 2 "pillar" pieces (3,000+ words) targeting broader keywords.'),
]

for i, (phase, action) in enumerate(plan_data, start=1):
    cells = plan.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(phase)
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(action)
    r2.font.size = Pt(10)

doc.add_paragraph()

add_callout(
              'The single most important thing: ship your first 3 articles this week. '
              'Even if they\'re not perfect, even if the SEO isn\'t optimized — get them '
              'live. Google takes 4-8 weeks to index + rank new content, so the clock '
              'starts the moment you publish.',
              color=EMERALD, bg='D1FAE5'
)

# Save
output_path = '/home/z/my-project/download/Hirebase_Blog_Content_Strategy.docx'
doc.save(output_path)
print(f'Document saved: {output_path}')
print(f'Size: {os.path.getsize(output_path) / 1024:.1f} KB')
