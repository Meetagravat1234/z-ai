import { SiteShell } from '@/components/layout/site-shell'
import { TrackerView } from '@/components/views/tracker-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Application Tracker — Manage Your Job Applications | Hirebase',
  description:
    'Track your job applications from saved to applied to interview to offer. Kanban-style board with drag-and-drop. Free for Hirebase users.',
  alternates: { canonical: 'https://www.hirebase.in/tracker' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Application Tracker', item: 'https://www.hirebase.in/tracker' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <TrackerView />
      </SiteShell>
    </>
  )
}
