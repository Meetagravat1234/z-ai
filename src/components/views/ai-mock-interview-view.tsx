'use client'

import * as React from 'react'
import { Loader2, Mic, Send, AlertCircle, User, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { ProUpsellModal } from '@/components/pro-upsell-modal'

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
  const [showAdGate, setShowAdGate] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function callAPI(msgs: Msg[], adToken?: string) {
    const url = adToken
      ? `/api/ai/mock-interview?adToken=${encodeURIComponent(adToken)}`
      : '/api/ai/mock-interview'
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: role || undefined,
        company: company || undefined,
        messages: msgs,
      }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      if (d.requiresAd && !adToken) {
        setShowAdGate(true)
        setLoading(false)
        return null
      }
      throw new Error(d.error || 'Failed')
    }
    return d.result
  }

  async function start(adToken?: string) {
    setError('')
    setLoading(true)
    setStarted(true)
    const initMsgs: Msg[] = [{ role: 'user', content: 'Hi, I am ready to begin.' }]
    setMessages(initMsgs)
    try {
      const result = await callAPI(initMsgs, adToken)
      if (result) {
        setMessages((m) => [...m, { role: 'assistant', content: result }])
      }
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
      const result = await callAPI(next)
      if (result) {
        setMessages((m) => [...m, { role: 'assistant', content: result }])
      }
    } catch (e: any) {
      setError(e.message)
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdWatched(token: string) { setShowAdGate(false) }

  function handleAdGateClose() {
    setShowAdGate(false)
    setLoading(false)
    setStarted(false)
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
          Practice real interview questions with an AI interviewer. Type your answers and get instant follow-ups.
        </p>
      </header>

      {!started ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Role you're interviewing for</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer at Google"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Company (optional)</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Amazon, Flipkart"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => start()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {loading ? 'Starting…' : 'Start Interview'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col" style={{ minHeight: '500px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Interview Session</h3>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">End session</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary" /></div>}
                <div className={cn('rounded-2xl px-4 py-2 max-w-[80%] text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {m.content}
                </div>
                {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="w-4 h-4 text-muted-foreground" /></div>}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary" /></div>
                <div className="rounded-2xl px-4 py-2 bg-muted text-sm flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type your answer…"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
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

      <ProUpsellModal
        open={showAdGate}
        toolLabel="AI Mock Interview"
        used={1}
        limit={1}
        onClose={handleAdGateClose}
      />
    </div>
  )
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ')
}
