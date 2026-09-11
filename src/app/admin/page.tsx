import { SiteShell } from '@/components/layout/site-shell'
import { AdminDashboardView } from '@/components/views/admin-dashboard-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Admin Dashboard | Hirebase',
  description: 'Admin-only dashboard for managing jobs, companies, and users.',
  alternates: { canonical: 'https://www.hirebase.in/admin' },
  robots: { index: false, follow: false }, // never index admin pages
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Admin', item: 'https://www.hirebase.in/admin' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AdminDashboardView />
      </SiteShell>
    </>
  )
}
