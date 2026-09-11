import { SiteShell } from '@/components/layout/site-shell'
import { ProfileView } from '@/components/views/profile-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'My Profile — Manage Your Hirebase Account | Hirebase',
  description: 'Update your target role, skills, experience, and preferences. Manage your account settings.',
  alternates: { canonical: 'https://www.hirebase.in/profile' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'My Profile', item: 'https://www.hirebase.in/profile' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <ProfileView />
      </SiteShell>
    </>
  )
}
