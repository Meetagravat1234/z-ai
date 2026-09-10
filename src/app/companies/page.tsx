import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'
import Link from 'next/link'
import { companyUrl } from '@/lib/seo-routes'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Top Companies Hiring in India | Hirebase',
  description:
    'Browse 100+ verified companies hiring in India. See open roles, hiring velocity, 7-day trends, industry, HQ, and direct application links. Google, Amazon, Microsoft, Flipkart, Swiggy, and more.',
  alternates: { canonical: 'https://www.hirebase.in/companies' },
  openGraph: {
    title: 'Top Companies Hiring in India | Hirebase',
    description: 'Browse 100+ verified companies hiring in India. See open roles, hiring velocity, 7-day trends.',
    url: 'https://www.hirebase.in/companies',
  },
}

export default async function CompaniesPage() {
  let companies: any[] = []
  let total = 0
  try {
    ;[companies, total] = await Promise.all([
      db.company.findMany({
        include: { _count: { select: { jobs: { where: { verified: true } } } } },
        orderBy: { name: 'asc' },
      }),
      db.company.count(),
    ])
  } catch (e) {
    console.error('Companies SSR fetch failed:', e)
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Companies', item: 'https://www.hirebase.in/companies' },
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
            <span className="text-foreground font-medium">Companies</span>
          </nav>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Top <span className="gradient-text">companies hiring</span> in India
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Browse {total}+ verified companies actively hiring across India. See open role counts, hiring velocity, industry, and HQ. Click any company to view profile + open roles.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">All companies ({total})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  href={companyUrl(c.slug)}
                  className="text-left rounded-2xl border border-border bg-card p-4 card-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                      {c.logo || '🏢'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c._count.jobs} open role{c._count.jobs !== 1 && 's'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{c.industry || '—'}</span>
                    {c.sevenDayTrend > 0 && (
                      <span className="font-semibold text-emerald-600">+{c.sevenDayTrend}%</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </SiteShell>
    </>
  )
}
