'use client'

import * as React from 'react'
import { Check, Crown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RESUME_TEMPLATES, type ResumeTemplate } from '@/lib/resume-templates'

interface ResumeTemplatePickerProps {
  /** Currently selected template slug (null = none selected) */
  selected: string | null
  /** Called when user selects a template */
  onSelect: (slug: string) => void
  /** Whether the user is Pro (controls lock state on cards) */
  isPro: boolean
  /** Called when a non-Pro user tries to select a template */
  onLockedClick?: (template: ResumeTemplate) => void
}

/**
 * ResumeTemplatePicker — grid of 10 resume template cards.
 *
 * Each card shows:
 *   - Gradient preview (template's signature colors)
 *   - Emoji icon
 *   - Template name
 *   - 1-line description
 *   - "Pro" badge (gold crown) on all cards
 *   - Lock overlay if user is not Pro
 *
 * When user clicks a card:
 *   - If Pro: selects the template (onSelect called)
 *   - If not Pro: calls onLockedClick (usually opens upgrade modal)
 *
 * The first card is always the default "Modern Minimalist" — selected
 * automatically when the component mounts.
 */
export function ResumeTemplatePicker({
  selected,
  onSelect,
  isPro,
  onLockedClick,
}: ResumeTemplatePickerProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            Choose your resume template
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wide">
              <Crown className="w-3 h-3" />
              Pro
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a template — your AI-optimized resume will be formatted in this style.
          </p>
        </div>
        {selected && (
          <button
            onClick={() => onSelect(selected)}
            className="text-xs text-primary hover:underline"
          >
            Selected: {RESUME_TEMPLATES.find((t) => t.slug === selected)?.name}
          </button>
        )}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {RESUME_TEMPLATES.map((template) => {
          const isSelected = selected === template.slug
          const isLocked = !isPro

          return (
            <button
              key={template.slug}
              onClick={() => {
                if (isLocked) {
                  onLockedClick?.(template)
                } else {
                  onSelect(template.slug)
                }
              }}
              className={cn(
                'relative rounded-xl overflow-hidden border-2 transition-all text-left group',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30 shadow-md'
                  : 'border-border hover:border-primary/40 hover:shadow-sm',
                isLocked && 'cursor-pointer',
              )}
            >
              {/* Gradient preview header */}
              <div
                className="h-16 flex items-center justify-center relative"
                style={{ background: template.previewGradient }}
              >
                <span className="text-2xl drop-shadow-md">{template.emoji}</span>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Lock overlay for non-Pro users */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Template info */}
              <div className="p-2.5">
                <div className="text-xs font-bold leading-tight">{template.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {template.description}
                </div>
              </div>

              {/* Category badge */}
              <div className="absolute top-1 left-1">
                <span className="inline-block px-1.5 py-0.5 rounded-md bg-black/30 backdrop-blur-sm text-white text-[9px] font-medium uppercase tracking-wide">
                  {template.category}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Hint for non-Pro users */}
      {!isPro && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          🔒 Templates are a Pro feature. <span className="text-primary font-medium">Upgrade to Pro</span> to unlock all 10 templates.
        </p>
      )}

      {/* Hint for Pro users */}
      {isPro && !selected && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          👆 Select a template to start optimizing your resume
        </p>
      )}
    </div>
  )
}
