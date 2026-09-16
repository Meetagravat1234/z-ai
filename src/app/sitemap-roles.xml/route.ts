import { NextResponse } from 'next/server'
import { ROLE_PAGES } from '@/lib/seo-routes'

// GET /sitemap-roles.xml — role landing pages (/roles/software-engineer, etc.)
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const r of ROLE_PAGES) {
    xml += `  <url><loc>${baseUrl}/roles/${r.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
