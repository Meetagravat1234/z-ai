import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CITY_PAGES, ROLE_PAGES, jobUrl } from '@/lib/seo-routes'

// GET /sitemap.xml — sitemap INDEX file pointing to multiple sub-sitemaps.
//
// Why a sitemap index instead of one big sitemap?
// - Google limits a single sitemap to 50,000 URLs and 50MB uncompressed.
// - More importantly, Google allocates a CRAWL BUDGET per site (especially
//   for new sites). A single sitemap with 1,400+ URLs gets crawled slowly
//   and most URLs end up "Discovered - currently not indexed".
// - Splitting into prioritized sub-sitemaps lets Google focus on the
//   important pages first (homepage, jobs, companies) and deprioritize
//   less important ones (skill tests, legal pages).
// - This is the #1 fix for the "1,199 pages discovered but not indexed"
//   problem in Google Search Console.
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const today = new Date().toISOString().split('T')[0]

  // Sub-sitemaps — each is a separate file Google can fetch + process
  const subSitemaps = [
    { loc: `${baseUrl}/sitemap-main.xml`, lastmod: today },
    { loc: `${baseUrl}/sitemap-jobs.xml`, lastmod: today },
    { loc: `${baseUrl}/sitemap-companies.xml`, lastmod: today },
    { loc: `${baseUrl}/sitemap-cities.xml`, lastmod: today },
    { loc: `${baseUrl}/sitemap-roles.xml`, lastmod: today },
    { loc: `${baseUrl}/sitemap-insights.xml`, lastmod: today },
    { loc: `${baseUrl}/sitemap-skill-tests.xml`, lastmod: today },
  ]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  for (const s of subSitemaps) {
    xml += `  <sitemap><loc>${s.loc}</loc><lastmod>${s.lastmod}</lastmod></sitemap>\n`
  }
  xml += '</sitemapindex>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

