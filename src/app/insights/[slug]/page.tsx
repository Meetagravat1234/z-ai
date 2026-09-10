import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await db.article.findUnique({ where: { slug } })
  if (!article) {
    return {
      title: 'Article not found | Hirebase',
      description: 'The article you are looking for may have been removed.',
    }
  }
  const title = `${article.title} | Hirebase`
  const description = article.excerpt.slice(0, 155)
  return {
    title,
    description,
    alternates: { canonical: `https://www.hirebase.in/insights/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.hirebase.in/insights/${slug}`,
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await db.article.findUnique({ where: { slug } })
  if (!article || !article.published) notFound()

  // Get 3 related articles in the same category
  let related: any[] = []
  try {
    related = await db.article.findMany({
      where: { published: true, category: article.category, slug: { not: slug } },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  // Article schema for Google
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: 'Hirebase',
      url: 'https://www.hirebase.in',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.hirebase.in/insights/${slug}`,
    },
  }

  // BreadcrumbList schema
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hirebase.in' },
      { '@type': 'ListItem', position: 2, name: 'Insights', item: 'https://www.hirebase.in/insights' },
      { '@type': 'ListItem', position: 3, name: article.title, item: `https://www.hirebase.in/insights/${slug}` },
    ],
  }

  // Render markdown content (simple version — handles ## headings, **bold**, - bullets, paragraphs)
  const rendered = renderMarkdown(article.content)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteShell>
        <article className="max-w-3xl mx-auto pb-12">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5 mb-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/insights" className="hover:text-primary">Insights</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="text-5xl mb-4">{article.coverEmoji}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              {article.category}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {article.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium">{article.author}</span>
              <span>·</span>
              <span>{article.readMinutes} min read</span>
              <span>·</span>
              <span>Published {new Date(article.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </header>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 pb-8 border-b border-border">
            {article.excerpt}
          </p>

          {/* Article body */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {rendered}
          </div>

          {/* Tags */}
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {article.tags.split(',').map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="border-t border-border pt-10 pb-8">
            <h2 className="text-xl font-bold tracking-tight mb-4">Related articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/insights/${r.slug}`}
                  className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
                >
                  <div className="text-3xl mb-2">{r.coverEmoji}</div>
                  <h3 className="font-bold text-sm leading-snug">{r.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.excerpt}</p>
                  <div className="mt-3 text-xs text-primary font-semibold">{r.readMinutes} min read →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Ready to take the next step?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Browse 300+ verified job openings and use our free AI tools to land your next role.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90"
            >
              Browse all jobs
            </Link>
            <Link
              href="/?view=ai-resume"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-background hover:bg-muted font-semibold"
            >
              Try AI Resume Optimizer
            </Link>
          </div>
        </section>
      </SiteShell>
    </>
  )
}

// ============================================================
// Minimal markdown renderer — handles the subset used in our articles
// ============================================================
// Supports: ## H2, ### H3, - bullets, **bold**, [text](url), paragraphs, hr
// Returns an array of React elements.
function renderMarkdown(md: string) {
  const lines = md.split('\n')
  const blocks: any[] = []
  let i = 0
  let para: string[] = []

  const flushPara = () => {
    if (para.length > 0) {
      const text = para.join(' ')
      blocks.push(<p key={`p-${i}`} className="leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />)
      para = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') {
      flushPara()
      i++
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushPara()
      const text = trimmed.substring(3)
      blocks.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold tracking-tight mt-8 mb-3" dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
      )
    } else if (trimmed.startsWith('### ')) {
      flushPara()
      const text = trimmed.substring(4)
      blocks.push(
        <h3 key={`h3-${i}`} className="text-xl font-bold tracking-tight mt-6 mb-2" dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
      )
    } else if (trimmed.startsWith('- ')) {
      // Collect consecutive bullet lines
      flushPara()
      const bullets: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        bullets.push(lines[i].trim().substring(2))
        i++
      }
      blocks.push(
        <ul key={`ul-${i}`} className="space-y-2 mb-4 ml-4">
          {bullets.map((b, idx) => (
            <li key={`li-${i}-${idx}`} className="list-disc text-foreground" dangerouslySetInnerHTML={{ __html: inlineFormat(b) }} />
          ))}
        </ul>
      )
      continue
    } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushPara()
      blocks.push(<hr key={`hr-${i}`} className="border-border my-6" />)
    } else {
      para.push(trimmed)
    }
    i++
  }
  flushPara()
  return blocks
}

// Inline formatting: **bold**, [text](url)
function inlineFormat(text: string): string {
  // Escape HTML first to prevent XSS
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Links: [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary hover:underline">$1</a>'
  )
  return out
}
