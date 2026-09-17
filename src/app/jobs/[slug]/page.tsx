import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import { JobDetailView } from '@/components/views/job-detail-view'
import type { HomeInitialData } from '@/lib/home-types'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CITY_PAGES, ROLE_PAGES, jobUrl, parseJobIdFromSlug, slugify, cleanJobTitle } from '@/lib/seo-routes'
import { estimateSalaryForJob } from '@/lib/salary-estimate'

// Always render fresh — jobs change frequently
export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

/**
 * /jobs/[slug] handles THREE cases:
 *  1. /jobs/bengaluru      → city landing page (matches CITY_PAGES.slug)
 *  2. /jobs/fresher        → category page (special-case 'fresher' / 'internship' / 'walk-in' / 'hidden')
 *  3. /jobs/[jobId]-[title] → individual job detail page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Case 1: City page
  const city = CITY_PAGES.find((c) => c.slug === slug)
  if (city) {
    const title = `Jobs in ${city.name} — Verified Openings | Hirebase`
    const description = `Browse 100+ verified jobs in ${city.name}, ${city.state}. Software, data, product, design roles at top companies. Apply free — no signup required.`
    return {
      title,
      description,
      alternates: { canonical: `https://www.hirebase.in/jobs/${city.slug}` },
      openGraph: { title, description, url: `https://www.hirebase.in/jobs/${city.slug}` },
    }
  }

  // Case 2: Category page
  const categoryMap: Record<string, { label: string; title: string; description: string }> = {
    fresher: {
      label: 'Fresher',
      title: 'Fresher Jobs in India (0 Years Experience) | Hirebase',
      description:
        '860+ fresher jobs in India. Software, data, marketing, sales roles at TCS, Infosys, Wipro, Flipkart, Swiggy, and 100+ companies. Apply free — no signup required.',
    },
    internship: {
      label: 'Internship',
      title: 'Internships in India — Paid & Verified | Hirebase',
      description:
        'Find paid internships in India at top companies. Software engineering, data science, marketing, design, and product internships. Verified + free to apply.',
    },
    'walk-in': {
      label: 'Walk-in',
      title: 'Walk-in Interview Jobs in India | Hirebase',
      description:
        'Browse walk-in interview jobs across India. Direct interview drives at top companies — no appointment needed. Verified listings, free to attend.',
    },
    hidden: {
      label: 'Hidden',
      title: 'Hidden Jobs & Referral-Only Roles in India | Hirebase',
      description:
        'Discover hidden jobs and referral-only opportunities in India. Exclusive roles not publicly listed on Naukri or LinkedIn. Verified + free to apply.',
    },
    experienced: {
      label: 'Experienced',
      title: 'Jobs for Experienced Professionals in India | Hirebase',
      description:
        'Browse senior-level jobs in India. Software, data, product, management roles at top product and services companies. Verified + free to apply.',
    },
  }
  const cat = categoryMap[slug]
  if (cat) {
    return {
      title: cat.title,
      description: cat.description,
      alternates: { canonical: `https://www.hirebase.in/jobs/${slug}` },
      openGraph: { title: cat.title, description: cat.description, url: `https://www.hirebase.in/jobs/${slug}` },
    }
  }

  // Case 3: Individual job — fetch from DB
  const jobId = parseJobIdFromSlug(slug)
  if (!jobId) return { title: 'Job not found | Hirebase' }

  try {
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    })
    if (!job) {
      return { title: 'Job not found | Hirebase', description: 'This job may have been removed.' }
    }
    // Strip a trailing "at <Company>" from the scraped title before interpolating
    // — LinkedIn titles often look like "Software Engineer at Stripe", which
    // would otherwise produce "Software Engineer at Stripe at Stripe" in the
    // page title (keyword stuffing + looks automated).
    const cleanTitle = cleanJobTitle(job.title, job.company.name)
    const title = `${cleanTitle} at ${job.company.name} — ${job.location.split(',')[0]} | Hirebase`
    // Description uses the actual location string — no longer appends ", India" to US jobs
    const description = `${cleanTitle} role at ${job.company.name} in ${job.location}. ${job.employmentType}, ${job.workMode}. Apply free on Hirebase — verified job listing.`
    return {
      title,
      description,
      alternates: { canonical: `https://www.hirebase.in${jobUrl(job)}` },
      openGraph: {
        title,
        description,
        url: `https://www.hirebase.in${jobUrl(job)}`,
        type: 'article',
      },
    }
  } catch {
    return { title: 'Hirebase — Job Details' }
  }
}

export default async function JobRoute({ params }: PageProps) {
  const { slug } = await params

  // Dispatch to the right renderer based on slug content
  const city = CITY_PAGES.find((c) => c.slug === slug)
  if (city) return <CityPage citySlug={slug} />

  const categoryMap = ['fresher', 'internship', 'walk-in', 'hidden', 'experienced']
  if (categoryMap.includes(slug)) {
    return <CategoryPage category={slug} />
  }

  return <JobDetailPage slug={slug} />
}

// ============================================================
// Individual job detail page
// ============================================================
async function JobDetailPage({ slug }: { slug: string }) {
  const jobId = parseJobIdFromSlug(slug)
  if (!jobId) notFound()

  let job: any = null
  let related: any[] = []
  try {
    job = await db.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    })
    if (job) {
      // Increment view count (fire-and-forget)
      db.job.update({ where: { id: jobId }, data: { viewsCount: { increment: 1 } } }).catch(() => {})

      // Related jobs — same company OR same category, exclude self
      related = await db.job.findMany({
        where: {
          AND: [
            { id: { not: job.id } },
            { verified: true },
            {
              OR: [
                { companyId: job.companyId },
                { category: job.category },
                { skills: { contains: job.skills.split(',')[0] || '' } },
              ],
            },
          ],
        },
        include: { company: true },
        take: 6,
        orderBy: { postedAt: 'desc' },
      })
    }
  } catch (e) {
    console.error('Job SSR fetch failed:', e)
  }

  if (!job) {
    // Return actual HTTP 404 status — prevents soft-404 SEO issues
    // (Google was indexing junk pages like /jobs/anything-nonexistent as 200 OK)
    notFound()
  }

  // Enrich with estimated salary if actual salary is missing — keeps the
  // displayed range and the JSON-LD baseSalary consistent with what /api/jobs
  // returns on the client side.
  let estimatedSalary: Awaited<ReturnType<typeof estimateSalaryForJob>> = null
  if (job.salaryMin == null && job.salaryMax == null) {
    try {
      estimatedSalary = await estimateSalaryForJob({
        title: job.title,
        location: job.location,
        experience: job.experience,
        category: job.category,
        company: job.company,
      })
    } catch (e) {
      console.error('[jobs/ssr] Salary estimation failed:', e)
    }
  }

  // Enrich related jobs with estimated salary too — uses the same in-memory
  // benchmark cache as the main job, so it's essentially free after the
  // first computation.
  const enrichedRelated = await Promise.all(
    related.map(async (j) => {
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

  // Serialize dates for client component
  const serializableJob = {
    ...job,
    postedAt: job.postedAt.toISOString(),
    createdAt: job.createdAt?.toISOString(),
    updatedAt: job.updatedAt?.toISOString(),
    estimatedSalary,
  }
  const serializableRelated = enrichedRelated.map((j: any) => ({
    ...j,
    postedAt: j.postedAt.toISOString(),
    createdAt: j.createdAt?.toISOString(),
    updatedAt: j.updatedAt?.toISOString(),
  }))

  // JobPosting structured data for Google for Jobs
  // Full schema: https://developers.google.com/search/docs/appearance/structured-data/job-posting
  // All recommended fields included to avoid GSC "Improve item appearance" warnings

  // Parse location into structured address fields
  // Job locations in our DB are like "Bengaluru, India" or "Remote" or "San Jose, USA"
  const locationParts = job.location.split(',').map(s => s.trim())
  const city = locationParts[0] || 'India'
  const stateOrRegion = locationParts[1] || ''
  const isRemote = /remote/i.test(job.location)

  // Detect country from the location string — fixes the hardcoded ", India" bug
  // where US jobs (e.g. "San Jose, USA") were being labeled as India in JSON-LD.
  // Also affects the meta description which used to read
  // "role at Company in Remote - US, India" (nonsensical).
  const detectCountry = (location: string): { code: string; name: string } => {
    const lower = location.toLowerCase()
    if (/usa|united states|u\.s\.|, us\b|, usa\b/i.test(location)) return { code: 'US', name: 'United States' }
    if (/canada/i.test(location)) return { code: 'CA', name: 'Canada' }
    if (/\buk\b|united kingdom|england/i.test(location)) return { code: 'GB', name: 'United Kingdom' }
    if (/germany|deutschland/i.test(location)) return { code: 'DE', name: 'Germany' }
    if (/\bindia\b|bengaluru|bangalore|hyderabad|chennai|mumbai|pune|noida|gurugram|gurgaon|delhi|kolkata|kochi|ahmedabad|jaipur|chandigarh|coimbatore/i.test(lower)) return { code: 'IN', name: 'India' }
    if (/\bremote\b/i.test(lower)) return { code: 'IN', name: 'India' } // default remote to India
    return { code: 'IN', name: 'India' } // default
  }
  const country = detectCountry(job.location)

  // Strip "at <Company>" suffix from title before publishing (prevents
  // "Software Engineer at Stripe at Stripe" duplication in JSON-LD).
  const cleanTitle = cleanJobTitle(job.title, job.company.name)

  // Determine validThrough (30 days from postedAt — standard job posting validity)
  const postedAtDate = new Date(job.postedAt)
  const validThrough = new Date(postedAtDate)
  validThrough.setDate(validThrough.getDate() + 30)

  const jobPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: cleanTitle,
    description: (job.description || '').slice(0, 5000),
    datePosted: job.postedAt.toISOString(),
    validThrough: validThrough.toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      ...(job.company.website ? { sameAs: job.company.website } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '',
        addressLocality: city,
        addressRegion: stateOrRegion || city,
        postalCode: '',
        addressCountry: country.code,  // detected from location — was hardcoded 'IN'
      },
    },
    employmentType: job.employmentType,
    url: `https://www.hirebase.in${jobUrl(job)}`,
    // baseSalary: only include when we have actual or estimated salary data.
    // Google's JobPosting schema treats baseSalary as optional — emitting a
    // fake "3-15 LPA" placeholder caused Google to surface misleading salary
    // info in Google for Jobs results.
    ...(job.salaryMin != null || job.salaryMax != null || estimatedSalary
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency || 'INR',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin != null
                ? job.salaryMin / 10
                : (estimatedSalary ? estimatedSalary.min / 10 : undefined),
              maxValue: job.salaryMax != null
                ? job.salaryMax / 10
                : (estimatedSalary ? estimatedSalary.max / 10 : undefined),
              unitText: 'YEAR',
            },
          },
        }
      : {}),
    // Additional recommended fields
    jobLocationType: isRemote ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: isRemote
      ? { '@type': 'Country', name: country.name }
      : undefined,
    experienceRequirements: job.experience || undefined,
    qualifications: job.skills || undefined,
    skills: job.skills || undefined,
    workHours: 'Full-time',
    industry: job.company.industry || undefined,
  }

  // BreadcrumbList schema
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.hirebase.in/jobs' },
      {
        '@type': 'ListItem',
        position: 3,
        name: cleanTitle,
        item: `https://www.hirebase.in${jobUrl(job)}`,
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <JobDetailView initialJob={serializableJob} initialRelated={serializableRelated} jobId={jobId} />
      </SiteShell>
    </>
  )
}

// ============================================================
// City landing page — /jobs/bengaluru, /jobs/hyderabad, etc.
// ============================================================
async function CityPage({ citySlug }: { citySlug: string }) {
  const city = CITY_PAGES.find((c) => c.slug === citySlug)!
  const citySearchTerms = city.searchTerms

  // Build OR conditions for each search term (e.g. "Bengaluru", "Bangalore")
  const locationConditions = citySearchTerms.map((term) => ({
    location: { contains: term, mode: 'insensitive' as const },
  }))

  let jobs: any[] = []
  let totalJobs = 0
  let companies: any[] = []
  try {
    const [allJobs, totalCount, allCompanies] = await Promise.all([
      db.job.findMany({
        where: { AND: [{ verified: true }, { OR: locationConditions }] },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 24,
      }),
      db.job.count({ where: { AND: [{ verified: true }, { OR: locationConditions }] } }),
      db.company.findMany({
        where: {
          jobs: { some: { verified: true, AND: [{ OR: locationConditions }] } },
        },
        include: { _count: { select: { jobs: { where: { verified: true, AND: [{ OR: locationConditions }] } } } } },
        orderBy: { name: 'asc' },
        take: 12,
      }),
    ])
    // Enrich jobs without salary with estimated range — uses the same
    // benchmark cache as the job detail page so it's effectively free.
    jobs = await Promise.all(
      allJobs.map(async (j) => {
        if (j.salaryMin != null || j.salaryMax != null) return { ...j, estimatedSalary: null }
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
    totalJobs = totalCount
    companies = allCompanies
  } catch (e) {
    console.error('City page SSR fetch failed:', e)
  }

  // City JSON-LD (Place + Dataset for job listings)
  const cityLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: city.name,
    address: { '@type': 'PostalAddress', addressRegion: city.state, addressCountry: 'IN' },
    description: city.description,
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.hirebase.in/jobs' },
      { '@type': 'ListItem', position: 3, name: city.name, item: `https://www.hirebase.in/jobs/${city.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cityLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <div className="space-y-8 pb-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/jobs" className="hover:text-primary">Jobs</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{city.name}</span>
          </nav>

          {/* HERO */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Jobs in <span className="gradient-text">{city.name}</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
                {city.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {totalJobs} verified jobs
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {city.state}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Updated daily
                </span>
              </div>
            </div>
          </section>

          {/* Jobs list */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
              Latest jobs in {city.name}
            </h2>
            {jobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">No jobs found in {city.name} right now. Check back tomorrow — new jobs added daily.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {jobs.map((job) => (
                  <JobCardLink key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>

          {/* Top companies hiring in this city */}
          {companies.length > 0 && (
            <section>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
                Top companies hiring in {city.name}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.slug}`}
                    className="text-left rounded-2xl border border-border bg-card p-4 card-lift"
                  >
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {c._count.jobs} open role{c._count.jobs !== 1 && 's'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.industry || '—'}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* SEO content block */}
          <section className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <h2 className="text-xl font-bold text-foreground mb-3">About working in {city.name}</h2>
            <p className="leading-relaxed mb-3">
              {city.name} is one of India&rsquo;s fastest-growing tech hubs. The city hosts offices of major
              global employers including Google, Microsoft, Amazon, and Meta, alongside a thriving ecosystem of
              Indian product startups. Salaries for software engineers in {city.name} typically range from
              ₹6 LPA (entry-level) to ₹35+ LPA (senior roles at product companies), with the average mid-level
              engineer earning ₹12-18 LPA.
            </p>
            <p className="leading-relaxed mb-3">
              {city.description}
            </p>
            <p className="leading-relaxed">
              Browse {totalJobs} verified job openings in {city.name} on Hirebase. Every listing includes
              structured data &mdash; salary range, required skills, work mode, and experience level &mdash; so you
              can compare opportunities on equal footing. All listings are free to apply; no signup required.
            </p>
          </section>

          {/* Other cities */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-3">Browse jobs in other cities</h2>
            <div className="flex flex-wrap gap-2">
              {CITY_PAGES.filter((c) => c.slug !== city.slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/jobs/${c.slug}`}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </SiteShell>
    </>
  )
}

// ============================================================
// Category landing page — /jobs/fresher, /jobs/internship, etc.
// ============================================================
async function CategoryPage({ category }: { category: string }) {
  const categoryLabels: Record<string, { title: string; label: string; description: string }> = {
    fresher: { label: 'Fresher Jobs', title: 'Fresher Jobs in India (0 Years Experience)', description: 'Find verified fresher jobs in India across software, data, marketing, sales, and operations. Entry-level roles at TCS, Infosys, Wipro, Flipkart, Swiggy, and 100+ companies. No experience required.' },
    internship: { label: 'Internships', title: 'Internships in India — Paid & Verified', description: 'Find paid internships in India at top companies. Software engineering, data science, marketing, design, and product internships. Verified listings, free to apply.' },
    'walk-in': { label: 'Walk-in Jobs', title: 'Walk-in Interview Jobs in India', description: 'Browse walk-in interview jobs across India. Direct interview drives at top companies — no appointment needed. Verified listings, free to attend.' },
    hidden: { label: 'Hidden Jobs', title: 'Hidden Jobs & Referral-Only Roles in India', description: 'Discover hidden jobs and referral-only opportunities in India. Exclusive roles not publicly listed on Naukri or LinkedIn.' },
    experienced: { label: 'Experienced Jobs', title: 'Jobs for Experienced Professionals in India', description: 'Browse senior-level jobs in India. Software, data, product, management roles at top product and services companies.' },
  }
  const cat = categoryLabels[category] || categoryLabels.experienced

  let jobs: any[] = []
  let total = 0
  try {
    const [allJobs, totalCount] = await Promise.all([
      db.job.findMany({
        where: { verified: true, category },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 24,
      }),
      db.job.count({ where: { verified: true, category } }),
    ])
    // Enrich jobs without salary with estimated range
    jobs = await Promise.all(
      allJobs.map(async (j) => {
        if (j.salaryMin != null || j.salaryMax != null) return { ...j, estimatedSalary: null }
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
    total = totalCount
  } catch (e) {
    console.error('Category page SSR fetch failed:', e)
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.hirebase.in/jobs' },
      { '@type': 'ListItem', position: 3, name: cat.label, item: `https://www.hirebase.in/jobs/${category}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <div className="space-y-8 pb-8">
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/jobs" className="hover:text-primary">Jobs</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{cat.label}</span>
          </nav>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{cat.title}</h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">{cat.description}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {total} verified jobs
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Updated daily
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Free to apply
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">Latest {cat.label.toLowerCase()}</h2>
            {jobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">No {cat.label.toLowerCase()} right now. Check back tomorrow.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {jobs.map((job) => (
                  <JobCardLink key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        </div>
      </SiteShell>
    </>
  )
}

// ============================================================
// Helper: a JobCard wrapped in a Next.js Link to /jobs/[slug]
// ============================================================
import { JobCard, type Job } from '@/components/jobs/job-card'

function JobCardLink({ job }: { job: any }) {
  // Convert raw DB job (with Date objects) to the Job type expected by JobCard (with string dates)
  // NOTE: JobCard already wraps itself in a <Link>, so we don't need to wrap it here.
  // The old wrapper caused double-nested <a> tags (HTML spec violation).
  const jobForCard: Job = {
    ...job,
    postedAt: job.postedAt instanceof Date ? job.postedAt.toISOString() : job.postedAt,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
  } as Job
  return <JobCard job={jobForCard} />
}
