'use client'

import * as React from 'react'
import { Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string
  author: string
  readMinutes: number
  coverEmoji: string
  createdAt: string
}

const CATEGORIES = ['all', 'fresher', 'interview', 'resume', 'career', 'industry']

export function InsightsView() {
  const [articles, setArticles] = React.useState<Article[]>([])
  const [loading, setLoading] = React.useState(true)
  const [category, setCategory] = React.useState('all')
  const [selected, setSelected] = React.useState<Article | null>(null)

  React.useEffect(() => {
    fetch(`/api/articles?category=${category}`)
      .then((r) => r.json())
      .then((d) => setArticles(d.articles || []))
      .finally(() => setLoading(false))
  }, [category])

  if (selected) {
    return (
      <article className="max-w-3xl mx-auto pb-8">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-primary hover:underline mb-4"
        >
          ← Back to all articles
        </button>
        <div className="text-5xl mb-6">{selected.coverEmoji}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="font-bold uppercase tracking-wider text-primary">{selected.category}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {selected.readMinutes} min read
          </span>
          <span>·</span>
          <span>{selected.author}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
          {selected.title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{selected.excerpt}</p>

        <div className="mt-8 prose prose-slate dark:prose-invert max-w-none">
          {selected.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold mt-6 mb-2">{line.slice(3)}</h2>
            }
            if (line.startsWith('- ')) {
              return <p key={i} className="ml-4 mb-1">• {line.slice(2)}</p>
            }
            if (line.trim()) {
              return <p key={i} className="mb-3 text-foreground/90 leading-relaxed">{line}</p>
            }
            return null
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {selected.tags.split(',').map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
            >
              #{t.trim()}
            </span>
          ))}
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Career Insights</h1>
        <p className="text-muted-foreground mt-2">
          Editorial guidance from hiring insiders — practical, candid, and actionable.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors',
              category === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/70 text-foreground'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="text-left rounded-2xl border border-border bg-card p-5 card-lift"
            >
              <div className="text-4xl mb-3">{a.coverEmoji}</div>
              <h3 className="font-bold leading-snug">{a.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.excerpt}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold uppercase tracking-wider text-primary">{a.category}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {a.readMinutes} min
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
