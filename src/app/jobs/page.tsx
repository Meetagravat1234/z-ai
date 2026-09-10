import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import { JobCard, type Job } from '@/components/jobs/job-card'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CITY_PAGES, jobUrl } from '@/lib/seo-routes'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'All Verified Jobs in India | Hirebase',
  description:
    'Browse 300+ verified jobs in India. Filter by role, location, salary, experience level, and work mode. Software, data, product, design, marketing roles at top companies. Free to apply — no signup required.',
  alternates: { canonical: 'https://www.hirebase.in/jobs' },
  openGraph: {
    title: 'All Verified Jobs in India | Hirebase',
    description:
      'Browse 300+ verified jobs in India. Filter by role, location, salary, experience. Free to apply.',
    url: 'https://www.hirebase.in/jobs',
  },
}

export default async function AllJobsPage() {
  let jobs: any[] = []
  let total = 0
  let categories: { category: string; count: number }[] = []

  try {
    ;[jobs, total, categories] = await Promise.all([
      db.job.findMany({
        where: { verified: true },
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 60,
      }),
      db.job.count({ where: { verified: true } }),
      db.job.groupBy({
        by: ['category'],
        where: { verified: true },
        _count: true,
        orderBy: { _count: { category: 'desc' } },
      }),
    ])
  } catch (e) {
    console.error('All Jobs SSR fetch failed:', e)
  }

  const categoryLabels: Record<string, string> = {
    fresher: 'Fresher Jobs',
    internship: 'Internships',
    'walk-in': 'Walk-in Jobs',
    hidden: 'Hidden Jobs',
    experienced: 'Experienced Jobs',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://www.hirebase.in/jobs' },
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
            <span className="text-foreground font-medium">Jobs</span>
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
                    {categoryLabels[c.category] || c.category} ({c._count})
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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">Latest verified jobs</h2>
            {jobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">No jobs available right now. Check back shortly.</p>
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
          </section>
        </div>
      </SiteShell>
    </>
  )
}
