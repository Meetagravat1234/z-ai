import { SiteShell } from '@/components/layout/site-shell'
import { AICoverLetter } from '@/components/views/ai-cover-letter-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator — Free Personalized | Hirebase',
  description:
    'Generate a personalized, professional cover letter for any role in seconds with AI. Free for Indian job seekers. No signup required to try.',
  alternates: { canonical: 'https://www.hirebase.in/ai-tools/cover-letter' },
  openGraph: {
    title: 'AI Cover Letter Generator — Free Personalized | Hirebase',
    description: 'Generate a personalized cover letter for any role in seconds with AI. Free for Indian job seekers.',
    url: 'https://www.hirebase.in/ai-tools/cover-letter',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'AI Tools', item: 'https://www.hirebase.in/ai-tools/cover-letter' },
    { '@type': 'ListItem', position: 3, name: 'AI Cover Letter', item: 'https://www.hirebase.in/ai-tools/cover-letter' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AICoverLetter />
      </SiteShell>
    </>
  )
}
