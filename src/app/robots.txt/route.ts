import { NextResponse } from 'next/server'

// GET /robots.txt — tells search engines what to crawl
// SECURITY: Don't list specific API paths — that reveals the attack surface to attackers.
// Instead, use generic patterns.
export async function GET() {
  const baseUrl = 'https://www.hirebase.in'
  const body = `User-agent: *
Allow: /

# Sitemaps (split into multiple files for crawl efficiency)
Sitemap: ${baseUrl}/sitemap.xml

# Block all API routes (generic — don't reveal specific endpoint names)
Disallow: /api/

# Block user-only pages from being indexed (these require login + have no SEO value)
Disallow: /admin
Disallow: /sync-status
Disallow: /profile
Disallow: /saved
Disallow: /tracker
Disallow: /alerts
Disallow: /auth
Disallow: /upgrade
Disallow: /ground-truth
Disallow: /debug

# Crawl rate (1 request per second — friendly to the server)
Crawl-delay: 1
`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } })
}
