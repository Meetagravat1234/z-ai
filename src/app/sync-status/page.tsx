import { SiteShell } from '@/components/layout/site-shell'
import { SyncStatusView } from '@/components/views/sync-status-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Live Sync Status — Real-Time Job Aggregation | Hirebase',
  description: 'See the live status of Hirebase\'s 30+ source aggregation pipeline. New jobs added every 30 minutes from Greenhouse, Ashby, Remotive, and direct company career pages.',
  alternates: { canonical: 'https://www.hirebase.in/sync-status' },
  robots: { index: false, follow: true }, // admin-only page, don't index
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Live Sync Status', item: 'https://www.hirebase.in/sync-status' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <SyncStatusView />
      </SiteShell>
    </>
  )
}
