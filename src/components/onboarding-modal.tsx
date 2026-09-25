'use client'

import * as React from 'react'
import { Loader2, Sparkles, Upload, ArrowRight, ArrowLeft, Check, Briefcase, Target, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { ResumeUpload } from '@/components/resume-upload'
import { useResumeStore } from '@/lib/resume-store'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const ROLE_OPTIONS = [
  { id: 'software-engineer', label: 'Software Engineer', emoji: '💻' },
  { id: 'data-scientist', label: 'Data Scientist', emoji: '📊' },
  { id: 'product-manager', label: 'Product Manager', emoji: '🎯' },
  { id: 'designer', label: 'Designer', emoji: '🎨' },
  { id: 'devops', label: 'DevOps Engineer', emoji: '⚙️' },
  { id: 'fresher', label: 'Fresher / Entry-level', emoji: '🎓' },
  { id: 'other', label: 'Other', emoji: '💼' },
]

/**
 * OnboardingModal — 3-step welcome flow shown after signup.
 *
 * Step 1: "What role are you targeting?" (single click)
 * Step 2: "Upload your resume" (optional — can skip)
 * Step 3: "Try your first AI tool" (big CTA buttons)
 *
 * Completes onboarding by calling PATCH /api/profile with the selected role
 * and onboardingCompletedAt = now.
 */
export function OnboardingModal({ open, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [selectedRole, setSelectedRole] = React.useState<string>('')
  const [resumeText, setResumeText] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // Use shared resume store — uploads here will be available in all AI tools
  const { setResumeText: setSharedResume } = useResumeStore()

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1)
        setSelectedRole('')
        setResumeText('')
      }, 300)
    }
  }, [open])

  if (!open) return null

  async function completeOnboarding() {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: selectedRole,
          onboardingCompleted: true,
        }),
      })
      toast.success('Welcome to Hirebase! 🎉')
      onComplete()
    } catch (e: any) {
      toast.error('Could not save — please try again')
    } finally {
      setSaving(false)
    }
  }

  function skipResume() {
    setStep(3)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-violet-500/10 p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
            <Sparkles className="w-3 h-3" />
            WELCOME TO HIREBASE
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Let's get you job-ready 🚀</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quick 30-second setup to unlock your free AI tools.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 py-3 border-b border-border">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-bold text-lg">What role are you targeting?</h3>
                <p className="text-xs text-muted-foreground">We'll tailor your job matches + AI tools</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.label)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2',
                      selectedRole === role.label
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <span className="text-lg">{role.emoji}</span>
                    <span className="text-sm font-medium">{role.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedRole}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90"
              >
                Continue
                <ArrowRight className="w-4 h-4 inline ml-2" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-bold text-lg">Upload your resume</h3>
                <p className="text-xs text-muted-foreground">
                  Optional — but recommended for better AI results
                </p>
              </div>
              <ResumeUpload onTextExtracted={(text) => {
                setResumeText(text)
                setSharedResume(text)  // Save to shared store so AI tools have it
              }} />
              {resumeText && (
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
                  ✓ Resume ready — your AI tools will use it automatically
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                >
                  {resumeText ? 'Continue' : 'Skip for now'}
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <Rocket className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-bold text-lg">You're all set! 🎉</h3>
                <p className="text-xs text-muted-foreground">
                  Try your first AI tool — you get 1 free use per month.
                </p>
              </div>
              <div className="space-y-2">
                <a
                  href="/ai-tools/resume-optimizer"
                  onClick={completeOnboarding}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">AI Resume Optimizer</div>
                    <div className="text-xs text-muted-foreground">Tailor your resume to any job</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </a>
                <a
                  href="/ai-tools/ats-score"
                  onClick={completeOnboarding}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <Briefcase className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">ATS Score Checker</div>
                    <div className="text-xs text-muted-foreground">Check if your resume passes ATS</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="w-full px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Skip for now — explore on my own
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
