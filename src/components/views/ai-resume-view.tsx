'use client'

import * as React from 'react'
import { Loader2, FileText, Sparkles, Copy, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ResumeUpload } from '@/components/resume-upload'
import { DownloadButtons } from '@/components/download-buttons'
import { ProUpsellModal } from '@/components/pro-upsell-modal'
import { ResumeTemplatePicker } from '@/components/resume-template-picker'
import { ResumeRenderer } from '@/components/resume-renderer'
import { useAuth } from '@/lib/auth-context'
import type { ResumeTemplate } from '@/lib/resume-templates'

export function AIResumeOptimizer() {
  const { user } = useAuth()
  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'recruiter' || user?.role === 'admin'

  const [resume, setResume] = React.useState('')
  const [jd, setJd] = React.useState('')
  const [result, setResult] = React.useState('')
  const [resultTemplate, setResultTemplate] = React.useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [showAdGate, setShowAdGate] = React.useState(false)

  // Direct API call — no hook, no Promise indirection.
  // If the API returns requiresAd or requiresUpgrade, we show the ProUpsell modal.
  async function optimize() {
    if (!resume.trim() || !jd.trim()) {
      setError('Both your resume and the target job description are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult('')
    setResultTemplate(null)
    try {
      const r = await fetch('/api/ai/resume-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          jobDescription: jd,
          template: selectedTemplate, // null if no template selected
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        // If user must sign in OR has exhausted quota → show Pro upsell modal
        if (d.requiresUpgrade || d.requiresAd) {
          setShowAdGate(true)
          setLoading(false)
          return
        }
        // Rate-limited (429) — show specific message
        if (d.rateLimited) {
          throw new Error(d.error || 'Rate limit reached. Try again in a few minutes.')
        }
        // Other errors — show the actual server error message
        throw new Error(d.error || `Request failed (${r.status})`)
      }
      setResult(d.result)
      setResultTemplate(d.template || null)
      toast.success('Tailored resume ready!')
    } catch (e: any) {
      const msg = e.message || 'Unknown error'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('timeout')) {
        setError('Network error. The AI is taking too long to respond. Please try again, or paste a shorter resume.')
        toast.error('Network error — please try again with a shorter resume')
      } else {
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleAdGateClose() {
    setShowAdGate(false)
    setLoading(false)
  }

  // When a non-Pro user clicks a locked template, show the upsell modal
  function handleLockedTemplateClick(_template: ResumeTemplate) {
    setShowAdGate(true)
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

      {/* Template picker — 10 Pro templates */}
      <ResumeTemplatePicker
        selected={selectedTemplate}
        onSelect={setSelectedTemplate}
        isPro={isPro}
        onLockedClick={handleLockedTemplateClick}
      />

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
            <h3 className="font-bold">
              Optimized Resume
              {resultTemplate && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({resultTemplate})
                </span>
              )}
            </h3>
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
              {/* Use the new ResumeRenderer with the template slug */}
              <div className="bg-white rounded-lg p-4 border border-border">
                <ResumeRenderer content={result} templateSlug={resultTemplate} />
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide font-semibold">
                  Download your resume
                </p>
                <DownloadButtons markdown={result} baseFileName="Resume" />
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

      {/* Pro Upsell Modal — shown when free user tries to use a template OR exhausts quota */}
      <ProUpsellModal
        open={showAdGate}
        toolLabel="AI Resume Optimizer + Templates"
        used={1}
        limit={1}
        onClose={handleAdGateClose}
      />
    </div>
  )
}
