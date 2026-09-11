'use client'

import * as React from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, FileText, TrendingUp, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAICallWithAdGate } from '@/lib/use-ai-call-with-ad-gate'
import { cn } from '@/lib/utils'
import { ResumeUpload } from '@/components/resume-upload'
import { AdGateModal } from '@/components/ad-gate-modal'

interface ATSResult {
  overallScore?: number
  scoreBreakdown?: { keywordMatch?: number; formatCompliance?: number; experienceRelevance?: number; skillsAlignment?: number; quantification?: number }
  matchedKeywords?: string[]
  missingKeywords?: string[]
  issues?: Array<{ severity: string; category: string; issue: string; fix: string }>
  strengths?: string[]
  topRecommendations?: string[]
  rawText?: string
}

export function ATSScoreView() {
  const [resume, setResume] = React.useState('')
  const [jd, setJd] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<ATSResult | null>(null)
  const [showAdGate, setShowAdGate] = React.useState(false)

  async function check(adToken?: string) {
    if (!resume.trim() || !jd.trim()) {
      setError('Both your resume and the target job description are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const url = adToken
        ? `/api/ai/ats-score?adToken=${encodeURIComponent(adToken)}`
        : '/api/ai/ats-score'
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.requiresAd && !adToken) { setShowAdGate(true); setLoading(false); return }
        throw new Error(d.error || 'Failed')
      }
      setResult(d.result)
      toast.success('ATS analysis complete!')
    } catch (e: any) {
      setError(e.message)
      toast.error('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdWatched(token: string) { setShowAdGate(false); await check(token) }
  function handleAdGateClose() { setShowAdGate(false); setLoading(false) }

  function getScoreColor(score: number) {
    if (score >= 85) return 'text-emerald-600'
    if (score >= 70) return 'text-amber-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-rose-600'
  }

  function getScoreLabel(score: number) {
    if (score >= 85) return 'Excellent — likely to pass ATS'
    if (score >= 70) return 'Good — minor improvements needed'
    if (score >= 50) return 'Moderate — several issues to address'
    return 'Poor — significant rework needed'
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <FileText className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">ATS Score Checker</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Get an ATS compatibility score (0-100) for your resume against any job description, plus specific fix recommendations.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Your resume</label>
            <ResumeUpload onTextExtracted={(text) => setResume(text)} />
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume here, or upload a file above."
              className="w-full min-h-[180px] p-4 rounded-xl border border-border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Target job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here."
              className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => check()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing…' : 'Check ATS Score'}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Analyzing your resume…
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.overallScore !== undefined && (
                <div className="text-center py-4">
                  <div className={cn('text-5xl font-extrabold tabular-nums', getScoreColor(result.overallScore))}>
                    {result.overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{getScoreLabel(result.overallScore)}</div>
                </div>
              )}
              {result.scoreBreakdown && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Score Breakdown</h4>
                  {Object.entries(result.scoreBreakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-40 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${val as number}%` }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-8 text-right">{val as number}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.topRecommendations && result.topRecommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Top Recommendations</h4>
                  <ol className="space-y-2 text-sm">
                    {result.topRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {result.rawText && (
                <div className="rounded-xl bg-muted p-4 text-sm whitespace-pre-wrap">{result.rawText}</div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your ATS score will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <AdGateModal
        open={showAdGate}
        tool="atsChecks"
        toolLabel="ATS Score Checker"
        onClose={handleAdGateClose}
        onAdWatched={handleAdWatched}
      />
    </div>
  )
}
