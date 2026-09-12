'use client'

import * as React from 'react'
import { Loader2, Wallet, AlertCircle, TrendingUp, TrendingDown, Sparkles, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProUpsellModal } from '@/components/pro-upsell-modal'

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
  const [showAdGate, setShowAdGate] = React.useState(false)

  async function predict(adToken?: string) {
    if (!role.trim()) {
      setError('Please enter a role.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const url = adToken
        ? `/api/ai/salary-predict?adToken=${encodeURIComponent(adToken)}`
        : '/api/ai/salary-predict'
      const r = await fetch(url, {
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
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.requiresAd && !adToken) { setShowAdGate(true); setLoading(false); return }
        throw new Error(d.error || 'Failed')
      }
      setResult(d.result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdWatched(token: string) { setShowAdGate(false) }
  function handleAdGateClose() { setShowAdGate(false); setLoading(false) }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
          <Wallet className="w-3 h-3" />
          AI TOOL
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Salary Predictor</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Get a realistic salary estimate for your role, experience, and location in India, plus negotiation tips.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="text-xs font-bold mb-1 block">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bengaluru"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block">Company (optional)</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Google, Flipkart…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block">Skills (comma-separated)</label>
            <input
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="Python, React, AWS, Kubernetes"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => predict()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Predicting…' : 'Predict Salary'}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Predicting salary…
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.predictedRange && (
                <div className="text-center py-4">
                  <div className="text-3xl font-extrabold text-primary">
                    ₹{result.predictedRange.min} - ₹{result.predictedRange.max} {result.predictedRange.unit}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Predicted {result.confidence || ''} range</div>
                </div>
              )}
              {result.baseSalary && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-xs text-muted-foreground">Base</div>
                    <div className="font-bold text-sm">₹{result.baseSalary} LPA</div>
                  </div>
                  {result.bonus !== undefined && (
                    <div className="rounded-xl bg-muted p-3">
                      <div className="text-xs text-muted-foreground">Bonus</div>
                      <div className="font-bold text-sm">₹{result.bonus} LPA</div>
                    </div>
                  )}
                  {result.stock !== undefined && (
                    <div className="rounded-xl bg-muted p-3">
                      <div className="text-xs text-muted-foreground">Stock</div>
                      <div className="font-bold text-sm">₹{result.stock} LPA</div>
                    </div>
                  )}
                </div>
              )}
              {result.negotiationTips && result.negotiationTips.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Negotiation Tips
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.negotiationTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.marketOutlook && (
                <div className="rounded-xl bg-muted p-3 text-sm">
                  <strong>Market Outlook:</strong> {result.marketOutlook}
                </div>
              )}
              {result.rawText && (
                <div className="rounded-xl bg-muted p-4 text-sm whitespace-pre-wrap">{result.rawText}</div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Your salary prediction will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <ProUpsellModal
        open={showAdGate}
        toolLabel="Salary Predictor"
        used={1}
        limit={1}
        onClose={handleAdGateClose}
      />
    </div>
  )
}
