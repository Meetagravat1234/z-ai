import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /sitemap-skill-tests.xml — skill test detail pages
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  const tests = await db.skillTest.findMany({
    where: { isPublished: true },
    select: { id: true },
  })

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  xml += `  <url><loc>${baseUrl}/skill-tests</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
  for (const t of tests) {
    xml += `  <url><loc>${baseUrl}/skill-tests/${t.id}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
