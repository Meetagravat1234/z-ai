'use client'

import * as React from 'react'
import { Loader2, FileText, Sparkles, Copy, Check, AlertCircle, Upload, ArrowRight, ArrowLeft, Download } from 'lucide-react'
import { toast } from 'sonner'
import { ResumeUpload } from '@/components/resume-upload'
import { DownloadButtons } from '@/components/download-buttons'
import { ProUpsellModal } from '@/components/pro-upsell-modal'
import { TemplateGallery } from '@/components/template-gallery'
import { ResumeRenderer } from '@/components/resume-renderer'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { useResumeStore } from '@/lib/resume-store'
import type { ResumeTemplate } from '@/lib/resume-templates'
import { getTemplate } from '@/lib/resume-templates'

type Step = 1 | 2 | 3

export function AIResumeOptimizer() {
  const { user } = useAuth()
  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'recruiter' || user?.role === 'admin'

  // Use shared resume store — persists across page navigations
  const { resumeText: sharedResume, setResumeText: setSharedResume } = useResumeStore()

  const [step, setStep] = React.useState<Step>(1)
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null)
  const [resume, setResume] = React.useState(sharedResume || '')
  const [jd, setJd] = React.useState('')

  // Sync local state when shared resume changes (e.g. user uploaded on another page)
  React.useEffect(() => {
    if (sharedResume && sharedResume !== resume) {
      setResume(sharedResume)
    }
  }, [sharedResume])

  // Wrapper that also updates the shared store
  const handleResumeUpload = (text: string) => {
    setResume(text)
    setSharedResume(text)
  }
  const [result, setResult] = React.useState('')
  const [resultTemplate, setResultTemplate] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [showAdGate, setShowAdGate] = React.useState(false)

  async function optimize() {
    if (!resume.trim() || !jd.trim()) {
      setError('Please upload your resume and paste the job description.')
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
          template: selectedTemplate,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.requiresUpgrade || d.requiresAd) {
          setShowAdGate(true)
          setLoading(false)
          return
        }
        if (d.rateLimited) {
          throw new Error(d.error || 'Rate limit reached. Try again in a few minutes.')
        }
        throw new Error(d.error || `Request failed (${r.status})`)
      }
      setResult(d.result)
      setResultTemplate(d.template || null)
      setStep(3)
      toast.success('Tailored resume ready!')
    } catch (e: any) {
      const msg = e.message || 'Unknown error'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('timeout')) {
        setError('Network error. The AI is taking too long to respond. Please try again, or paste a shorter resume.')
        toast.error('Network error — please try again')
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

  function resetAll() {
    setStep(1)
    setSelectedTemplate(null)
    setResume('')
    setJd('')
    setResult('')
    setResultTemplate(null)
    setError('')
  }

  const template = selectedTemplate ? getTemplate(selectedTemplate) : null

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <Sparkles className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Resume Optimizer</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Get a tailored, ATS-friendly resume in 3 simple steps. Choose a template, upload your resume, and we'll generate a polished 1-page resume.
        </p>
      </header>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs">
        <StepIndicator num={1} label="Pick Template" active={step === 1} done={step > 1} />
        <div className="flex-1 h-px bg-border" />
        <StepIndicator num={2} label="Upload Resume" active={step === 2} done={step > 2} />
        <div className="flex-1 h-px bg-border" />
        <StepIndicator num={3} label="View Result" active={step === 3} done={false} />
      </div>

      {/* Step 1: Template Gallery */}
      {step === 1 && (
        <div className="space-y-6">
          <TemplateGallery
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
            isPro={isPro}
            onLockedClick={handleLockedTemplateClick}
          />
          {selectedTemplate && (
            <div className="flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90"
              >
                Continue with {template?.name}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Upload Resume + Job Description */}
      {step === 2 && (
        <div className="space-y-5 max-w-2xl mx-auto">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to templates
          </button>

          {/* Upload resume — ONLY upload, no paste textarea */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="text-sm font-bold mb-2 block">
              Step 2: Upload your resume
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Upload your current resume as a PDF or DOCX file. We'll extract the text automatically.
            </p>
            <ResumeUpload onTextExtracted={handleResumeUpload} />
            {resume && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                ✓ Resume ready — click "Generate My Resume" to continue
              </div>
            )}
          </div>

          {/* Job description */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="text-sm font-bold mb-2 block">
              Target job description
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description (responsibilities, requirements, skills) here."
              className="w-full min-h-[160px] p-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            disabled={loading || !resume.trim() || !jd.trim()}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Optimizing…' : 'Generate My Resume'}
          </button>
        </div>
      )}

      {/* Step 3: Result — styled PDF-like preview */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Start over
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={copyResult}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/70"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* PDF-style preview — looks like an actual page */}
          <div className="flex justify-center">
            <div
              className="bg-white shadow-xl rounded-lg border border-border"
              style={{
                width: '100%',
                maxWidth: '800px',
                minHeight: '1100px',
                padding: '48px 56px',
              }}
            >
              <ResumeRenderer content={result} templateSlug={resultTemplate || selectedTemplate} />
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              Download your resume
            </p>
            <DownloadButtons markdown={result} baseFileName="Resume" template={resultTemplate || selectedTemplate} />
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && step === 2 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 text-center max-w-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">Tailoring your resume…</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is formatting your resume with the {template?.name} template. This takes 5-15 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Pro Upsell Modal */}
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

function StepIndicator({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
          done && 'bg-emerald-500 text-white',
          active && 'bg-primary text-primary-foreground',
          !done && !active && 'bg-muted text-muted-foreground',
        )}
      >
        {done ? <Check className="w-3.5 h-3.5" /> : num}
      </div>
      <span className={cn('text-xs font-medium hidden sm:inline', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  )
}

