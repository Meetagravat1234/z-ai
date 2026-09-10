import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CITY_PAGES, ROLE_PAGES, jobUrl } from '@/lib/seo-routes'

// GET /sitemap.xml — dynamic sitemap for Google
export async function GET() {
  try {
    const baseUrl = 'https://www.hirebase.in'
    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/jobs`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/companies`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/roles`, priority: '0.9', changefreq: 'weekly' },
      // Category pages
      { loc: `${baseUrl}/jobs/fresher`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/jobs/internship`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/jobs/walk-in`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/jobs/hidden`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${baseUrl}/jobs/experienced`, priority: '0.7', changefreq: 'weekly' },
    ]

    // City pages
    const cityPages = CITY_PAGES.map((c) => ({
      loc: `${baseUrl}/jobs/${c.slug}`,
      priority: '0.9',
      changefreq: 'daily',
    }))

    // Role pages
    const rolePages = ROLE_PAGES.map((r) => ({
      loc: `${baseUrl}/roles/${r.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    }))

    // Insights articles
    const articles = await db.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    const articlePages = [
      { loc: `${baseUrl}/insights`, lastmod: null as string | null, priority: '0.8', changefreq: 'weekly' as const },
      ...articles.map((a) => ({
        loc: `${baseUrl}/insights/${a.slug}`,
        lastmod: a.updatedAt.toISOString().split('T')[0],
        priority: '0.7',
        changefreq: 'monthly' as const,
      })),
    ]

    // Job detail pages
    const jobs = await db.job.findMany({
      where: { verified: true },
      select: { id: true, title: true, updatedAt: true },
      take: 1000,
    })
    const jobPages = jobs.map((j) => ({
      loc: `${baseUrl}${jobUrl(j)}`,
      lastmod: j.updatedAt.toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    }))

    // Company detail pages
    const companies = await db.company.findMany({
      select: { slug: true, updatedAt: true },
      take: 500,
    })
    const companyPages = companies.map((c) => ({
      loc: `${baseUrl}/companies/${c.slug}`,
      lastmod: c.updatedAt.toISOString().split('T')[0],
      priority: '0.7',
      changefreq: 'weekly',
    }))

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for (const p of [...staticPages, ...cityPages, ...rolePages, ...articlePages]) {
      xml += `  <url><loc>${p.loc}</loc>`
      if ('lastmod' in p && p.lastmod) xml += `<lastmod>${p.lastmod}</lastmod>`
      xml += `<changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`
    }
    for (const p of [...jobPages, ...companyPages]) {
      xml += `  <url><loc>${p.loc}</loc>`
      if (p.lastmod) xml += `<lastmod>${p.lastmod}</lastmod>`
      xml += `<changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`
    }
    xml += '</urlset>'

    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

