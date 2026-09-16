import { NextResponse } from 'next/server'
import { CITY_PAGES } from '@/lib/seo-routes'

// GET /sitemap-cities.xml — city landing pages (/jobs/bengaluru, /jobs/hyderabad, etc.)
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const c of CITY_PAGES) {
    xml += `  <url><loc>${baseUrl}/jobs/${c.slug}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
