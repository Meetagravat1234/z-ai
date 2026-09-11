import { SiteShell } from '@/components/layout/site-shell'
import { AlertsView } from '@/components/views/alerts-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Job Alerts — Get Matched Jobs in Your Inbox | Hirebase',
  description:
    'Set up free email job alerts based on your target role, skills, and location. Get notified when new matching jobs are posted on Hirebase.',
  alternates: { canonical: 'https://www.hirebase.in/alerts' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Job Alerts', item: 'https://www.hirebase.in/alerts' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AlertsView />
      </SiteShell>
    </>
  )
}
