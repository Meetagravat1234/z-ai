import { db } from '@/lib/db'
import HomeShell from './home-shell'
import type { HomeInitialData } from '@/lib/home-types'
import type { Metadata } from 'next'
import { estimateSalaryForJob } from '@/lib/salary-estimate'
import { cleanJobTitle } from '@/lib/seo-routes'

// ISR (Incremental Static Regeneration) — page is cached for 5 minutes,
// then re-generated in the background. This fixes the 504 timeout issue:
// - With force-dynamic: every request hits the DB → 3-5s TTFB → 504 on cold start
// - With ISR: first request builds the page, subsequent requests get the cached
//   version (instant), and it refreshes every 5 minutes.
// Trade-off: jobs added via admin appear on homepage after max 5 min (not instantly).
// This is acceptable — the /jobs page still uses force-dynamic for real-time updates.
export const revalidate = 300 // 5 min ISR

// Page-specific metadata (the layout.tsx has the defaults; this overrides per-page)
export const metadata: Metadata = {
  title: 'Hirebase — India\'s AI-Powered Job Portal | 860+ Verified Jobs',
  description:
    'Find verified jobs in India with AI-powered tools. Browse 860+ jobs from top companies like Google, Amazon, Microsoft, Flipkart and TCS. Optimize your resume with AI, practice mock interviews, check ATS scores, and get email job alerts — all free on Hirebase.',
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

    // Parallel fetch — home page + jobs views (so switching to All Jobs / Freshers / Internships is instant)
    const [
      jobs, companies, articles, totalJobs, totalCompanies,
      allJobs, allJobsTotal,
      fresherJobs, fresherJobsTotal,
      internshipJobs, internshipJobsTotal,
      walkInJobs, walkInJobsTotal,
      hiddenJobs, hiddenJobsTotal,
    ] = await Promise.all([
      db.job.findMany({
        where: { AND: [{ verified: true }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 6,
      }),
      db.company.findMany({
        include: { _count: { select: { jobs: { where: { verified: true } } } } },
        orderBy: {
          jobs: { _count: 'desc' },
        },
      }),
      db.article.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      db.job.count({ where: { verified: true } }),
      db.company.count(),
      // All Jobs view — 60 most recent India-only
      db.job.findMany({
        where: { AND: [{ verified: true }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 60,
      }),
      db.job.count({ where: { AND: [{ verified: true }, indiaCondition] } }),
      // Fresher view
      db.job.findMany({
        where: { AND: [{ verified: true, category: 'fresher' }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 60,
      }),
      db.job.count({ where: { AND: [{ verified: true, category: 'fresher' }, indiaCondition] } }),
      // Internship view
      db.job.findMany({
        where: { AND: [{ verified: true, category: 'internship' }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 60,
      }),
      db.job.count({ where: { AND: [{ verified: true, category: 'internship' }, indiaCondition] } }),
      // Walk-in view
      db.job.findMany({
        where: { AND: [{ verified: true, category: 'walk-in' }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 60,
      }),
      db.job.count({ where: { AND: [{ verified: true, category: 'walk-in' }, indiaCondition] } }),
      // Hidden view
      db.job.findMany({
        where: { AND: [{ verified: true, category: 'hidden' }, indiaCondition] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 60,
      }),
      db.job.count({ where: { AND: [{ verified: true, category: 'hidden' }, indiaCondition] } }),
    ])

    // Helper: serialize Date objects to ISO strings for client components
    const serializeJobs = (arr: any[]) =>
      arr.map((j) => ({
        ...j,
        postedAt: j.postedAt.toISOString(),
        createdAt: j.createdAt?.toISOString(),
        updatedAt: j.updatedAt?.toISOString(),
      }))

    // Helper: enrich jobs without salary with estimated range — uses the
    // in-memory benchmark cache so all 7 arrays below reuse the same lookup.
    const enrichJobs = async (arr: any[]) =>
      Promise.all(
        arr.map(async (j: any) => {
          if (j.salaryMin != null || j.salaryMax != null) {
            return { ...j, estimatedSalary: null }
          }
          try {
            const est = await estimateSalaryForJob({
              title: j.title,
              location: j.location,
              experience: j.experience,
              category: j.category,
              company: j.company,
            })
            return { ...j, estimatedSalary: est }
          } catch {
            return { ...j, estimatedSalary: null }
          }
        })
      )

    const [
      enrichedJobs, enrichedAllJobs, enrichedFresherJobs, enrichedInternshipJobs,
      enrichedWalkInJobs, enrichedHiddenJobs,
    ] = await Promise.all([
      enrichJobs(jobs),
      enrichJobs(allJobs),
      enrichJobs(fresherJobs),
      enrichJobs(internshipJobs),
      enrichJobs(walkInJobs),
      enrichJobs(hiddenJobs),
    ])

    return {
      initialJobs: serializeJobs(enrichedJobs),
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
      initialAllJobs: serializeJobs(enrichedAllJobs),
      initialAllJobsTotal: allJobsTotal,
      initialFresherJobs: serializeJobs(enrichedFresherJobs),
      initialFresherJobsTotal: fresherJobsTotal,
      initialInternshipJobs: serializeJobs(enrichedInternshipJobs),
      initialInternshipJobsTotal: internshipJobsTotal,
      initialWalkInJobs: serializeJobs(enrichedWalkInJobs),
      initialWalkInJobsTotal: walkInJobsTotal,
      initialHiddenJobs: serializeJobs(enrichedHiddenJobs),
      initialHiddenJobsTotal: hiddenJobsTotal,
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
      "India's AI-powered job portal with 860+ verified jobs, AI resume tools, mock interviews, and company reviews.",
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
  // Full schema with all recommended fields to avoid GSC warnings
  // Enrich jobs without salary with an estimated range so JSON-LD matches UI.
  const jobPostingsLd = await Promise.all(data.initialJobs.map(async (job: any) => {
    const locationParts = (job.location || 'India').split(',').map((s: string) => s.trim())
    const city = locationParts[0] || 'India'
    const stateOrRegion = locationParts[1] || city
    const isRemote = /remote/i.test(job.location || '')
    const postedDate = new Date(job.postedAt)
    const validThrough = new Date(postedDate)
    validThrough.setDate(validThrough.getDate() + 30)

    // Estimate salary only if actual salary is missing
    let estimated: Awaited<ReturnType<typeof estimateSalaryForJob>> = null
    if (job.salaryMin == null && job.salaryMax == null) {
      try {
        estimated = await estimateSalaryForJob({
          title: job.title,
          location: job.location,
          experience: job.experience,
          category: job.category,
          company: job.company,
        })
      } catch {
        // ignore — baseSalary just won't be emitted
      }
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: cleanJobTitle(job.title, job.company?.name),
      description: (job.description || '').slice(0, 5000),
      datePosted: job.postedAt,
      validThrough: validThrough.toISOString(),
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company?.name || 'Hirebase',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '',
          addressLocality: city,
          addressRegion: stateOrRegion,
          postalCode: '',
          addressCountry: 'IN',
        },
      },
      employmentType: job.employmentType,
      url: `https://www.hirebase.in/jobs/${job.id}-${(cleanJobTitle(job.title, job.company?.name) || job.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)}`,
      // baseSalary only emitted when we have actual or estimated data
      ...(job.salaryMin != null || job.salaryMax != null || estimated
        ? {
            baseSalary: {
              '@type': 'MonetaryAmount',
              currency: job.salaryCurrency || 'INR',
              value: {
                '@type': 'QuantitativeValue',
                minValue: job.salaryMin != null
                  ? job.salaryMin / 10
                  : (estimated ? estimated.min / 10 : undefined),
                maxValue: job.salaryMax != null
                  ? job.salaryMax / 10
                  : (estimated ? estimated.max / 10 : undefined),
                unitText: 'YEAR',
              },
            },
          }
        : {}),
      jobLocationType: isRemote ? 'TELECOMMUTE' : undefined,
      applicantLocationRequirements: isRemote
        ? { '@type': 'Country', name: 'India' }
        : undefined,
      experienceRequirements: job.experience || undefined,
      skills: job.skills || undefined,
    }
  }))

  // FAQ schema — for Google rich snippets (eligible for expandable Q&A in search results)
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Hirebase free for job seekers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Hirebase is 100% free for browsing jobs, searching, and applying. AI tools like Resume Optimizer, ATS Score Checker, and Mock Interview are free with ad-gate (watch a 15-second ad to unlock). Skill tests are completely free with no limits.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Hirebase have jobs in Bengaluru, Hyderabad, and Pune?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Hirebase aggregates verified job openings from top employers across Bengaluru, Hyderabad, Pune, Chennai, Mumbai, Delhi NCR, Kolkata, Kochi, and remote positions. You can filter by city on the Jobs page.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I optimize my resume with AI on Hirebase?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Hirebase offers 6 AI tools: AI Resume Optimizer, ATS Score Checker, AI Cover Letter Generator, AI Mock Interview, Skill Gap Analyzer, and Salary Predictor. All tools are free with ad-gate or included in the Pro plan at ₹299/month.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Hirebase verify job listings?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every job on Hirebase goes through a multi-step verification process: source identification from official career pages, technology-assisted discovery, review and deduplication, enrichment with structured metadata, and publication with a direct link to the original employer application page.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I take skill tests on Hirebase?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Hirebase offers free skill tests in C, Java, Python, SQL, Data Structures, Aptitude, and Web Development. Each subject has full tests and topic-wise quizzes with instant scoring and detailed explanations.',
        },
      },
    ],
  }

  // BreadcrumbList schema for home page
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
    ],
  }

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
