import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /sitemap.xml — dynamic sitemap for Google
export async function GET() {
  try {
    const baseUrl = 'https://www.hirebase.in'
    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/?view=all-jobs`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/?view=freshers`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/?view=internships`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/?view=companies`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/?view=salary-dashboard`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/?view=question-bank`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${baseUrl}/?view=ai-resume`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=ai-cover-letter`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=ai-mock-interview`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=skill-gap`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=ats-score`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=ai-salary`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=insights`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${baseUrl}/?view=compare-jobs`, priority: '0.6', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=auth`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=about`, priority: '0.4', changefreq: 'monthly' },
      { loc: `${baseUrl}/?view=pricing`, priority: '0.4', changefreq: 'monthly' },
    ]

    const jobs = await db.job.findMany({ where: { verified: true }, select: { id: true, updatedAt: true }, take: 500 })
    const companies = await db.company.findMany({ select: { slug: true, updatedAt: true }, take: 200 })

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for (const p of staticPages) {
      xml += `  <url><loc>${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`
    }
    for (const job of jobs) {
      xml += `  <url><loc>${baseUrl}/?view=job-detail&jobId=${job.id}</loc><lastmod>${job.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>\n`
    }
    for (const c of companies) {
      xml += `  <url><loc>${baseUrl}/?view=company-detail&slug=${c.slug}</loc><lastmod>${c.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.7</priority></url>\n`
    }
    xml += '</urlset>'

    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
