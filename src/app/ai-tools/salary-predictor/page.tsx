import { SiteShell } from '@/components/layout/site-shell'
import { AISalaryPredictor } from '@/components/views/ai-salary-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Salary Predictor — AI Salary Estimator India | Hirebase',
  description:
    'Predict realistic salary ranges for your role, experience, and location in India. Get negotiation tips and market insights. Free for Indian job seekers.',
  alternates: { canonical: 'https://www.hirebase.in/ai-tools/salary-predictor' },
  openGraph: {
    title: 'Salary Predictor — AI Salary Estimator India | Hirebase',
    description: 'Predict realistic salary ranges for your role + get negotiation tips. Free for Indian job seekers.',
    url: 'https://www.hirebase.in/ai-tools/salary-predictor',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'AI Tools', item: 'https://www.hirebase.in/ai-tools/salary-predictor' },
    { '@type': 'ListItem', position: 3, name: 'Salary Predictor', item: 'https://www.hirebase.in/ai-tools/salary-predictor' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AISalaryPredictor />
      </SiteShell>
    </>
  )
}
