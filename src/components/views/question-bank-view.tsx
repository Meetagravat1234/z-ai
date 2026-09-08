'use client'

import * as React from 'react'
import { Loader2, MessageSquare, Sparkles, ChevronDown, ChevronUp, Search, BookOpen, Code, User, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  type: string
  question: string
  role: string
  difficulty: string
  tags: string
}

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  behavioral: { label: 'Behavioral', icon: User, color: 'bg-amber-500/10 text-amber-600' },
  technical: { label: 'Technical', icon: Code, color: 'bg-blue-500/10 text-blue-600' },
  product: { label: 'Product', icon: Briefcase, color: 'bg-violet-500/10 text-violet-600' },
}

const ROLE_OPTIONS = [
  { id: 'all', label: 'All roles' },
  { id: 'general', label: 'General' },
  { id: 'software-engineer', label: 'Software Engineer' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'data-scientist', label: 'Data Scientist' },
  { id: 'devops', label: 'DevOps' },
  { id: 'product-manager', label: 'Product Manager' },
]

const TYPE_OPTIONS = [
  { id: 'all', label: 'All types' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'technical', label: 'Technical' },
  { id: 'product', label: 'Product' },
]

const DIFFICULTY_OPTIONS = [
  { id: 'all', label: 'All levels' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

export function QuestionBankView() {
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [loading, setLoading] = React.useState(true)
  const [role, setRole] = React.useState('all')
  const [type, setType] = React.useState('all')
  const [difficulty, setDifficulty] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [answer, setAnswer] = React.useState<string>('')
  const [answerLoading, setAnswerLoading] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ role, type, difficulty })
    fetch(`/api/interview-questions?${params}`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .finally(() => setLoading(false))
  }, [role, type, difficulty])

  React.useEffect(() => { load() }, [load])

  const filtered = questions.filter((q) =>
    !search || q.question.toLowerCase().includes(search.toLowerCase()) || q.tags.toLowerCase().includes(search.toLowerCase())
  )

  async function loadAnswer(q: Question) {
    if (expandedId === q.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(q.id)
    setAnswer('')
    setAnswerLoading(true)
    try {
      const r = await fetch('/api/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, role: q.role }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setAnswer(d.result || '')
    } catch (e: any) {
      toast.error(`Failed to load answer: ${e.message}`)
      setExpandedId(null)
    } finally {
      setAnswerLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
          <BookOpen className="w-3 h-3" />
          INTERVIEW PREP
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Interview Question Bank</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          A curated database of real interview questions by role and type. Click any question to get an AI-generated model answer with key points, common mistakes, and follow-up questions to expect.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or tags…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm">
          {ROLE_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm">
          {TYPE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm">
          {DIFFICULTY_OPTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border">
          <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No questions match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const meta = TYPE_META[q.type] || TYPE_META.technical
            const Icon = meta.icon
            const isExpanded = expandedId === q.id
            const diffColor = q.difficulty === 'easy' ? 'text-emerald-600 bg-emerald-500/10' :
                              q.difficulty === 'medium' ? 'text-amber-600 bg-amber-500/10' :
                              'text-rose-600 bg-rose-500/10'
            return (
              <div key={q.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => loadAnswer(q)}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-start gap-3"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase', meta.color)}>
                        {meta.label}
                      </span>
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase', diffColor)}>
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{q.role.replace(/-/g, ' ')}</span>
                    </div>
                    <p className="font-medium text-sm">{q.question}</p>
                    {q.tags && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {q.tags.split(',').map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-3" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    {answerLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                        <span className="text-sm text-muted-foreground">Generating model answer…</span>
                      </div>
                    ) : answer ? (
                      <div className="pt-4 prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownView text={answer} />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MarkdownView({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-foreground/90">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-sm mt-3 mb-1">{line.slice(4)}</h3>
        if (line.startsWith('## ')) return <h2 key={i} className="font-bold text-base mt-4 mb-2">{line.slice(3)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="ml-4 mb-1 text-sm">• {line.slice(2)}</p>
        if (line.trim() === '') return <div key={i} className="h-2" />
        if (line.startsWith('```')) return null
        return <p key={i} className="mb-2 text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}
