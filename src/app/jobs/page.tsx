import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import { JobCard, type Job } from '@/components/jobs/job-card'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CITY_PAGES, jobUrl } from '@/lib/seo-routes'
import { estimateSalaryForJob } from '@/lib/salary-estimate'

export const revalidate = 300 // 5 min ISR — pages are cached + revalidated

const JOBS_PER_PAGE = 60

// Generate metadata for each page (page 1, 2, 3...) so Google sees
// unique titles + canonicals for each paginated URL.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1'))
  const baseTitle = 'All Verified Jobs in India'
  const title = page === 1 ? `${baseTitle} | Hirebase` : `${baseTitle} — Page ${page} | Hirebase`
  const description = `Browse 860+ verified jobs in India. Filter by role, location, salary, experience level, and work mode. Page ${page}.`
  const canonical = page === 1 ? 'https://www.hirebase.in/jobs' : `https://www.hirebase.in/jobs?page=${page}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  }
}

export default async function AllJobsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1'))
  const skip = (page - 1) * JOBS_PER_PAGE

  let jobs: any[] = []
  let total = 0
  let categories: { category: string; count: number }[] = []

  try {
    const [allJobs, totalCount, categoryGroups] = await Promise.all([
      db.job.findMany({
        where: { verified: true },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: JOBS_PER_PAGE,
        skip,
      }),
      db.job.count({ where: { verified: true } }),
      db.job.groupBy({
        by: ['category'],
        where: { verified: true },
        _count: true,
        orderBy: { _count: { category: 'desc' } },
      }),
    ])
    // Enrich jobs without salary with estimated range — uses in-memory benchmark
    // cache so it's essentially free after the first call.
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
    categories = categoryGroups as any
  } catch (e) {
    console.error('All Jobs SSR fetch failed:', e)
  }

  const totalPages = Math.ceil(total / JOBS_PER_PAGE)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const categoryLabels: Record<string, string> = {
    fresher: 'Fresher Jobs',
    internship: 'Internships',
    'walk-in': 'Walk-in Jobs',
    hidden: 'Hidden Jobs',
    experienced: 'Experienced Jobs',
    remote: 'Remote Jobs',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.hirebase.in/jobs' },
    ],
  }

  // ItemList structured data — tells Google these jobs belong together.
  // Helps with Google for Jobs indexing.
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: total,
    itemListElement: jobs.map((j, i) => ({
      '@type': 'ListItem',
      position: skip + i + 1,
      url: `https://www.hirebase.in${jobUrl(j)}`,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <SiteShell>
        <div className="space-y-8 pb-8">
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Jobs{page > 1 ? ` (Page ${page})` : ''}</span>
          </nav>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                All <span className="gradient-text">verified jobs</span> in India
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Browse {total}+ verified job openings across India. Filter by category, city, role, salary, or work mode. Every listing is free to apply &mdash; no signup required.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.category}
                    href={`/jobs/${c.category}`}
                    className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-sm font-medium transition-colors"
                  >
                    {categoryLabels[c.category] || c.category} ({c._count || c.count})
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Filter chips by city */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Browse by city
            </h2>
            <div className="flex flex-wrap gap-2">
              {CITY_PAGES.map((c) => (
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

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Latest verified jobs
                {page > 1 && <span className="text-muted-foreground text-sm font-normal ml-2">— Page {page} of {totalPages}</span>}
              </h2>
              <span className="text-xs text-muted-foreground">
                Showing {skip + 1}–{Math.min(skip + JOBS_PER_PAGE, total)} of {total}
              </span>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">No jobs found on this page. Try the previous page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {jobs.map((job) => (
                  <Link key={job.id} href={jobUrl(job)} className="block">
                    <JobCard
                      job={{
                        ...job,
                        postedAt: job.postedAt instanceof Date ? job.postedAt.toISOString() : job.postedAt,
                        createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
                      } as Job}
                    />
                  </Link>
                ))}
              </div>
            )}

            {/* Server-side pagination — every page has its own URL, so Google
                can crawl all 860+ jobs, not just the first 60. */}
            {(hasNextPage || hasPrevPage) && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                {hasPrevPage ? (
                  <Link
                    href={page === 2 ? '/jobs' : `/jobs?page=${page - 1}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-muted-foreground/50 cursor-not-allowed">
                    ← Previous
                  </span>
                )}

                {/* Page number links */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (page <= 4) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = page - 3 + i
                    }
                    const isActive = pageNum === page
                    const href = pageNum === 1 ? '/jobs' : `/jobs?page=${pageNum}`
                    return (
                      <Link
                        key={pageNum}
                        href={href}
                        className={cn(
                          'w-9 h-9 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-card hover:bg-muted'
                        )}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>

                {hasNextPage ? (
                  <Link
                    href={`/jobs?page=${page + 1}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-muted-foreground/50 cursor-not-allowed">
                    Next →
                  </span>
                )}
              </nav>
            )}
          </section>
        </div>
      </SiteShell>
    </>
  )
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
