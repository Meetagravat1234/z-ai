import { SiteShell } from '@/components/layout/site-shell'
import { CompareJobsView } from '@/components/views/compare-jobs-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Compare Jobs — Side-by-Side Job Comparison | Hirebase',
  description: 'Compare 2-3 jobs side by side — salary, skills, work mode, location, and company. Make better application decisions.',
  alternates: { canonical: 'https://www.hirebase.in/compare-jobs' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Compare Jobs', item: 'https://www.hirebase.in/compare-jobs' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <CompareJobsView />
      </SiteShell>
    </>
  )
}
