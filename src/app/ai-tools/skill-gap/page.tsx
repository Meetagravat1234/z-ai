import { SiteShell } from '@/components/layout/site-shell'
import { SkillGapView } from '@/components/views/skill-gap-view'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Skill Gap Analyzer — Personalised Learning Path | Hirebase',
  description:
    'Find the skills you are missing for your target role and get a personalised learning path with resources, projects, and time estimates. Free for Indian job seekers.',
  alternates: { canonical: 'https://www.hirebase.in/ai-tools/skill-gap' },
  openGraph: {
    title: 'Skill Gap Analyzer — Personalised Learning Path | Hirebase',
    description: 'Find skills missing for your target role + get a personalised learning path. Free for Indian job seekers.',
    url: 'https://www.hirebase.in/ai-tools/skill-gap',
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    { '@type': 'ListItem', position: 2, name: 'AI Tools', item: 'https://www.hirebase.in/ai-tools/skill-gap' },
    { '@type': 'ListItem', position: 3, name: 'Skill Gap Analyzer', item: 'https://www.hirebase.in/ai-tools/skill-gap' },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <SkillGapView />
      </SiteShell>
    </>
  )
}
