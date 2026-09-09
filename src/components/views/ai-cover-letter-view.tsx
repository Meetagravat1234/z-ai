'use client'

import * as React from 'react'
import { Loader2, Sparkles, Copy, Check, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ResumeUpload } from '@/components/resume-upload'

export function AICoverLetter() {
  const [resume, setResume] = React.useState('')
  const [jd, setJd] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')
  const [result, setResult] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  async function generate() {
    if (!resume.trim() || !jd.trim()) {
      setError('Resume and job description are both required.')
      return
    }
    setError('')
    setLoading(true)
    setResult('')
    try {
      const r = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd, companyName: company, role }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Request failed')
      setResult(d.result)
      toast.success('Cover letter generated!')
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to generate cover letter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold mb-3">
          <Sparkles className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Cover Letter Generator</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Generate a personalized, professional cover letter that connects your specific achievements to the job requirements.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold mb-1.5 block">Company (optional)</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-1.5 block">Role (optional)</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Your resume</label>
            <ResumeUpload onTextExtracted={(text) => setResume(text)} />
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume here, or upload a PDF/Word file above."
              className="w-full min-h-[200px] p-4 rounded-xl border border-border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here."
              className="w-full min-h-[160px] p-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating…' : 'Generate cover letter'}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-bold">Generated cover letter</label>
            {result && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                  toast.success('Copied to clipboard')
                }}
                className="text-xs font-medium inline-flex items-center gap-1 text-primary hover:underline"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="min-h-[440px] p-4 rounded-xl border border-border bg-card overflow-y-auto max-h-[640px]">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Writing your cover letter…
              </div>
            ) : result ? (
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-sm">{result}</div>
            ) : (
              <div className="text-center text-muted-foreground py-20">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Your cover letter will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
