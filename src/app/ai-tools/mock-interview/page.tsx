import { SiteShell } from '@/components/layout/site-shell'
import { AIMockInterview } from '@/components/views/ai-mock-interview-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Mock Interview — Practice Interviews Free | Hirebase',
  description:
    'Practice real interview questions with an AI interviewer. Voice or text input. Get instant feedback on your answers. Free for Indian job seekers.',
  alternates: { canonical: 'https://www.hirebase.in/ai-tools/mock-interview' },
  openGraph: {
    title: 'AI Mock Interview — Practice Interviews Free | Hirebase',
    description: 'Practice real interview questions with an AI interviewer. Voice or text. Free for Indian job seekers.',
    url: 'https://www.hirebase.in/ai-tools/mock-interview',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'AI Tools', item: 'https://www.hirebase.in/ai-tools/mock-interview' },
    { '@type': 'ListItem', position: 3, name: 'AI Mock Interview', item: 'https://www.hirebase.in/ai-tools/mock-interview' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AIMockInterview />
      </SiteShell>
    </>
  )
}
