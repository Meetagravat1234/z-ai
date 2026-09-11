import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import { JobCard, type Job } from '@/components/jobs/job-card'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ROLE_PAGES, jobUrl } from '@/lib/seo-routes'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const role = ROLE_PAGES.find((r) => r.slug === slug)
  if (!role) return { title: 'Role not found | Hirebase' }

  const title = `${role.name} Jobs in India — Salary ${role.salaryRange} | Hirebase`
  const description = `Browse ${role.name} jobs in India. Salary range: ${role.salaryRange}. ${role.description} Verified listings at top companies. Free to apply — no signup required.`
  return {
    title,
    description,
    alternates: { canonical: `https://www.hirebase.in/roles/${role.slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.hirebase.in/roles/${role.slug}`,
    },
  }
}

export default async function RolePage({ params }: PageProps) {
  const { slug } = await params
  const role = ROLE_PAGES.find((r) => r.slug === slug)
  if (!role) notFound()

  // Build OR conditions: match any of the role's keywords against title or skills
  const titleConditions = role.keywords.map((k) => ({
    title: { contains: k, mode: 'insensitive' as const },
  }))
  const skillsConditions = role.keywords.map((k) => ({
    skills: { contains: k, mode: 'insensitive' as const },
  }))

  let jobs: any[] = []
  let total = 0
  let topCompanies: any[] = []
  try {
    const where = {
      verified: true,
      OR: [...titleConditions, ...skillsConditions],
    }
    ;[jobs, total, topCompanies] = await Promise.all([
      db.job.findMany({
        where,
        include: { company: true },
        orderBy: { postedAt: 'desc' },
        take: 30,
      }),
      db.job.count({ where }),
      db.company.findMany({
        where: { jobs: { some: { verified: true, OR: [...titleConditions, ...skillsConditions] } } },
        include: { _count: { select: { jobs: { where: { verified: true, OR: [...titleConditions, ...skillsConditions] } } } } },
        orderBy: { name: 'asc' },
        take: 8,
      }),
    ])
  } catch (e) {
    console.error('Role page SSR fetch failed:', e)
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Roles', item: 'https://www.hirebase.in/roles' },
      { '@type': 'ListItem', position: 3, name: role.name, item: `https://www.hirebase.in/roles/${role.slug}` },
    ],
  }

  // FAQ schema for rich snippets
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the salary range for ${role.name} in India?`,
        acceptedAnswer: { '@type': 'Answer', text: `${role.name} salary in India typically ranges from ${role.salaryRange}. Entry-level roles start at the lower end; senior roles at top product companies pay at the higher end. ${role.description}` },
      },
      {
        '@type': 'Question',
        name: `What skills are required for ${role.name} jobs?`,
        acceptedAnswer: { '@type': 'Answer', text: `Top skills for ${role.name}: ${role.topSkills.join(', ')}.` },
      },
      {
        '@type': 'Question',
        name: `How many ${role.name} jobs are available on Hirebase?`,
        acceptedAnswer: { '@type': 'Answer', text: `There are currently ${total} verified ${role.name} job openings on Hirebase. New jobs are added daily via our 30+ source aggregation pipeline.` },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <SiteShell>
        <div className="space-y-8 pb-8">
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/roles" className="hover:text-primary">Roles</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{role.name}</span>
          </nav>

          {/* HERO */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <span className="gradient-text">{role.name}</span> jobs in India
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
                {role.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                  Salary: {role.salaryRange}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {total} open jobs
                </span>
                <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Free to apply
                </span>
              </div>
            </div>
          </section>

          {/* Required skills */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-3">Top skills for {role.name}</h2>
            <div className="flex flex-wrap gap-2">
              {role.topSkills.map((skill) => (
                <Link
                  key={skill}
                  href={`/jobs?q=${encodeURIComponent(skill)}`}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
                >
                  {skill}
                </Link>
              ))}
            </div>
          </section>

          {/* Latest jobs */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
              Latest {role.name} jobs in India
            </h2>
            {jobs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground">
                  No {role.name} jobs available right now. Check back tomorrow — new jobs added daily.
                </p>
                <Link href="/jobs" className="inline-flex mt-4 items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                  Browse all jobs
                </Link>
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

          {/* Top companies hiring for this role */}
          {topCompanies.length > 0 && (
            <section>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
                Top companies hiring {role.name}s
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {topCompanies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.slug}`}
                    className="text-left rounded-2xl border border-border bg-card p-4 card-lift"
                  >
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {c._count.jobs} {role.name.toLowerCase()} role{c._count.jobs !== 1 && 's'}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-xl font-bold text-foreground mb-3">
              Frequently asked questions about {role.name} jobs in India
            </h2>
            <h3 className="font-bold text-foreground mt-4">What is the salary range for {role.name} in India?</h3>
            <p className="text-muted-foreground leading-relaxed">
              {role.name} salary in India typically ranges from {role.salaryRange}. Entry-level roles start at the lower end; senior roles at top product companies pay at the higher end. {role.description}
            </p>
            <h3 className="font-bold text-foreground mt-4">What skills are required for {role.name}?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Top skills for {role.name}: {role.topSkills.join(', ')}. Most roles also require strong fundamentals in computer science, problem-solving, and communication.
            </p>
            <h3 className="font-bold text-foreground mt-4">How many {role.name} jobs are available?</h3>
            <p className="text-muted-foreground leading-relaxed">
              There are currently {total} verified {role.name} job openings on Hirebase. New jobs are added daily via our 30+ source aggregation pipeline including Greenhouse, Ashby, Remotive, Arbeitnow, and direct career-page crawls of 38 Indian companies.
            </p>
          </section>

          {/* Other roles */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-3">Browse other roles</h2>
            <div className="flex flex-wrap gap-2">
              {ROLE_PAGES.filter((r) => r.slug !== role.slug).map((r) => (
                <Link
                  key={r.slug}
                  href={`/roles/${r.slug}`}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </SiteShell>
    </>
  )
}
