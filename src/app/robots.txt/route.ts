import { NextResponse } from 'next/server'

// GET /robots.txt — tells search engines what to crawl
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const body = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API routes
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /api/sync/
Disallow: /api/upload/
Disallow: /api/debug/
Disallow: /api/jobs/ingest
Disallow: /api/jobs/cleanup
Disallow: /api/jobs/compare
Disallow: /api/alerts/send

# Allow job and company API for indexing
Allow: /api/jobs?
Allow: /api/companies
Allow: /api/articles
Allow: /api/reviews
Allow: /api/salary-reports
Allow: /api/analytics/salary

# Crawl rate
Crawl-delay: 1
`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } })
}
