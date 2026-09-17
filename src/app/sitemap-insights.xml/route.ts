import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /sitemap-insights.xml — blog/insights articles
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  const articles = await db.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  })

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  xml += `  <url><loc>${baseUrl}/insights</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
  for (const a of articles) {
    const lastmod = a.updatedAt.toISOString().split('T')[0]
    xml += `  <url><loc>${baseUrl}/insights/${a.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`
  }
  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
