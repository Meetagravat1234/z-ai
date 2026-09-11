import { SiteShell } from '@/components/layout/site-shell'
import { QuestionBankView } from '@/components/views/question-bank-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Interview Questions — Real Questions with AI Answers | Hirebase',
  description:
    'Searchable database of real interview questions asked by top companies. Each question includes an AI-generated model answer. Free for Indian job seekers.',
  alternates: { canonical: 'https://www.hirebase.in/question-bank' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'Interview Questions', item: 'https://www.hirebase.in/question-bank' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <QuestionBankView />
      </SiteShell>
    </>
  )
}
