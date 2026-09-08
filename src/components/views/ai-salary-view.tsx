'use client'

import * as React from 'react'
import { Loader2, Wallet, AlertCircle, TrendingUp, TrendingDown, Sparkles, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SalaryResult {
  predictedRange?: { min: number; max: number; currency: string; unit: string }
  baseSalary?: number
  bonus?: number
  stock?: number
  confidence?: string
  keyFactors?: Array<{ factor: string; impact: string; note: string }>
  negotiationTips?: string[]
  marketOutlook?: string
  rawText?: string
}

export function AISalaryPredictor() {
  const [role, setRole] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [location, setLocation] = React.useState('Bengaluru')
  const [experience, setExperience] = React.useState('0')
  const [skillsStr, setSkillsStr] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<SalaryResult | null>(null)

  async function predict() {
    if (!role.trim()) {
      setError('Please enter a role.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/ai/salary-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          company: company || undefined,
          location: location || undefined,
          experienceYears: parseFloat(experience) || 0,
          skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setResult(d.result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
          <Wallet className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Salary Predictor</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Predict a realistic salary range for any role in the Indian tech market, with key factors and negotiation tips.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Role *</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer II"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Company (optional)</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, mid-tier startup"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Years of experience: <span className="text-primary">{experience}</span></label>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block">Top skills (comma-separated)</label>
            <input
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. Python, React, AWS, Kubernetes"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={predict}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Predicting…' : 'Predict salary'}
          </button>
        </div>

        <div className="lg:col-span-3">
          {!result && !loading && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your salary prediction will appear here.</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-border p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing market data…</p>
            </div>
          )}

          {result && !result.rawText && (
            <div className="space-y-4">
              {/* Main prediction card */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Predicted Total Compensation
                </div>
                {result.predictedRange && (
                  <div className="text-4xl font-extrabold gradient-text">
                    ₹{result.predictedRange.min} – ₹{result.predictedRange.max}
                    <span className="text-base font-semibold text-muted-foreground ml-2">
                      {result.predictedRange.unit}
                    </span>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Base</div>
                    <div className="font-bold">₹{result.baseSalary ?? '—'}L</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Bonus</div>
                    <div className="font-bold">₹{result.bonus ?? '—'}L</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Stock/yr</div>
                    <div className="font-bold">₹{result.stock ?? '—'}L</div>
                  </div>
                </div>
                {result.confidence && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-background/60 backdrop-blur">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      result.confidence === 'high' && 'bg-emerald-500',
                      result.confidence === 'medium' && 'bg-amber-500',
                      result.confidence === 'low' && 'bg-rose-500',
                    )} />
                    <span className="font-medium capitalize">{result.confidence} confidence</span>
                  </div>
                )}
              </div>

              {/* Key factors */}
              {result.keyFactors && result.keyFactors.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-bold text-sm mb-3">Key factors influencing this prediction</h3>
                  <div className="space-y-2">
                    {result.keyFactors.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        {f.impact === 'positive' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-semibold">{f.factor}</div>
                          <div className="text-xs text-muted-foreground">{f.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negotiation tips */}
              {result.negotiationTips && result.negotiationTips.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm">Negotiation tips</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {result.negotiationTips.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber-600 font-bold">{i + 1}.</span>
                        <span className="text-foreground/90">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Market outlook */}
              {result.marketOutlook && (
                <div className="rounded-2xl border border-border bg-muted/40 p-5">
                  <h3 className="font-bold text-sm mb-2">Market outlook</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">{result.marketOutlook}</p>
                </div>
              )}
            </div>
          )}

          {result?.rawText && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm whitespace-pre-wrap">{result.rawText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
