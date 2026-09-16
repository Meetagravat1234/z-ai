import { NextResponse } from 'next/server'

// GET /sitemap-main.xml — static pages (homepage, AI tools, legal, etc.)
// Only includes pages that are NOT blocked by robots.txt and are valuable
// for search traffic. Excludes /upgrade, /tracker, /alerts (user-only pages
// that were previously causing "Page with redirect" errors in GSC).
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  const pages = [
    // Core pages (highest priority)
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/jobs`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/companies`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/roles`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/insights`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/discover`, priority: '0.8', changefreq: 'daily' },

    // Category pages
    { loc: `${baseUrl}/jobs/fresher`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/jobs/internship`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/jobs/walk-in`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/jobs/hidden`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${baseUrl}/jobs/experienced`, priority: '0.7', changefreq: 'weekly' },

    // AI Tools (free tools — high search value)
    { loc: `${baseUrl}/ai-tools/resume-optimizer`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/ai-tools/ats-score`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/ai-tools/cover-letter`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/ai-tools/mock-interview`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/ai-tools/skill-gap`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/ai-tools/salary-predictor`, priority: '0.7', changefreq: 'monthly' },

    // Other public pages
    { loc: `${baseUrl}/salary-dashboard`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${baseUrl}/question-bank`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${baseUrl}/compare-jobs`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${baseUrl}/skill-tests`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/pricing`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/about`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${baseUrl}/ground-truth`, priority: '0.4', changefreq: 'monthly' },

    // Legal pages (low priority but should be indexed for trust signals)
    { loc: `${baseUrl}/privacy`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${baseUrl}/terms`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${baseUrl}/disclaimer`, priority: '0.4', changefreq: 'monthly' },

    // NOTE: /upgrade, /tracker, /alerts, /profile, /saved, /admin, /auth
    // are intentionally EXCLUDED — they're either user-only pages (require
    // login) or blocked by robots.txt. Including them in the sitemap caused
    // "Page with redirect" and "Crawled - currently not indexed" errors.
  ]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const p of pages) {
    xml += `  <url><loc>${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
