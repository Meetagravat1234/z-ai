'use client'

import * as React from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, FileText, TrendingUp, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ATSResult {
  overallScore?: number
  scoreBreakdown?: {
    keywordMatch: number
    formatCompliance: number
    experienceRelevance: number
    skillsAlignment: number
    quantification: number
  }
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
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setResult(d.result)
      toast.success('ATS analysis complete!')
    } catch (e: any) {
      setError(e.message)
      toast.error('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-3xl font-extrabold tracking-tight">Resume ATS Score Checker</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Find out if your resume will pass through Applicant Tracking Systems. Get an ATS compatibility score (0–100) and specific, actionable recommendations to fix issues.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Your resume</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your full resume text here."
              className="w-full min-h-[240px] p-4 rounded-xl border border-border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="text-xs text-muted-foreground mt-1">{resume.length} chars</div>
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Target job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description you're applying for."
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
            onClick={check}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing…' : 'Check my ATS score'}
          </button>
        </div>

        {/* Result preview */}
        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          {!result && !loading && (
            <div className="text-center text-muted-foreground py-20">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your ATS score will appear here.</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground text-sm">Analyzing your resume…</span>
            </div>
          )}
          {result && !result.rawText && result.overallScore != null && (
            <div className="space-y-4">
              {/* Big score */}
              <div className="text-center py-4">
                <div className={cn('text-7xl font-extrabold', getScoreColor(result.overallScore))}>
                  {result.overallScore}
                </div>
                <div className="text-xs text-muted-foreground mt-2">out of 100</div>
                <div className={cn('text-sm font-semibold mt-1', getScoreColor(result.overallScore))}>
                  {getScoreLabel(result.overallScore)}
                </div>
              </div>
              {/* Score breakdown */}
              {result.scoreBreakdown && (
                <div className="space-y-2">
                  {Object.entries(result.scoreBreakdown).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-bold tabular-nums">{val}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            val >= 70 ? 'bg-emerald-500' : val >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Scroll down for keyword match analysis, issues found, and specific fix recommendations.
              </p>
            </div>
          )}
          {result?.rawText && <pre className="text-xs whitespace-pre-wrap">{result.rawText}</pre>}
        </div>
      </div>

      {/* Full results */}
      {result && !result.rawText && !loading && (
        <div className="space-y-6">
          {/* Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.matchedKeywords && result.matchedKeywords.length > 0 && (
              <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Matched keywords ({result.matchedKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">{k}</span>
                  ))}
                </div>
              </section>
            )}
            {result.missingKeywords && result.missingKeywords.length > 0 && (
              <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Missing keywords ({result.missingKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">{k}</span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold text-lg mb-4">Issues found ({result.issues.length})</h3>
              <div className="space-y-3">
                {result.issues.map((issue, i) => (
                  <div key={i} className="border-l-2 pl-4 pb-1" style={{
                    borderColor: issue.severity === 'critical' ? 'oklch(0.58 0.24 25)' :
                                 issue.severity === 'warning' ? 'oklch(0.72 0.18 65)' : 'oklch(0.55 0.15 165)'
                  }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase',
                        issue.severity === 'critical' && 'bg-rose-500/10 text-rose-600',
                        issue.severity === 'warning' && 'bg-amber-500/10 text-amber-600',
                        issue.severity === 'info' && 'bg-primary/10 text-primary'
                      )}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{issue.category}</span>
                    </div>
                    <div className="text-sm font-medium">{issue.issue}</div>
                    <div className="text-xs text-muted-foreground mt-1">→ {issue.fix}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                What's working well
              </h3>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Top recommendations */}
          {result.topRecommendations && result.topRecommendations.length > 0 && (
            <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-violet-500/5 p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Top 5 recommendations (in order of impact)
              </h3>
              <ol className="space-y-2.5">
                {result.topRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-bold text-primary shrink-0 w-6 text-center">{i + 1}.</span>
                    <span className="text-sm text-foreground/90">{rec}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
