import { SiteShell } from '@/components/layout/site-shell'
import { SavedJobsView } from '@/components/views/saved-jobs-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Saved Jobs — Your Bookmarked Job Listings | Hirebase',
  description: 'View and manage jobs you have saved on Hirebase. Apply when you are ready.',
  alternates: { canonical: 'https://www.hirebase.in/saved' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Saved Jobs', item: 'https://www.hirebase.in/saved' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <SavedJobsView />
      </SiteShell>
    </>
  )
}
