'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SiteShell } from '@/components/layout/site-shell'
import { Loader2, Clock, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Trophy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question: string
  options: string[]
  difficulty: string
}

interface TestInfo {
  id: string
  title: string
  subject: string
  topic: string | null
  testType: string
  description: string
  difficulty: string
  durationMin: number
  passingScore: number
  totalQuestions: number
  questions: Question[]
}

interface Result {
  questionId: string
  question: string
  options: string[]
  selectedIdx: number | null
  correctIdx: number
  explanation: string | null
  isCorrect: boolean
}

export function SkillTestClient({ testId }: { testId: string }) {
  const router = useRouter()
  const [test, setTest] = React.useState<TestInfo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [currentQ, setCurrentQ] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<any>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch test
  React.useEffect(() => {
    fetch(`/api/skill-tests/${testId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setTest(d.test)
        setTimeLeft(d.test.durationMin * 60)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [testId])

  // Timer
  React.useEffect(() => {
    if (!test || result) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [test, result])

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function selectAnswer(questionId: string, idx: number) {
    setAnswers(prev => ({ ...prev, [questionId]: idx }))
  }

  async function handleSubmit() {
    if (!test) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const answerArray = test.questions.map(q => ({
        questionId: q.id,
        selectedIdx: answers[q.id] ?? -1,
      }))
      const r = await fetch(`/api/skill-tests/${testId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setResult(d)
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SiteShell>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SiteShell>
    )
  }

  if (error || !test) {
    return (
      <SiteShell>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{error || 'Test not found'}</p>
          <button onClick={() => router.push('/skill-tests')} className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Browse tests
          </button>
        </div>
      </SiteShell>
    )
  }

  // Results screen
  if (result) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto pb-12 space-y-6">
          {/* Score card */}
          <div className={cn(
            'rounded-3xl border-2 p-8 text-center',
            result.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
          )}>
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
              result.passed ? 'bg-emerald-500' : 'bg-amber-500'
            )}>
              {result.passed ? <Trophy className="w-10 h-10 text-white" /> : <Clock className="w-10 h-10 text-white" />}
            </div>
            <div className={cn('text-5xl font-extrabold', result.passed ? 'text-emerald-600' : 'text-amber-600')}>
              {result.score}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {result.correctCount} / {result.totalCount} correct · Passing: {result.passingScore}%
            </p>
            <p className="font-bold text-lg mt-3">
              {result.passed ? '🎉 You passed!' : 'Keep practicing — you\'ll get there!'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); setTimeLeft(test.durationMin * 60); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" /> Retake Test
            </button>
            <button
              onClick={() => router.push('/skill-tests')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-sm"
            >
              Browse More Tests
            </button>
          </div>

          {/* Detailed review */}
          <div>
            <h3 className="font-bold text-lg mb-3">Review Answers</h3>
            <div className="space-y-4">
              {result.results.map((r: Result, i: number) => (
                <div key={r.questionId} className={cn(
                  'rounded-2xl border p-4',
                  r.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
                )}>
                  <div className="flex items-start gap-2 mb-3">
                    {r.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">Q{i + 1}. {r.question}</p>
                    </div>
                  </div>
                  <div className="ml-7 space-y-1.5">
                    {r.options.map((opt, idx) => (
                      <div key={idx} className={cn(
                        'text-sm px-3 py-1.5 rounded-lg',
                        idx === r.correctIdx && 'bg-emerald-500/10 text-emerald-700 font-medium',
                        idx === r.selectedIdx && idx !== r.correctIdx && 'bg-rose-500/10 text-rose-700',
                      )}>
                        {String.fromCharCode(65 + idx)}. {opt}
                        {idx === r.correctIdx && ' ✓'}
                        {idx === r.selectedIdx && idx !== r.correctIdx && ' ✗ (your answer)'}
                      </div>
                    ))}
                  </div>
                  {r.explanation && (
                    <div className="ml-7 mt-2 p-2 rounded-lg bg-muted text-xs text-muted-foreground">
                      💡 {r.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SiteShell>
    )
  }

  // Test-taking screen
  const q = test.questions[currentQ]
  const answeredCount = Object.keys(answers).length
  const timeWarning = timeLeft < 60

  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/skill-tests')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> All Tests
            </button>
            <h1 className="text-xl font-bold mt-1">{test.title}</h1>
          </div>
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold tabular-nums',
            timeWarning ? 'bg-rose-500/10 text-rose-600' : 'bg-muted'
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Question {currentQ + 1} of {test.totalQuestions}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentQ + 1) / test.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded">
              {q.difficulty}
            </span>
          </div>
          <h3 className="text-base font-semibold mb-4">{q.question}</h3>
          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(q.id, idx)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                  answers[q.id] === idx
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {/* Question dots */}
          <div className="flex flex-wrap gap-1 max-w-md justify-center">
            {test.questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-bold transition-all',
                  i === currentQ
                    ? 'bg-primary text-primary-foreground'
                    : answers[qq.id] !== undefined
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < test.totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentQ(prev => Math.min(test.totalQuestions - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>
    </SiteShell>
  )
}
