import { SiteShell } from '@/components/layout/site-shell'
import { ATSScoreView } from '@/components/views/ats-score-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'ATS Score Checker — Free Resume Score (0-100) | Hirebase',
  description:
    'Check your resume ATS compatibility score for free. Get specific fix recommendations for keywords, format, and skills. Improve your chances of getting shortlisted.',
  alternates: { canonical: 'https://www.hirebase.in/ai-tools/ats-score' },
  openGraph: {
    title: 'ATS Score Checker — Free Resume Score (0-100) | Hirebase',
    description: 'Check your resume ATS compatibility score for free. Get specific fix recommendations.',
    url: 'https://www.hirebase.in/ai-tools/ats-score',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'AI Tools', item: 'https://www.hirebase.in/ai-tools/ats-score' },
    { '@type': 'ListItem', position: 3, name: 'ATS Score Checker', item: 'https://www.hirebase.in/ai-tools/ats-score' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <ATSScoreView />
      </SiteShell>
    </>
  )
}
