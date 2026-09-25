import { NextResponse } from 'next/server'
import { JOB_DOMAINS } from '@/lib/job-domains'

/**
 * GET /sitemap-domains.xml
 *
 * Sitemap for job domain landing pages: /jobs/ai-ml, /jobs/vlsi-embedded, etc.
 */
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  const urls = JOB_DOMAINS.map((domain) => ({
    loc: `${baseUrl}/jobs/${domain.slug}`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.8',
  }))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
