'use client'

import * as React from 'react'
import { Loader2, Mic, Send, AlertCircle, User, Bot } from 'lucide-react'
import { toast } from 'sonner'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

export function AIMockInterview() {
  const [role, setRole] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [started, setStarted] = React.useState(false)
  const [messages, setMessages] = React.useState<Msg[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function start() {
    setError('')
    setLoading(true)
    setStarted(true)
    setMessages([{ role: 'user', content: 'Hi, I am ready to begin.' }])
    try {
      const r = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role || undefined,
          company: company || undefined,
          messages: [{ role: 'user', content: 'Hi, I am ready to begin.' }],
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to start')
      setMessages((m) => [...m, { role: 'assistant', content: d.result }])
    } catch (e: any) {
      setError(e.message)
      setStarted(false)
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    if (!input.trim() || loading) return
    const next = [...messages, { role: 'user' as const, content: input }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const r = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role || undefined,
          company: company || undefined,
          messages: next,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setMessages((m) => [...m, { role: 'assistant', content: d.result }])
    } catch (e: any) {
      setError(e.message)
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStarted(false)
    setMessages([])
    setInput('')
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <Mic className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Mock Interview</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Practice with a realistic AI interviewer. One question at a time. Cover behavioral, technical depth, problem-solving, and culture-fit questions.
        </p>
      </header>

      {!started ? (
        <div className="max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Role you're interviewing for</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager, Data Analyst"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Company (optional)</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Amazon, Microsoft"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={start}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {loading ? 'Starting…' : 'Start mock interview'}
          </button>
          <p className="text-xs text-muted-foreground">
            Tip: Answer aloud or type your response. The interviewer will keep it conversational and ask follow-ups.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  {company || 'Tech'} Interviewer
                </div>
                <div className="text-xs text-muted-foreground">
                  {role || 'General role'} · Mock interview
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              End & restart
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            {loading && messages.length > 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-2xl p-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  thinking…
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2 bg-background">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type your response…"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
