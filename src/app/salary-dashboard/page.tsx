import { SiteShell } from '@/components/layout/site-shell'
import { SalaryDashboardView } from '@/components/views/salary-dashboard-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Salary Dashboard — Interactive Salary Trends India | Hirebase',
  description:
    'Explore interactive salary charts by role, company, city, and experience level. Real salary data from verified job listings across India.',
  alternates: { canonical: 'https://www.hirebase.in/salary-dashboard' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Salary Dashboard', item: 'https://www.hirebase.in/salary-dashboard' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <SalaryDashboardView />
      </SiteShell>
    </>
  )
}
