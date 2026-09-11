import { SiteShell } from '@/components/layout/site-shell'
import { PricingView } from '@/components/views/pricing-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Pricing — Free for Job Seekers | Hirebase',
  description: 'Hirebase is 100% free for job seekers. Browse jobs, use AI tools, track applications — all free.',
  alternates: { canonical: 'https://www.hirebase.in/pricing' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://www.hirebase.in/pricing' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <PricingView />
      </SiteShell>
    </>
  )
}
