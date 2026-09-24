'use client'

import * as React from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, FileText, TrendingUp, Copy, Check, XCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ResumeUpload } from '@/components/resume-upload'
import { ProUpsellModal } from '@/components/pro-upsell-modal'

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

  async function check() {
    if (!resume.trim() || !jd.trim()) {
      setError('Both your resume and the target job description are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/ai/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.requiresUpgrade || d.requiresAd) { setShowAdGate(true); setLoading(false); return }
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

  function handleAdGateClose() { setShowAdGate(false); setLoading(false) }

  function getScoreColor(score: number): string {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 70) return 'text-amber-600 dark:text-amber-400'
    if (score >= 50) return 'text-orange-600 dark:text-orange-400'
    return 'text-rose-600 dark:text-rose-400'
  }

  function getScoreBg(score: number): string {
    if (score >= 85) return 'bg-emerald-500'
    if (score >= 70) return 'bg-amber-500'
    if (score >= 50) return 'bg-orange-500'
    return 'bg-rose-500'
  }

  function getScoreRing(score: number): string {
    if (score >= 85) return 'stroke-emerald-500'
    if (score >= 70) return 'stroke-amber-500'
    if (score >= 50) return 'stroke-orange-500'
    return 'stroke-rose-500'
  }

  function getScoreLabel(score: number): string {
    if (score >= 85) return 'Excellent — likely to pass ATS'
    if (score >= 70) return 'Good — minor improvements needed'
    if (score >= 50) return 'Moderate — several issues to address'
    return 'Poor — significant rework needed'
  }

  function getScoreBgLight(score: number): string {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    if (score >= 70) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    if (score >= 50) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
  }

  const severityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    critical: { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
    info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
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
          {/* Upload resume — ONLY upload, no paste textarea */}
          <div>
            <label className="text-sm font-bold mb-1.5 block">Upload your resume</label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a PDF or DOCX file — we'll extract the text automatically.
            </p>
            <ResumeUpload onTextExtracted={(text) => setResume(text)} />
            {resume && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
                ✓ Resume uploaded ({resume.length} chars extracted)
              </div>
            )}
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

        {/* Results panel */}
        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm">Analyzing your resume against the job description…</span>
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* Score Circle + Label */}
              {result.overallScore !== undefined && (
                <div className="flex items-center gap-4">
                  {/* Circular progress ring */}
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" className="stroke-muted" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="36" fill="none"
                        className={getScoreRing(result.overallScore)}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - result.overallScore / 100)}`}
                      />
                    </svg>
                    <div className={cn('absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums', getScoreColor(result.overallScore))}>
                      {result.overallScore}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold border', getScoreBgLight(result.overallScore))}>
                      {getScoreLabel(result.overallScore)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      ATS systems scan resumes for keywords, formatting, and relevance. A higher score means better visibility to recruiters.
                    </p>
                  </div>
                </div>
              )}

              {/* Score Breakdown — colored progress bars */}
              {result.scoreBreakdown && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Score Breakdown</h4>
                  {Object.entries(result.scoreBreakdown).map(([key, val]) => {
                    const v = val as number
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-36 capitalize text-xs">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full transition-all duration-700', getScoreBg(v))}
                            style={{ width: `${v}%` }}
                          />
                        </div>
                        <span className={cn('text-xs font-bold tabular-nums w-8 text-right', getScoreColor(v))}>
                          {v}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Keywords — matched (green) + missing (red) */}
              {result.matchedKeywords && result.matchedKeywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Matched Keywords ({result.matchedKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.missingKeywords && result.missingKeywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Missing Keywords ({result.missingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues with severity colors */}
              {result.issues && result.issues.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Issues Found</h4>
                  <div className="space-y-2">
                    {result.issues.map((issue, i) => {
                      const config = severityConfig[issue.severity] || severityConfig.info
                      const Icon = config.icon
                      return (
                        <div key={i} className={cn('rounded-lg border p-3', config.bg)}>
                          <div className="flex items-start gap-2">
                            <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.color)} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{issue.issue}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-semibold">Fix:</span> {issue.fix}
                              </div>
                              <span className="inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {issue.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {result.strengths && result.strengths.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> What's Working Well
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top Recommendations */}
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

              {/* CTA: Optimize your resume */}
              {result.overallScore !== undefined && result.overallScore < 90 && (
                <Link
                  href="/ai-tools/resume-optimizer"
                  className="block mt-2 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-primary/10 border border-violet-500/20 hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">Optimize your resume with AI</div>
                      <div className="text-xs text-muted-foreground">
                        Get a tailored, ATS-friendly version of your resume for this job description.
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              )}

              {result.rawText && (
                <div className="rounded-xl bg-muted p-4 text-sm whitespace-pre-wrap">{result.rawText}</div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your ATS score will appear here.</p>
              <p className="text-xs mt-1">Paste your resume + job description, then click "Check ATS Score".</p>
            </div>
          )}
        </div>
      </div>

      <ProUpsellModal
        open={showAdGate}
        toolLabel="ATS Score Checker"
        used={1}
        limit={1}
        onClose={handleAdGateClose}
      />
    </div>
  )
}
