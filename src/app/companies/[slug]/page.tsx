import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import { CompanyDetailView } from '@/components/views/company-detail-view'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { companyUrl } from '@/lib/seo-routes'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await db.company.findUnique({
      where: { slug },
      include: { _count: { select: { jobs: { where: { verified: true } } } } },
    })
    if (!company) {
      return { title: 'Company not found | Hirebase' }
    }
    const openCount = company._count.jobs
    const title = `${company.name} — ${openCount} Open Roles in India | Hirebase`
    const description = `Explore ${openCount} verified open roles at ${company.name} in India. ${company.industry || ''} · ${company.size || ''} · HQ in ${company.hq || 'India'}. Read about culture, benefits, and apply directly.`
    return {
      title,
      description,
      alternates: { canonical: `https://www.hirebase.in${companyUrl(slug)}` },
      openGraph: {
        title,
        description,
        url: `https://www.hirebase.in${companyUrl(slug)}`,
        type: 'profile',
      },
    }
  } catch {
    return { title: 'Hirebase — Company Profile' }
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { slug } = await params

  let company: any = null
  try {
    company = await db.company.findUnique({
      where: { slug },
      include: {
        jobs: {
          where: { verified: true },
          orderBy: { postedAt: 'desc' },
          take: 50,
        },
      },
    })
  } catch (e) {
    console.error('Company SSR fetch failed:', e)
  }

  if (!company) notFound()

  // Serialize dates on jobs
  const serializableCompany = {
    ...company,
    jobs: company.jobs.map((j: any) => ({
      ...j,
      postedAt: j.postedAt instanceof Date ? j.postedAt.toISOString() : j.postedAt,
      createdAt: j.createdAt instanceof Date ? j.createdAt.toISOString() : j.createdAt,
      company: { id: company.id, name: company.name, slug: company.slug, logo: company.logo, industry: company.industry },
    })),
  }

  // Organization schema for Google
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: company.website || `https://www.hirebase.in${companyUrl(slug)}`,
    logo: company.logo ? undefined : undefined, // logo is emoji in this DB
    description: company.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.hq || 'India',
      addressCountry: 'IN',
    },
    ...(company.industry ? { knowsAbout: [company.industry] } : {}),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Companies', item: 'https://www.hirebase.in/companies' },
      { '@type': 'ListItem', position: 3, name: company.name, item: `https://www.hirebase.in${companyUrl(slug)}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <CompanyDetailView initialCompany={serializableCompany} slug={slug} />
      </SiteShell>
    </>
  )
}
