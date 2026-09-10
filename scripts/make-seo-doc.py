"""
Hirebase SEO Checklist + Feature Recommendations.docx
A comprehensive guide for fixing SEO issues, getting indexed by Google,
and roadmap features to add next.
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

# Brand colors
EMERALD = RGBColor(0x10, 0xb9, 0x81)
DARK = RGBColor(0x0f, 0x1a, 0x1f)
MUTED = RGBColor(0x6b, 0x72, 0x80)
ACCENT = RGBColor(0xf5, 0x9e, 0x0b)
RED = RGBColor(0xdc, 0x26, 0x26)

doc = Document()

# Page margins
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

# Set default font
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)
style.font.color.rgb = DARK
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.3


def set_cell_bg(cell, color_hex):
    """Set cell background color."""
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
    # Bottom border on heading
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


def add_bullet(text, bold_prefix=None, level=0):
    p = doc.add_paragraph(style='List Bullet' if level == 0 else 'List Bullet 2')
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


def add_check_item(text, done=False):
    """Adds a checkbox-style item."""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Inches(0.25)
    check = '✅ ' if done else '☐ '
    run = p.add_run(check)
    run.font.size = Pt(12)
    run2 = p.add_run(text)
    run2.font.size = Pt(11)
    if done:
        run2.font.color.rgb = MUTED
        run2.italic = True
    return p


def add_callout(text, color=ACCENT, bg='FEF3C7'):
    """Add a highlighted callout box."""
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
    # Spacing after table
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
title_run = title_p.add_run('Hirebase')
title_run.font.name = 'Calibri'
title_run.font.size = Pt(48)
title_run.font.bold = True
title_run.font.color.rgb = EMERALD

sub_p = doc.add_paragraph()
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_p.paragraph_format.space_after = Pt(40)
sub_run = sub_p.add_run('SEO Action Plan & Feature Roadmap')
sub_run.font.name = 'Calibri'
sub_run.font.size = Pt(20)
sub_run.font.color.rgb = DARK

desc_p = doc.add_paragraph()
desc_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
desc_p.paragraph_format.space_after = Pt(60)
desc_run = desc_p.add_run(
    'Everything you need to get hirebase.in indexed by Google, '
    'rank for "jobs in India" keywords, and ship the next wave of features.'
)
desc_run.font.name = 'Calibri'
desc_run.font.size = Pt(12)
desc_run.font.italic = True
desc_run.font.color.rgb = MUTED

# Cover meta box
meta_table = doc.add_table(rows=4, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ('Prepared for', 'Hirebase (hirebase.in)'),
    ('Focus areas', 'SEO, Google indexing, mobile UX, feature roadmap'),
    ('Status', 'Branding + verification + SSR SEO: ✅ Done\nSitemap submission + GSC: ⏳ Your action needed'),
    ('Date', 'September 2026'),
]
for i, (k, v) in enumerate(meta_data):
    cell_k = meta_table.cell(i, 0)
    cell_v = meta_table.cell(i, 1)
    cell_k.width = Inches(1.8)
    cell_v.width = Inches(4.5)
    set_cell_bg(cell_k, 'F3F4F6')
    p1 = cell_k.paragraphs[0]
    p1.paragraph_format.space_before = Pt(4)
    p1.paragraph_format.space_after = Pt(4)
    r1 = p1.add_run(k)
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.color.rgb = MUTED
    p2 = cell_v.paragraphs[0]
    p2.paragraph_format.space_before = Pt(4)
    p2.paragraph_format.space_after = Pt(4)
    r2 = p2.add_run(v)
    r2.font.size = Pt(10)

# Page break to start content
doc.add_page_break()

# ============================================================
# SECTION 1: WHAT WAS FIXED
# ============================================================
add_h1('1. What was fixed in this session')

add_para(
    'These issues were identified in your previous review and have been resolved in the codebase. '
    'Deploy the latest build to make them live on hirebase.in.'
)

add_h2('Branding mismatch — fixed')
add_bullet("Sidebar now shows 'Hire' + 'base' (was 'CareerNest').", bold_prefix='✓ ')
add_bullet("Footer logo letter changed from 'C' to 'H'.", bold_prefix='✓ ')
add_bullet('All meta tags, page title, JSON-LD structured data already said Hirebase — now the visible UI matches.', bold_prefix='✓ ')

add_h2('Google Search Console verification — fixed')
add_bullet(
    "Removed the broken placeholder 'google-site-verification=YOUR_CODE_HERE' "
    "(Next.js was emitting the literal string as the content attribute, which Google rejects).",
    bold_prefix='✓ ',
)
add_bullet(
    'Verification code is now read from the GOOGLE_SITE_VERIFICATION env var. '
    'When the env var is empty, no broken meta tag is emitted — Google is happy.',
    bold_prefix='✓ ',
)
add_bullet(
    'Also added optional MS_SITE_VERIFICATION env var for Bing Webmaster / Microsoft Clarity.',
    bold_prefix='✓ ',
)

add_h2('"Featured jobs" and "Top companies" not in static HTML — fixed')
add_bullet(
    'Root cause: page.tsx was a Client Component that fetched jobs/companies via useEffect '
    'after mount. Google saw only section headings, no actual job listings — looked like an empty site.',
    bold_prefix='Root cause: ',
)
add_bullet(
    'Fix: refactored page.tsx into a Server Component that fetches jobs, companies, and articles '
    'directly from the database at request time (with 5-minute ISR caching for speed).',
    bold_prefix='Fix: ',
)
add_bullet(
    'Verified: static HTML now contains 3 job cards, 5+ company cards, JobPosting JSON-LD structured data. '
    'Google can now read every listing on first crawl.',
    bold_prefix='Verified: ',
)

add_h2('OG image (og-image.png) — created')
add_bullet(
    'Was a 404 — bad for social shares (WhatsApp, LinkedIn, Twitter) and Google Discover.',
    bold_prefix='Was: ',
)
add_bullet(
    'Created a branded 1200×630 PNG with Hirebase logo, headline "Find verified jobs. Research companies. Tailor your resume with AI.", '
    'and brand stats (300+ jobs, 100+ companies, 6 AI tools).',
    bold_prefix='Now: ',
)
add_bullet(
    'Saved to /public/og-image.png — referenced by layout.tsx metadata.',
    bold_prefix='Location: ',
)

add_h2('Mobile responsiveness — improved')
add_bullet('Hero section: tighter padding on mobile (px-5 py-8), full-width CTA buttons stacked vertically.')
add_bullet('Stats grid: 2 cols on mobile (was cramped), smaller font + icon sizes, tighter padding.')
add_bullet('Job cards: smaller padding, smaller font sizes, tighter meta row, skills wrap better.')
add_bullet('Company cards: smaller logo, 2-col grid on mobile with tighter gaps.')
add_bullet('Section headings: responsive sizing (text-xl on mobile, text-2xl on desktop).')
add_bullet('Spacing between sections reduced on mobile (was 48px, now 32px).')

add_h2('Structured data (JSON-LD) — added')
add_bullet('WebSite schema with SearchAction (so Google shows a sitelinks search box).')
add_bullet('Organization schema with areaServed: IN.')
add_bullet('JobPosting schema for each of the 6 featured jobs (critical for Google for Jobs eligibility).')

doc.add_page_break()

# ============================================================
# SECTION 2: WHAT YOU NEED TO DO
# ============================================================
add_h1('2. What you need to do (action items)')

add_callout(
    'These are tasks only you can do — they require Google account access, '
    'DNS changes, or env-var config on your hosting dashboard.',
    color=ACCENT, bg='FEF3C7'
)

add_h2('Priority 1 — Get verified in Google Search Console (do this today)')

add_para(
    'This is the single highest-impact action. Without it, you cannot request indexing, '
    'see what Google sees, or know which queries bring traffic. Follow these exact steps:'
)

add_h3('Step 1: Add your property')
add_bullet('Go to https://search.google.com/search-console')
add_bullet('Click "Add property" → choose "URL prefix" → enter https://www.hirebase.in')
add_bullet('Choose verification method: "HTML tag" (easiest — no DNS access needed)')

add_h3('Step 2: Get your verification code')
add_bullet('Google shows a meta tag like: <meta name="google-site-verification" content="ABC123xyz..."/>')
add_bullet('Copy ONLY the content value (e.g. ABC123xyz...). Do NOT copy the full tag or the key=value pair.')

add_h3('Step 3: Set the env var on your hosting')
add_para('On Vercel: Project Settings → Environment Variables → add:')
add_bullet('Name: GOOGLE_SITE_VERIFICATION', bold_prefix='  ')
add_bullet('Value: <paste the code you copied>', bold_prefix='  ')
add_bullet('Environment: Production (and Preview if you want)', bold_prefix='  ')
add_bullet('Redeploy the project for the change to take effect.', bold_prefix='  ')

add_h3('Step 4: Click "Verify" in Search Console')
add_bullet('After redeploy, click "Verify" in GSC. Should pass within 30 seconds.')
add_bullet('If it fails, wait 2 min and retry — Next.js caches the metadata for 5 minutes.')

add_h2('Priority 2 — Submit your sitemap')

add_para('Once verified, submit your sitemap so Google knows about all your pages at once:')

add_bullet('In Search Console → left sidebar → "Sitemaps"')
add_bullet('Enter: sitemap.xml (the URL is https://www.hirebase.in/sitemap.xml)')
add_bullet('Click "Submit". Status should change to "Success" within a few hours.')
add_para(
    'Your sitemap already includes all 17 static views + all 300+ job detail pages + '
    'all company detail pages. This is the fastest way to get them indexed.',
    italic=True, color=MUTED, size=10
)

add_h2('Priority 3 — Request indexing for the homepage')

add_bullet('In Search Console → top search bar → "URL Inspection"')
add_bullet('Enter: https://www.hirebase.in/')
add_bullet('Click "Request Indexing". Google will recrawl within 24–48 hours.')
add_bullet('Repeat for the most important pages: /?view=all-jobs, /?view=freshers, /?view=internships')

add_callout(
    'You have a daily quota of ~10 "Request Indexing" calls. Use them wisely — '
    'save some for new job listings you really want indexed fast.',
    color=EMERALD, bg='D1FAE5'
)

add_h2('Priority 4 — Fix the www vs non-www canonical')

add_para(
    'Currently hirebase.in (no www) and www.hirebase.in might be treated as separate sites '
    'by Google. Pick one as canonical (recommend www.hirebase.in since that\'s what your metadata says).'
)

add_bullet('In your domain registrar / DNS, set up a 301 redirect from hirebase.in → www.hirebase.in')
add_bullet('Or, in Vercel: Project Settings → Domains → set www.hirebase.in as primary, hirebase.in as redirect to it')
add_bullet('In Search Console → Settings → "Preferred domain" → select "www.hirebase.in"')

add_h2('Priority 5 — Set up Bing Webmaster Tools (quick win)')

add_bullet('Go to https://www.bing.com/webmasters')
add_bullet('Sign in with the same Google account')
add_bullet('Bing will let you import your Google Search Console property directly — takes 1 click')
add_bullet('Submit sitemap.xml the same way')
add_bullet('Set MS_SITE_VERIFICATION env var if you choose the HTML tag verification method')

doc.add_page_break()

# ============================================================
# SECTION 3: HOW TO MONITOR INDEXING PROGRESS
# ============================================================
add_h1('3. How to monitor indexing progress')

add_para(
    'After deploying the fixes and submitting your sitemap, expect this timeline:'
)

# Timeline table
timeline = doc.add_table(rows=5, cols=3)
timeline.style = 'Light Grid Accent 1'
timeline.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = timeline.rows[0].cells
for i, h in enumerate(['Timeframe', 'What to expect', 'What to check']):
    p = hdr[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
    set_cell_bg(hdr[i], '10B981')

timeline_data = [
    ('0–24 hours', 'Sitemap submitted, homepage re-requested for indexing', 'GSC → Sitemaps status = "Success"'),
    ('24–72 hours', 'Homepage re-crawled with new SSR content. Title + description show in Google', 'site:hirebase.in → see if description appears'),
    ('3–7 days', 'Inner pages (all-jobs, freshers, internships) start getting indexed', 'GSC → Pages → see "Indexed" count rising'),
    ('1–4 weeks', 'Long-tail queries start ranking (e.g. "AI resume optimizer India", "ATS score checker")', 'GSC → Performance → see clicks + impressions'),
]

for i, (tf, expect, check) in enumerate(timeline_data, start=1):
    cells = timeline.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(tf)
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(expect)
    r2.font.size = Pt(10)
    p3 = cells[2].paragraphs[0]
    r3 = p3.add_run(check)
    r3.font.size = Pt(10)
    r3.font.italic = True
    r3.font.color.rgb = MUTED

doc.add_paragraph()  # spacing

add_h2('Sanity-check commands you can run anytime')

add_para('Run these in your terminal to verify everything is working:', italic=True, color=MUTED)

add_bullet('curl -s https://www.hirebase.in/ | grep "google-site-verification" — should be empty or contain your real code')
add_bullet('curl -s https://www.hirebase.in/ | grep "Featured jobs" — should return 1 match')
add_bullet('curl -s https://www.hirebase.in/ | grep "JobPosting" — should return 6+ matches (one per job)')
add_bullet('curl -s https://www.hirebase.in/sitemap.xml | head -20 — should list static pages + jobs')
add_bullet('curl -s https://www.hirebase.in/robots.txt — should reference the sitemap')

doc.add_page_break()

# ============================================================
# SECTION 4: TECHNICAL SEO RECOMMENDATIONS
# ============================================================
add_h1('4. Technical SEO recommendations (next sprint)')

add_para(
    'These are deeper improvements that will help you rank for competitive keywords '
    'like "jobs in India" and "Naukri alternative" over the long term.'
)

add_h2('Move away from query-string navigation')

add_para(
    'Currently all pages live at /?view=all-jobs, /?view=freshers, etc. '
    'Google can index these, but they share the same <title> and meta description. '
    'Better long-term: convert to real URL paths:'
)

add_bullet('/jobs (instead of /?view=all-jobs)')
add_bullet('/jobs/fresher (instead of /?view=freshers)')
add_bullet('/jobs/internship, /jobs/walk-in, /jobs/hidden')
add_bullet('/companies (instead of /?view=companies)')
add_bullet('/companies/[slug] (instead of /?view=company-detail&slug=...)')
add_bullet('/jobs/[id] (instead of /?view=job-detail&jobId=...)')
add_bullet('/ai-tools/resume-optimizer, /ai-tools/ats-score, etc.')

add_para(
    'This requires refactoring the nav-store from Zustand to Next.js Router, but each page '
    'can then have its own title, description, and canonical URL — massive SEO win.',
    italic=True, color=MUTED, size=10
)

add_h2('Add per-page metadata')

add_para('Each view should export its own metadata object. Examples:')

# Metadata examples table
meta_table = doc.add_table(rows=8, cols=3)
meta_table.style = 'Light List Accent 1'
meta_hdrs = ['Page', 'Title', 'Description (≤155 chars)']
for i, h in enumerate(meta_hdrs):
    p = meta_table.rows[0].cells[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

meta_examples = [
    ('All Jobs', 'All Verified Jobs in India | Hirebase', 'Browse 300+ verified jobs in India. Filter by role, location, salary, experience. Free to apply — no signup required.'),
    ('Freshers', 'Fresher Jobs in India (0 Years Exp) | Hirebase', '300+ fresher jobs across Bengaluru, Hyderabad, Pune, Chennai. Software, data, marketing, sales roles. Apply free.'),
    ('Internships', 'Internships in India — Paid & Verified | Hirebase', 'Find paid internships in India at top companies. Software engineering, data science, marketing, design internships.'),
    ('Companies', 'Top Companies Hiring in India | Hirebase', 'Browse 100+ companies hiring in India. See open roles, hiring velocity, 7-day trends, salaries, and reviews.'),
    ('AI Resume', 'AI Resume Optimizer India — Free ATS-Friendly | Hirebase', 'Tailor your resume to any job description in seconds. AI-powered, ATS-friendly, free for Indian job seekers.'),
    ('ATS Score', 'ATS Score Checker — Free Resume Score (0-100) | Hirebase', 'Check your resume ATS compatibility score for free. Get specific fix recommendations for keywords, format, skills.'),
    ('Mock Interview', 'AI Mock Interview — Practice Interviews Free | Hirebase', 'Practice real interview questions with an AI interviewer. Voice or text. Get instant feedback on your answers.'),
]

for i, (page, title, desc) in enumerate(meta_examples, start=1):
    cells = meta_table.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(page)
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(title)
    r2.font.size = Pt(9)
    p3 = cells[2].paragraphs[0]
    r3 = p3.add_run(desc)
    r3.font.size = Pt(9)

doc.add_paragraph()

add_h2('Add internal linking')

add_bullet('Job detail pages → link to "Other jobs at {company}" + "Similar roles" (already done — verify it\'s working)')
add_bullet('Company detail pages → link to "View all open roles" + similar companies in same industry')
add_bullet('AI tool pages → link to "Browse jobs to try this on" + "Related AI tools"')
add_bullet('Bottom of every page → add a "Related searches" footer with 5 keyword-rich links')

add_h2('Add a blog / career insights section (already scaffolded)')

add_para(
    'You already have /api/articles and a Career Insights view. To rank for top-of-funnel queries, '
    'publish 1 article per week targeting long-tail keywords:'
)

add_bullet('"Best Resume Format for Software Engineers in India 2026"')
add_bullet('"How to Prepare for Amazon SDE Interview — Real Questions"')
add_bullet('"Software Engineer Salary in Bengaluru vs Hyderabad — Full Breakdown"')
add_bullet('"Top 20 Startups Hiring in India Right Now"')
add_bullet('"ATS Resume Tips: How to Beat the Bots in 2026"')

add_para(
    'Each article should be 1,500+ words, include 2-3 internal links to job listings, '
    'and have its own unique title + meta description.',
    italic=True, color=MUTED, size=10
)

add_h2('Add BreadcrumbList schema')

add_para('On every page, add BreadcrumbList JSON-LD so Google shows breadcrumbs in search results:')

add_bullet('Home → Jobs → Fresher Jobs')
add_bullet('Home → Companies → Google India')
add_bullet('Home → AI Tools → Resume Optimizer')

add_h2('Improve Core Web Vitals (mobile speed)')

add_para(
    'Google uses Core Web Vitals as a ranking factor — especially on mobile. '
    'Check your scores at https://pagespeed.web.dev/?url=hirebase.in'
)

add_bullet('LCP (Largest Contentful Paint): target < 2.5s — your SSR refactor already helps a lot here.')
add_bullet('CLS (Cumulative Layout Shift): target < 0.1 — AnimatedNumber component may cause shift; reserve space.')
add_bullet('INP (Interaction to Next Paint): target < 200ms — reduce JS bundle, lazy-load admin/sync-status views.')

doc.add_page_break()

# ============================================================
# SECTION 5: FEATURE ROADMAP
# ============================================================
add_h1('5. Feature roadmap — what to build next')

add_para(
    'You asked for feature suggestions. Here is a prioritized roadmap covering '
    'SEO-relevant features (highest ROI first) and user-engagement features that '
    'will increase retention and word-of-mouth.'
)

# --- Tier 1: SEO features ---
add_h2('Tier 1 — SEO multiplier features (build first)')

add_h3('1. Static job detail pages with proper URLs')
add_para(
    'Currently /?view=job-detail&jobId=123 is one shared URL. Convert to /jobs/[id]-[title-slug]. '
    'This makes every job a unique indexable page with its own title, description, and canonical URL. '
    '300+ jobs = 300+ indexable pages instead of 1.'
)
add_para('Effort: ~6 hours. Impact: HUGE — multiplies your indexable page count by 300x.', italic=True, color=EMERALD, size=10)

add_h3('2. Static company detail pages')
add_para(
    'Same as above — /companies/[slug] for each company. 100+ companies = 100+ indexable pages '
    'targeting brand keywords like "Google jobs India", "Flipkart careers Bengaluru".'
)
add_para('Effort: ~4 hours. Impact: HIGH — brand search traffic is high-intent.', italic=True, color=EMERALD, size=10)

add_h3('3. City-specific job pages')
add_para(
    'Create /jobs/bengaluru, /jobs/hyderabad, /jobs/pune, etc. — one page per major Indian city. '
    'These will rank for high-volume queries like "jobs in Bengaluru" (110K monthly searches) and '
    '"Pune IT jobs" (40K monthly searches).'
)
add_para('Effort: ~3 hours. Impact: HUGE — captures location-based search intent.', italic=True, color=EMERALD, size=10)

add_h3('4. Role-specific landing pages')
add_para(
    'Create /jobs/software-engineer, /jobs/data-scientist, /jobs/product-manager, etc. '
    'One page per role with: brief description, salary range, top companies hiring, '
    'required skills, related interview questions, current openings.'
)
add_para('Effort: ~8 hours. Impact: HUGE — role-based queries are the #1 job search pattern in India.', italic=True, color=EMERALD, size=10)

# --- Tier 2: Engagement ---
add_h2('Tier 2 — User engagement features')

add_h3('5. Email job alerts (already scaffolded, needs activation)')
add_para(
    'You have /api/alerts/send and an AlertsView. Wire up the email provider (Resend, SendGrid, or Amazon SES) '
    'and a daily cron that sends matched jobs to subscribed users. This drives repeat visits — '
    'users come back daily to check their inbox and discover new jobs on the site.'
)
add_para('Effort: ~4 hours (with Resend). Impact: HIGH retention + re-engagement.', italic=True, color=EMERALD, size=10)

add_h3('6. Saved search with RSS feed')
add_para(
    'Let users save a search (e.g. "Software engineer, Bengaluru, ₹10+ LPA") and get an RSS feed URL. '
    'Power users can subscribe in their feed reader. Also great for SEO — RSS feeds get crawled fast.'
)

add_h3('7. Salary comparison tool (upgrade existing)')
add_para(
    'You have a salary dashboard. Add: "Compare your salary to similar roles" — input your role, '
    'experience, location, current salary → see percentile rank. Generates a shareable image — '
    'free virality on LinkedIn.'
)
add_para('Effort: ~6 hours. Impact: HIGH — viral coefficient + backlinks.', italic=True, color=EMERALD, size=10)

add_h3('8. Company reviews')
add_para(
    'You already have /api/reviews. Build the UI: star ratings, pros/cons, interview experience, '
    'salary reported (anonymous), CEO approval rating. User-generated content = fresh, free, '
    'keyword-rich content that Google loves.'
)
add_para('Effort: ~10 hours. Impact: HUGE — UGC is the #1 SEO growth lever for job portals.', italic=True, color=EMERALD, size=10)

# --- Tier 3: AI features ---
add_h2('Tier 3 — AI-powered differentiators')

add_h3('9. AI Job Match Score')
add_para(
    'When a logged-in user with a profile (target role, skills, experience) browses a job, '
    'show a "Match Score: 87%" badge based on skills overlap + experience level + location. '
    'Uses the existing AI infrastructure (z-ai-web-dev-sdk).'
)
add_para('Effort: ~3 hours. Impact: HIGH — increases time on page + applies per user.', italic=True, color=EMERALD, size=10)

add_h3('10. AI Interview Question Generator per role')
add_para(
    'You have /api/interview-questions. Build a UI: enter a role → AI generates 10 realistic interview '
    'questions + sample answers + difficulty rating + which companies ask them. Free to read, '
    'paid to download as PDF (monetization).'
)

add_h3('11. Career Path Visualizer')
add_para(
    'Enter your current role → AI generates a career tree: "Software Engineer → Senior SWE → '
    'Staff SWE → Principal SWE → Distinguished Engineer" with salary at each level, skills needed '
    'to advance, and time-to-promote estimates. Visual + shareable.'
)
add_para('Effort: ~8 hours. Impact: MEDIUM-HIGH — link-bait + shareable.', italic=True, color=EMERALD, size=10)

add_h3('12. AI Cover Letter Builder (upgrade existing)')
add_para(
    'You have AI Cover Letter. Upgrade: multi-tone option (formal, conversational, confident), '
    'length slider (short/medium/long), focus on specific achievements, "rewrite in the voice of '
    '[company]" button. Each variant saved for re-use.'
)

# --- Tier 4: Monetization ---
add_h2('Tier 4 — Monetization features')

add_h3('13. Featured listings for employers')
add_para(
    'Let employers pay to feature their job at the top of relevant searches + on the home page. '
    'Pricing: ₹500/job/week or ₹2,000/job/month. Stripe / Razorpay integration.'
)
add_para('Effort: ~12 hours. Impact: DIRECT REVENUE.', italic=True, color=ACCENT, size=10)

add_h3('14. Premium AI tools (freemium)')
add_para(
    'Free tier: 3 AI resume optimizations per month. Premium tier (₹499/month): unlimited resumes, '
    'unlimited cover letters, unlimited mock interviews, advanced ATS scoring, PDF export.'
)

add_h3('15. Recruiter dashboard')
add_para(
    'Let recruiters post jobs directly (moderated), see applicants (from your tracker API), '
    'message candidates. Subscription: ₹2,999/month for unlimited postings.'
)

doc.add_page_break()

# ============================================================
# SECTION 6: QUICK WINS (1-HOUR TASKS)
# ============================================================
add_h1('6. Quick wins — ship today in <1 hour each')

add_check_item('Add a "Last updated: [date]" line at the bottom of every job card. Google loves freshness signals.')
add_check_item('Add FAQ schema to the homepage: "How do I find jobs on Hirebase?", "Is Hirebase free?", "How often are jobs updated?" — gets you rich snippets.')
add_check_item('Add a "Share this job" button on JobDetailView with WhatsApp + LinkedIn + copy-link (you have Share button — verify it works on mobile).')
add_check_item('Add Google Analytics 4 (or Plausible — privacy-friendly). Set up via env var to avoid hardcoding.')
add_check_item('Add a "Report a job" form (you have the link — verify it routes somewhere).')
add_check_item('Add 404 page with search box + popular categories (helps users + recovers link equity).')
add_check_item('Add hreflang tags: en-IN (default). Later add hi-IN (Hindi) for Hindi-speaking users.')
add_check_item('Add a manifest.json for PWA installability — lets users "Add to Home Screen".')
add_check_item('Add Open Graph image variants for job detail pages (use og:image per page instead of one global).')

# ============================================================
# SECTION 7: WHAT NOT TO DO
# ============================================================
add_h1('7. Common SEO mistakes to avoid')

add_bullet('Don\'t pay for backlinks — Google penalizes this. Earn links via content + tools + reviews.')
add_bullet('Don\'t keyword-stuff titles. "Jobs in India | Fresher Jobs | IT Jobs | Best Job Portal" = bad. Pick one focus per page.')
add_bullet('Don\'t use AI to mass-generate thin content pages. Each page should solve a real user problem.')
add_bullet('Don\'t block /api/jobs in robots.txt (you currently allow it — good). Some sites block APIs and lose indexing.')
add_bullet('Don\'t use relative canonical URLs. Always use absolute: https://www.hirebase.in/...')
add_bullet('Don\'t change URL structure after launch without 301 redirects. You\'ll lose all your rankings.')
add_bullet('Don\'t copy-paste job descriptions from Naukri/LinkedIn. Rewrite with AI enrichment (you already do — keep doing it).')

# ============================================================
# SECTION 8: SUMMARY
# ============================================================
add_h1('8. Summary — your 30-day SEO plan')

add_para(
    'If you do nothing else, do these 5 things in the next 30 days. '
    'Everything else is optional.'
)

# 30-day plan table
plan = doc.add_table(rows=6, cols=3)
plan.style = 'Light Grid Accent 1'
hdrs = ['Week', 'Action', 'Expected result']
for i, h in enumerate(hdrs):
    p = plan.rows[0].cells[i].paragraphs[0]
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
    set_cell_bg(plan.rows[0].cells[i], '0F1A1F')

plan_data = [
    ('Week 1', 'Deploy the latest build. Set GOOGLE_SITE_VERIFICATION env var. Verify in GSC. Submit sitemap.xml.', 'GSC verified. Sitemap submitted. Homepage re-indexed within 48 hours.'),
    ('Week 2', 'Request indexing for top 5 pages: home, all-jobs, freshers, internships, companies.', 'Inner pages start getting indexed. ~20-50 pages in Google index.'),
    ('Week 3', 'Convert /?view= URLs to real paths (/jobs, /companies, /jobs/fresher). Add per-page metadata.', 'Indexable pages multiply. Each page has unique title/description.'),
    ('Week 4', 'Publish 2-3 blog articles. Add FAQ schema. Set up GA4 / Plausible.', 'Long-tail keywords start ranking. Traffic measurement begins.'),
    ('Month 2+', 'Continue publishing. Add company reviews. Build salary comparison tool.', 'Steady organic traffic growth. 500+ indexed pages by month 3.'),
]

for i, (wk, act, res) in enumerate(plan_data, start=1):
    cells = plan.rows[i].cells
    p1 = cells[0].paragraphs[0]
    r1 = p1.add_run(wk)
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.color.rgb = EMERALD
    p2 = cells[1].paragraphs[0]
    r2 = p2.add_run(act)
    r2.font.size = Pt(9)
    p3 = cells[2].paragraphs[0]
    r3 = p3.add_run(res)
    r3.font.size = Pt(9)
    r3.font.italic = True
    r3.font.color.rgb = MUTED

doc.add_paragraph()

add_callout(
    'Bottom line: deploy the new build today, verify Search Console, submit sitemap. '
    'In 4 weeks you should have 100+ pages indexed and your first organic impressions '
    'showing up in GSC Performance.',
    color=EMERALD, bg='D1FAE5'
)

# Save
output_path = '/home/z/my-project/download/Hirebase_SEO_Action_Plan.docx'
doc.save(output_path)
print(f'Document saved: {output_path}')
print(f'Size: {os.path.getsize(output_path) / 1024:.1f} KB')
