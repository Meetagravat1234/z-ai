import { SiteShell } from '@/components/layout/site-shell'
import { GroundTruthView } from '@/components/views/ground-truth-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ground Truth — How Hirebase Verifies Jobs | Hirebase',
  description: 'Understand how Hirebase verifies every job listing through multiple sources including direct employer feeds, public job APIs, and AI enrichment.',
  alternates: { canonical: 'https://www.hirebase.in/ground-truth' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Ground Truth', item: 'https://www.hirebase.in/ground-truth' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <GroundTruthView />
      </SiteShell>
    </>
  )
}
