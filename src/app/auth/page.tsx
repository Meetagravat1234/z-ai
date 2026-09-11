import { SiteShell } from '@/components/layout/site-shell'
import { AuthView } from '@/components/views/auth-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Sign In or Sign Up — Free for Indian Job Seekers | Hirebase',
  description:
    'Create a free Hirebase account to unlock AI tools (resume optimizer, ATS score, mock interview), saved jobs, application tracker, and email job alerts.',
  alternates: { canonical: 'https://www.hirebase.in/auth' },
  robots: { index: false, follow: true }, // don't index auth page
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Sign In', item: 'https://www.hirebase.in/auth' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AuthView />
      </SiteShell>
    </>
  )
}
