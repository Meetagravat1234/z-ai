'use client'

import * as React from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Target, BookOpen, Rocket, Lightbulb, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ResumeUpload } from '@/components/resume-upload'
import { AdGateModal } from '@/components/ad-gate-modal'

interface GapResult {
  targetRoleSummary?: string
  overallReadiness?: number
  haveSkills?: Array<{ skill: string; relevance: string; note: string }>
  missingSkills?: Array<{ skill: string; priority: string; note: string; learnTime: string }>
  learningPath?: Array<{ phase: string; skills: string[]; duration: string; resources?: Array<{ name: string; type: string; url: string }> }>
  recommendedProjects?: Array<{ name: string; description: string; skillsGained: string[] }>
  estimatedWeeksToReady?: number
  advice?: string
  rawText?: string
}

const POPULAR_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer',
  'Product Manager', 'Cloud Architect', 'Solutions Architect', 'QA Engineer',
]

export function SkillGapView() {
  const [skills, setSkills] = React.useState('')
  const [targetRole, setTargetRole] = React.useState('Software Engineer')
  const [experience, setExperience] = React.useState('0')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<GapResult | null>(null)
  const [showAdGate, setShowAdGate] = React.useState(false)

  async function analyze(adToken?: string) {
    if (!skills.trim() || !targetRole.trim()) {
      setError('Both your current skills and target role are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const url = adToken
        ? `/api/ai/skill-gap?adToken=${encodeURIComponent(adToken)}`
        : '/api/ai/skill-gap'
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          targetRole,
          experienceYears: parseFloat(experience) || 0,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.requiresAd && !adToken) { setShowAdGate(true); setLoading(false); return }
        throw new Error(d.error || 'Failed')
      }
      setResult(d.result)
      toast.success('Skill gap analysis complete!')
    } catch (e: any) {
      setError(e.message)
      toast.error('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdWatched(token: string) { setShowAdGate(false); await analyze(token) }
  function handleAdGateClose() { setShowAdGate(false); setLoading(false) }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <Target className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Skill Gap Analyzer</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Find the skills you're missing for your target role and get a personalized learning path with resources and time estimates.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Your current skills</label>
            <ResumeUpload onTextExtracted={(text) => setSkills(text)} />
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="List your skills, comma-separated. e.g. Python, React, SQL, Docker"
              className="w-full min-h-[100px] p-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold mb-1 block">Target role</label>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                list="roles"
                placeholder="Software Engineer"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <datalist id="roles">
                {POPULAR_ROLES.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">Experience (years)</label>
              <input
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                type="number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => analyze()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {loading ? 'Analyzing…' : 'Analyze Skill Gap'}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Analyzing your skills…
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.overallReadiness !== undefined && (
                <div className="text-center py-4">
                  <div className="text-5xl font-extrabold text-primary">{result.overallReadiness}%</div>
                  <div className="text-sm text-muted-foreground mt-1">Overall Readiness</div>
                </div>
              )}
              {result.targetRoleSummary && (
                <div className="rounded-xl bg-muted p-3 text-sm">{result.targetRoleSummary}</div>
              )}
              {result.haveSkills && result.haveSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-600 mb-2">Skills You Have</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.haveSkills.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">{s.skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.missingSkills && result.missingSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-2">Missing Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 font-medium">{s.skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.estimatedWeeksToReady !== undefined && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
                  <Clock className="w-4 h-4 inline mr-1 text-primary" />
                  Estimated time to ready: <strong>{result.estimatedWeeksToReady} weeks</strong>
                </div>
              )}
              {result.advice && (
                <div className="rounded-xl bg-muted p-3 text-sm">{result.advice}</div>
              )}
              {result.rawText && (
                <div className="rounded-xl bg-muted p-4 text-sm whitespace-pre-wrap">{result.rawText}</div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your skill gap analysis will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <AdGateModal
        open={showAdGate}
        tool="skillGapAnalyses"
        toolLabel="Skill Gap Analyzer"
        onClose={handleAdGateClose}
        onAdWatched={handleAdWatched}
      />
    </div>
  )
}
