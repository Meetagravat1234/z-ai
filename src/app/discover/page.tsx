import { SiteShell } from '@/components/layout/site-shell'
import { DiscoverView } from '@/components/views/discover-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Discover Jobs — Explore Verified Openings | Hirebase',
  description: 'Discover verified job openings across India. Browse by category, role, company, or city.',
  alternates: { canonical: 'https://www.hirebase.in/discover' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Discover', item: 'https://www.hirebase.in/discover' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <DiscoverView />
      </SiteShell>
    </>
  )
}
