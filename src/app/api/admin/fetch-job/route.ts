import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getZai } from '@/lib/zai-loader'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'
import crypto from 'crypto'

// POST /api/admin/fetch-job
// Body: { url: string, overrideTitle?: string, overrideCompany?: string }
// Returns: { preview: { title, company, location, description, skills, ... } }
// POST /api/admin/fetch-job?save=true — saves the fetched job directly
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { url, overrideTitle, overrideCompany } = await req.json()
    if (!url || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: 'A valid URL (starting with http:// or https://) is required' }, { status: 400 })
    }

    // Step 1: Fetch the page content using z-ai-web-dev-sdk page_reader
    const zai = await getZai()
    const pageData: any = await zai.functions.invoke('page_reader', { url })

    if (!pageData || !pageData.data) {
      return NextResponse.json({ error: 'Failed to fetch the page. The URL might be blocked or invalid.' }, { status: 422 })
    }

    const pageTitle = pageData.data.title || ''
    const html = pageData.data.html || ''
    const publishedTime = pageData.data.publishedTime || pageData.data.publish_time

    // Strip HTML to plain text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000)

    if (text.length < 100) {
      return NextResponse.json({ error: 'Page content is too short to be a real job posting.' }, { status: 422 })
    }

    // Step 2: AI enrichment — extract structured fields from the raw text
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert job post parser. Given the raw text of a job page (scraped from any URL), extract structured fields.

Output STRICT JSON (no markdown fences) with this shape:
{
  "title": "<the job title>",
  "company": "<the hiring company name>",
  "location": "<city, country — extract from text; if remote, say 'Remote'>",
  "description": "<a clean, well-formatted version of the job description, 3-6 paragraphs in Markdown with ## headings for sections like 'About the role', 'What you'll do', 'Required qualifications', 'Benefits'>",
  "skills": ["<skill1>", "<skill2>", ...up to 8],
  "experience": "<one of: '0 Years' | '0-2 Years' | '1-3 Years' | '3-5 Years' | '5-8 Years' | '8+ Years'>",
  "category": "<one of: 'fresher' | 'internship' | 'experienced' | 'remote' | 'walk-in'>",
  "employmentType": "<'Full-time' | 'Part-time' | 'Contract' | 'Internship'>",
  "workMode": "<'Onsite' | 'Remote' | 'Hybrid'>",
  "salaryMin": <number or null, in LPA × 10 (e.g. 8 LPA = 80)>,
  "salaryMax": <number or null, in LPA × 10>
}

Rules:
- If the job title contains 'intern' or 'internship', set category='internship' and employmentType='Internship'
- If 'fresher', 'entry level', 'new grad', '0 years', or 'associate' appears, set category='fresher'
- If location mentions 'remote' or 'work from anywhere', set workMode='Remote'
- Convert any USD salary to INR LPA equivalent (1 USD ≈ ₹83, so $100k ≈ ₹83 LPA → 830)
- If salary isn't mentioned, return null for both
- Be conservative on skills — only include ones actually mentioned`
        },
        {
          role: 'user',
          content: `PAGE TITLE: ${pageTitle}
PAGE URL: ${url}
PUBLISHED AT: ${publishedTime || 'unknown'}

RAW PAGE TEXT:
${text}

Extract the structured job fields.`
        }
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    let parsed: any
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        title: pageTitle,
        company: 'Unknown',
        location: 'Not specified',
        description: text.slice(0, 4000),
        skills: [],
        experience: '0-2 Years',
        category: 'experienced',
        employmentType: 'Full-time',
        workMode: 'Onsite',
        salaryMin: null,
        salaryMax: null,
      }
    }

    // Apply overrides
    if (overrideTitle) parsed.title = overrideTitle
    if (overrideCompany) parsed.company = overrideCompany

    // Step 3: If ?save=true, save it to the database
    const shouldSave = new URL(req.url).searchParams.get('save') === 'true'
    if (shouldSave) {
      // Find or create the company
      const slug = (parsed.company || 'unknown').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
      let company = await db.company.findUnique({ where: { slug } })
      if (!company) {
        company = await db.company.create({
          data: {
            name: parsed.company || 'Unknown',
            slug,
            hiringActivity: 'Medium',
            sevenDayTrend: 0,
            verified: true,
          },
        })
      }

      const hash = crypto
        .createHash('sha1')
        .update(`${parsed.title}|${company.id}|${(parsed.location || '').split(',')[0].trim()}`)
        .digest('hex')

      // Check for existing
      const existing = await db.job.findFirst({ where: { hash } })
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Job already exists in database', existing })
      }

      const job = await db.job.create({
        data: {
          title: parsed.title,
          companyId: company.id,
          category: parsed.category || 'experienced',
          employmentType: parsed.employmentType || 'Full-time',
          workMode: parsed.workMode || 'Onsite',
          experience: parsed.experience || '0-2 Years',
          salaryMin: parsed.salaryMin ?? null,
          salaryMax: parsed.salaryMax ?? null,
          salaryCurrency: 'INR',
          location: parsed.location || 'Not specified',
          skills: Array.isArray(parsed.skills) ? parsed.skills.join(',') : '',
          description: parsed.description || text.slice(0, 4000),
          applyUrl: url,
          postedAt: publishedTime ? new Date(publishedTime) : new Date(),
          verified: true,
          isFeatured: false,
          source: 'admin-url',
          sourceRef: `admin-url-${Buffer.from(url).toString('base64').slice(0, 20)}`,
          hash,
          originalDescription: text,
          enriched: true,
          enrichedAt: new Date(),
          sourcePostedAt: publishedTime ? new Date(publishedTime) : null,
        },
        include: { company: true },
      })

      return NextResponse.json({ ok: true, saved: true, job })
    }

    // Return preview (not saved)
    return NextResponse.json({
      ok: true,
      saved: false,
      preview: {
        ...parsed,
        applyUrl: url,
        sourcePostedAt: publishedTime,
      },
      rawTextLength: text.length,
      pageTitle,
    })
  } catch (e: any) {
    console.error('Admin fetch-job error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
