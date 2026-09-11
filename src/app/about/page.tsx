import { SiteShell } from '@/components/layout/site-shell'
import { AboutView } from '@/components/views/about-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About Hirebase — India\'s AI-Powered Job Portal',
  description:
    'Learn about Hirebase — India\'s AI-powered job portal aggregating verified openings from 30+ sources, with AI tools for resume, ATS, mock interviews, salary prediction.',
  alternates: { canonical: 'https://www.hirebase.in/about' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.hirebase.in/about' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AboutView />
      </SiteShell>
    </>
  )
}
