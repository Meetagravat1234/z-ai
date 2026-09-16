import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jobUrl } from '@/lib/seo-routes'

// GET /sitemap-jobs.xml — job detail pages (highest-value pages for SEO)
// Includes only verified jobs. Up to 50,000 (Google's per-sitemap limit).
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'

  const jobs = await db.job.findMany({
    where: { verified: true },
    select: { id: true, title: true, updatedAt: true },
    take: 50000,
  })

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const j of jobs) {
    const lastmod = j.updatedAt.toISOString().split('T')[0]
    xml += `  <url><loc>${baseUrl}${jobUrl(j)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
