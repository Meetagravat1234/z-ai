import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ROLE_PAGES, roleUrl } from '@/lib/seo-routes'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Browse Jobs by Role in India | Hirebase',
  description:
    'Browse jobs by role: Software Engineer, Data Scientist, Product Manager, Full Stack Developer, DevOps Engineer, UI/UX Designer, and more. Each role page includes salary range, top skills, and current openings.',
  alternates: { canonical: 'https://www.hirebase.in/roles' },
  openGraph: {
    title: 'Browse Jobs by Role in India | Hirebase',
    description: 'Browse jobs by role. Salary ranges, top skills, current openings for 15+ roles in India.',
    url: 'https://www.hirebase.in/roles',
  },
}

export default function RolesPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Roles', item: 'https://www.hirebase.in/roles' },
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
            <span className="text-foreground font-medium">Roles</span>
          </nav>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Browse jobs by <span className="gradient-text">role</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Explore {ROLE_PAGES.length}+ role-specific landing pages. Each page shows current openings, salary range, top skills required, top companies hiring, and frequently asked questions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">All roles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {ROLE_PAGES.map((r) => (
                <Link
                  key={r.slug}
                  href={roleUrl(r.slug)}
                  className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
                >
                  <h3 className="font-bold text-foreground">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="font-semibold text-emerald-600">{r.salaryRange}</span>
                    <span className="text-muted-foreground">{r.topSkills.slice(0, 3).join(' · ')}</span>
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
