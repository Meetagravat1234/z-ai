import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /sitemap-companies.xml — company detail pages
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'

  const companies = await db.company.findMany({
    select: { slug: true, updatedAt: true },
    take: 50000,
  })

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const c of companies) {
    const lastmod = c.updatedAt.toISOString().split('T')[0]
    xml += `  <url><loc>${baseUrl}/companies/${c.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
