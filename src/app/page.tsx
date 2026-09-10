import { db } from '@/lib/db'
import HomeShell from './home-shell'
import type { HomeInitialData } from '@/lib/home-types'
import type { Metadata } from 'next'

// Force dynamic rendering — always shows fresh jobs/companies to Google
export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 min ISR — fast but always fresh

// Page-specific metadata (the layout.tsx has the defaults; this overrides per-page)
export const metadata: Metadata = {
  title: 'Hirebase — India\'s AI-Powered Job Portal | 300+ Verified Jobs',
  description:
    'Find verified jobs in India with AI-powered tools. Browse 300+ jobs from top companies like Google, Amazon, Microsoft, Flipkart and TCS. Optimize your resume with AI, practice mock interviews, check ATS scores, and get email job alerts — all free on Hirebase.',
  alternates: { canonical: 'https://www.hirebase.in' },
}

// Server-side data fetch — runs on the server so the initial HTML includes jobs + companies.
// This is what fixes the "Featured jobs" / "Top companies" empty sections in Google's crawl.
async function getHomeData(): Promise<HomeInitialData> {
  try {
    // Build the India-only filter (same logic as /api/jobs?indiaOnly=true)
    const indiaCondition = {
      OR: [
        { location: { contains: 'India', mode: 'insensitive' as const } },
        { location: { contains: 'Bengaluru', mode: 'insensitive' as const } },
        { location: { contains: 'Bangalore', mode: 'insensitive' as const } },
        { location: { contains: 'Hyderabad', mode: 'insensitive' as const } },
        { location: { contains: 'Chennai', mode: 'insensitive' as const } },
        { location: { contains: 'Mumbai', mode: 'insensitive' as const } },
        { location: { contains: 'Pune', mode: 'insensitive' as const } },
        { location: { contains: 'Noida', mode: 'insensitive' as const } },
        { location: { contains: 'Gurugram', mode: 'insensitive' as const } },
        { location: { contains: 'Gurgaon', mode: 'insensitive' as const } },
        { location: { contains: 'Delhi', mode: 'insensitive' as const } },
        { location: { contains: 'Kolkata', mode: 'insensitive' as const } },
        { location: { contains: 'Remote', mode: 'insensitive' as const } },
        { location: { contains: 'Kochi', mode: 'insensitive' as const } },
        { location: { contains: 'Ahmedabad', mode: 'insensitive' as const } },
        { location: { contains: 'Jaipur', mode: 'insensitive' as const } },
        { location: { contains: 'Chandigarh', mode: 'insensitive' as const } },
        { location: { contains: 'Coimbatore', mode: 'insensitive' as const } },
      ],
    }

    // Parallel fetch — same as the client Promise.all
    const [jobs, companies, articles, totalJobs, totalCompanies] = await Promise.all([
      db.job.findMany({
        where: { AND: [{ verified: true }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 6,
      }),
      db.company.findMany({
        include: { _count: { select: { jobs: { where: { verified: true } } } } },
        orderBy: { name: 'asc' },
      }),
      db.article.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      db.job.count({ where: { verified: true } }),
      db.company.count(),
    ])

    return {
      initialJobs: jobs.map((j) => ({
        ...j,
        postedAt: j.postedAt.toISOString(),
        createdAt: j.createdAt?.toISOString(),
        updatedAt: j.updatedAt?.toISOString(),
      })),
      initialCompanies: companies.slice(0, 8).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        industry: c.industry,
        hiringActivity: c.hiringActivity,
        sevenDayTrend: c.sevenDayTrend,
        openRoles: c._count.jobs,
      })),
      initialArticles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        category: a.category,
        coverEmoji: a.coverEmoji,
        readMinutes: a.readMinutes,
        createdAt: a.createdAt.toISOString(),
      })),
      stats: { jobs: totalJobs, companies: totalCompanies },
    }
  } catch (e) {
    // Fail gracefully — empty initial state, client will retry
    console.error('Home SSR data fetch failed:', e)
    return {
      initialJobs: [],
      initialCompanies: [],
      initialArticles: [],
      stats: { jobs: 0, companies: 0 },
    }
  }
}

export default async function Page() {
  const data = await getHomeData()

  // JSON-LD structured data for Google rich results
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hirebase',
    url: 'https://www.hirebase.in',
    description:
      "India's AI-powered job portal with 300+ verified jobs, AI resume tools, mock interviews, and company reviews.",
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://www.hirebase.in/?view=all-jobs&q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hirebase',
    url: 'https://www.hirebase.in',
    description:
      "India's AI-powered job portal with verified jobs, AI resume tools, mock interviews, salary insights, and company reviews.",
    areaServed: 'IN',
    knowsAbout: [
      'Jobs',
      'Hiring',
      'Career',
      'AI Resume Tools',
      'Mock Interviews',
      'Salary Predictor',
    ],
  }

  // JobPosting schema — critical for showing up in Google for Jobs
  const jobPostingsLd = data.initialJobs.map((job: any) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: (job.description || '').slice(0, 5000),
    datePosted: job.postedAt,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company?.name || 'Hirebase',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'IN',
      },
    },
    employmentType: job.employmentType,
    url: `https://www.hirebase.in/?view=job-detail&jobId=${job.id}`,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      {jobPostingsLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingsLd) }}
        />
      )}
      <HomeShell initialData={data} />
    </>
  )
}
