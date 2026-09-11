import { SiteShell } from '@/components/layout/site-shell'
import { AIResumeOptimizer } from '@/components/views/ai-resume-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Resume Optimizer India — Free ATS-Friendly | Hirebase',
  description:
    'Tailor your resume to any job description in seconds with AI. ATS-friendly output, keyword matching, and one-click optimization. Free for Indian job seekers on Hirebase.',
  alternates: { canonical: 'https://www.hirebase.in/ai-tools/resume-optimizer' },
  openGraph: {
    title: 'AI Resume Optimizer India — Free ATS-Friendly | Hirebase',
    description: 'Tailor your resume to any job description in seconds with AI. Free for Indian job seekers.',
    url: 'https://www.hirebase.in/ai-tools/resume-optimizer',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'AI Tools', item: 'https://www.hirebase.in/ai-tools/resume-optimizer' },
    { '@type': 'ListItem', position: 3, name: 'AI Resume Optimizer', item: 'https://www.hirebase.in/ai-tools/resume-optimizer' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <AIResumeOptimizer />
      </SiteShell>
    </>
  )
}
