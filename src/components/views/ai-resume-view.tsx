'use client'

import * as React from 'react'
import { Loader2, FileText, Sparkles, Copy, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ResumeUpload } from '@/components/resume-upload'
import { DownloadButtons } from '@/components/download-buttons'
import { ProUpsellModal } from '@/components/pro-upsell-modal'

export function AIResumeOptimizer() {
  const [resume, setResume] = React.useState('')
  const [jd, setJd] = React.useState('')
  const [result, setResult] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [showAdGate, setShowAdGate] = React.useState(false)

  // Direct API call — no hook, no Promise indirection.
  // If the API returns requiresAd, we show the AdGate modal.
  // When the ad is watched, we retry with the token.
  async function optimize(adToken?: string) {
    if (!resume.trim() || !jd.trim()) {
      setError('Both your resume and the target job description are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult('')
    try {
      const url = adToken
        ? `/api/ai/resume-optimize?adToken=${encodeURIComponent(adToken)}`
        : '/api/ai/resume-optimize'
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        // If the API says "watch an ad", show the modal — don't throw
        if (d.requiresAd && !adToken) {
          setShowAdGate(true)
          setLoading(false)
          return
        }
        throw new Error(d.error || 'Request failed')
      }
      setResult(d.result)
      toast.success('Tailored resume ready!')
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to optimize resume')
    } finally {
      setLoading(false)
    }
  }

  // Called when the user finishes watching the ad
  async function handleAdWatched(token: string) { setShowAdGate(false) }

  // Called when the user closes the ad gate without watching
  function handleAdGateClose() {
    setShowAdGate(false)
    setLoading(false)
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <Sparkles className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Resume Optimizer</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Paste your current resume and the job description you want to target. Hirebase will produce an ATS-friendly, keyword-aligned version that highlights your most relevant experience.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Your current resume</label>
            <ResumeUpload onTextExtracted={(text) => setResume(text)} />
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your full resume here, or upload a PDF/Word file above. Include work experience, education, skills, and projects."
              className="w-full min-h-[260px] p-4 rounded-xl border border-border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="text-xs text-muted-foreground mt-1">{resume.length} chars</div>
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Target job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description (responsibilities, requirements, skills) here."
              className="w-full min-h-[180px] p-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => optimize()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Optimizing…' : 'Optimize Resume'}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Optimized Resume</h3>
            {result && (
              <button
                onClick={copyResult}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/70"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Tailoring your resume…
            </div>
          ) : result ? (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownView text={result} />
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide font-semibold">
                  Download your resume
                </p>
                <DownloadButtons markdown={result} baseFileName="hirebase-resume" />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your tailored resume will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ad Gate Modal — shown when free quota is used up */}
      <ProUpsellModal
        open={showAdGate}
        toolLabel="AI Resume Optimizer"
        used={1}
        limit={1}
        onClose={handleAdGateClose}
      />
    </div>
  )
}

// Simple markdown renderer
function MarkdownView({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-sm">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-base mt-3">{line.slice(4)}</h3>
        if (line.startsWith('## ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('# ')) return <h1 key={i} className="font-extrabold text-xl mt-4 mb-2">{line.slice(2)}</h1>
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="ml-4 mb-1">• {line.slice(2)}</p>
        if (line.trim() === '') return <div key={i} className="h-2" />
        return <p key={i} className="mb-2 leading-relaxed">{line}</p>
      })}
    </div>
  )
}
