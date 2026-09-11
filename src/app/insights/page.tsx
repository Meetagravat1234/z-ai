import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Career Insights & Advice for Indian Job Seekers | Hirebase',
  description:
    'Expert career advice for Indian job seekers. Salary guides, interview preparation, resume tips, and industry insights for software engineers, data scientists, and product managers.',
  alternates: { canonical: 'https://www.hirebase.in/insights' },
  openGraph: {
    title: 'Career Insights & Advice for Indian Job Seekers | Hirebase',
    description:
      'Expert career advice for Indian job seekers. Salary guides, interview prep, resume tips.',
    url: 'https://www.hirebase.in/insights',
  },
}

export default async function InsightsPage() {
  let articles: any[] = []
  let categories: string[] = []
  try {
    articles = await db.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
    categories = Array.from(new Set(articles.map((a) => a.category)))
  } catch (e) {
    console.error('Insights SSR fetch failed:', e)
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Insights', item: 'https://www.hirebase.in/insights' },
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
            <span className="text-foreground font-medium">Insights</span>
          </nav>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Career <span className="gradient-text">insights</span> for Indian job seekers
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Real salary data, interview preparation guides, and actionable career advice from hiring insiders. Updated weekly with fresh content tailored for the Indian tech job market.
              </p>
            </div>
          </section>

          {categories.map((cat) => {
            const catArticles = articles.filter((a) => a.category === cat)
            if (catArticles.length === 0) return null
            return (
              <section key={cat}>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {catArticles.map((a) => (
                    <Link
                      key={a.id}
                      href={`/insights/${a.slug}`}
                      className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
                    >
                      <div className="text-4xl mb-3">{a.coverEmoji}</div>
                      <h3 className="font-bold leading-snug">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium uppercase tracking-wide text-primary">{a.category}</span>
                        <span>·</span>
                        <span>{a.readMinutes} min read</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}

          {articles.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
            </div>
          )}
        </div>
      </SiteShell>
    </>
  )
}
