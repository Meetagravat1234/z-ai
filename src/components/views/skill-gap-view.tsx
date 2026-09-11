'use client'

import * as React from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Target, BookOpen, Rocket, Lightbulb, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ResumeUpload } from '@/components/resume-upload'
import { useAICallWithAdGate } from '@/lib/use-ai-call-with-ad-gate'

interface GapResult {
  targetRoleSummary?: string
  overallReadiness?: number
  haveSkills?: Array<{ skill: string; relevance: string; note: string }>
  missingSkills?: Array<{ skill: string; priority: string; note: string; learnTime: string }>
  learningPath?: Array<{
    phase: string
    skills: string[]
    duration: string
    resources?: Array<{ name: string; type: string; url: string }>
  }>
  recommendedProjects?: Array<{ name: string; description: string; skillsGained: string[] }>
  estimatedWeeksToReady?: number
  advice?: string
  rawText?: string
}

const POPULAR_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer',
  'Product Manager', 'Cloud Architect', 'Solutions Architect', 'QA Engineer',
  'Site Reliability Engineer', 'Security Engineer', 'Mobile Developer (iOS/Android)',
]

export function SkillGapView() {
  const [skills, setSkills] = React.useState('')
  const [targetRole, setTargetRole] = React.useState('Software Engineer')
  const [experience, setExperience] = React.useState('0')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<GapResult | null>(null)
  const { call, adGateModal } = useAICallWithAdGate()

  async function analyze() {
    if (!skills.trim() || !targetRole.trim()) {
      setError('Both your current skills and target role are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const r = await call('/api/ai/skill-gap', {
        tool: 'skillGapAnalyses',
        toolLabel: 'Skill Gap Analyzer',
        body: {
          currentSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          targetRole,
          experienceYears: parseFloat(experience) || 0,
        },
      })
      if (!r.ok) throw new Error(r.error || 'Failed')
      setResult(r.data.result)
      toast.success('Skill gap analysis complete!')
    } catch (e: any) {
      setError(e.message)
      toast.error('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold mb-3">
          <Target className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Skill Gap Analyzer</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Enter your current skills and your target role. AI will tell you exactly what you're missing, how long it'll take to learn, and give you a personalized learning path.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input form */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Your current skills (comma-separated)</label>
            <ResumeUpload
              onTextExtracted={(text) => setSkills(text)}
              label="Upload resume to auto-extract skills"
            />
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Python, JavaScript, React, SQL, Git, basic AWS — or upload your resume above to auto-extract."
              className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="text-xs text-muted-foreground mt-1">{skills.split(',').filter(s => s.trim()).length} skills</div>
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Target role</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              list="roles"
              placeholder="e.g. Senior Backend Engineer"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <datalist id="roles">
              {POPULAR_ROLES.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Years of experience: <span className="text-primary">{experience}</span></label>
            <input type="range" min="0" max="20" step="0.5" value={experience}
              onChange={(e) => setExperience(e.target.value)} className="w-full" />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing…' : 'Analyze my skill gap'}
          </button>
        </div>

        {/* Result preview */}
        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          {!result && !loading && (
            <div className="text-center text-muted-foreground py-20">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your skill gap analysis will appear here.</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground text-sm">Analyzing your skills…</span>
            </div>
          )}
          {result && !result.rawText && <ResultView result={result} />}
          {result?.rawText && <pre className="text-xs whitespace-pre-wrap">{result.rawText}</pre>}
        </div>
      </div>

      {/* Full results below */}
      {result && !result.rawText && !loading && (
        <div className="space-y-6">
          {/* Readiness score */}
          {result.overallReadiness != null && (
            <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-violet-500/5 p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Overall readiness for {targetRole}</div>
                  <div className="text-5xl font-extrabold gradient-text mt-1">{result.overallReadiness}%</div>
                  {result.targetRoleSummary && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">{result.targetRoleSummary}</p>
                  )}
                </div>
                <div className="text-right">
                  <Clock className="w-6 h-6 text-violet-500 mx-auto mb-1" />
                  <div className="text-2xl font-extrabold">{result.estimatedWeeksToReady || '—'}</div>
                  <div className="text-xs text-muted-foreground">weeks to ready</div>
                </div>
              </div>
            </section>
          )}

          {/* Have / Missing skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.haveSkills && result.haveSkills.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Skills you have ({result.haveSkills.length})
                </h3>
                <div className="space-y-2">
                  {result.haveSkills.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5',
                        s.relevance === 'high' && 'bg-emerald-500/10 text-emerald-600',
                        s.relevance === 'medium' && 'bg-amber-500/10 text-amber-600',
                        s.relevance === 'low' && 'bg-muted text-muted-foreground'
                      )}>
                        {s.relevance}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{s.skill}</div>
                        <div className="text-xs text-muted-foreground">{s.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.missingSkills && result.missingSkills.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Skills you're missing ({result.missingSkills.length})
                </h3>
                <div className="space-y-2">
                  {result.missingSkills.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5',
                        s.priority === 'critical' && 'bg-rose-500/10 text-rose-600',
                        s.priority === 'important' && 'bg-amber-500/10 text-amber-600',
                        s.priority === 'nice-to-have' && 'bg-muted text-muted-foreground'
                      )}>
                        {s.priority}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold flex items-center justify-between">
                          <span>{s.skill}</span>
                          <span className="text-xs text-muted-foreground font-normal">{s.learnTime}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{s.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Learning Path */}
          {result.learningPath && result.learningPath.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Your personalized learning path
              </h3>
              <div className="space-y-4">
                {result.learningPath.map((phase, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4 pb-3 relative">
                    <div className="absolute -left-2 top-0 w-3 h-3 rounded-full bg-primary" />
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">Phase {i + 1}: {phase.phase}</h4>
                      <span className="text-xs font-semibold text-primary">{phase.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {phase.skills.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{s}</span>
                      ))}
                    </div>
                    {phase.resources && phase.resources.length > 0 && (
                      <div className="space-y-1">
                        {phase.resources.map((r, ri) => (
                          <div key={ri} className="text-xs flex items-start gap-2">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.type}</span>
                            <span className="flex-1">
                              {r.url && r.url.startsWith('http') ? (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{r.name}</a>
                              ) : (
                                <span>{r.name} <span className="text-muted-foreground">({r.url})</span></span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Projects */}
          {result.recommendedProjects && result.recommendedProjects.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-violet-500" />
                Recommended projects to build
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.recommendedProjects.map((p, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                    <h4 className="font-bold text-sm">{p.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.skillsGained.map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Advice */}
          {result.advice && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm mb-1">Personalized career advice</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">{result.advice}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ResultView({ result }: { result: GapResult }) {
  return (
    <div className="space-y-4">
      {result.targetRoleSummary && (
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-1">Role overview</div>
          <p className="text-sm">{result.targetRoleSummary}</p>
        </div>
      )}
      {result.overallReadiness != null && (
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-1">Overall readiness</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                style={{ width: `${result.overallReadiness}%` }}
              />
            </div>
            <span className="font-bold text-2xl tabular-nums">{result.overallReadiness}%</span>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Scroll down for the full breakdown — skills you have, missing skills, learning path, and recommended projects.
      </p>
      {adGateModal}
    </div>
  )
}
