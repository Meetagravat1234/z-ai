'use client'

import * as React from 'react'
import { Check, Crown, Lock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RESUME_TEMPLATES, type ResumeTemplate } from '@/lib/resume-templates'

interface TemplateGalleryProps {
  /** Currently selected template slug */
  selected: string | null
  /** Called when user selects a template */
  onSelect: (slug: string) => void
  /** Whether the user is Pro (controls lock state) */
  isPro: boolean
  /** Called when a non-Pro user tries to select a template */
  onLockedClick?: (template: ResumeTemplate) => void
}

/**
 * TemplateGallery — beautiful grid of 10 resume templates with LIVE previews.
 *
 * Each card shows a mini visual mockup of how the resume will look:
 *   - Name heading in the template's accent color
 *   - Section headings styled like the template
 *   - Bullet points / lines styled appropriately
 *   - Two-column templates show the sidebar layout
 *
 * This replaces the old emoji+gradient cards with actual visual previews
 * so users can SEE what their resume will look like before picking.
 */
export function TemplateGallery({ selected, onSelect, isPro, onLockedClick }: TemplateGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">Choose your resume template</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a template — your AI-optimized resume will be formatted in this style.
          All templates fit on 1 page.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {RESUME_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.slug}
            template={template}
            isSelected={selected === template.slug}
            isLocked={!isPro}
            onSelect={() => {
              if (!isPro) {
                onLockedClick?.(template)
              } else {
                onSelect(template.slug)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: ResumeTemplate
  isSelected: boolean
  isLocked: boolean
  onSelect: () => void
}

function TemplateCard({ template, isSelected, isLocked, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative rounded-2xl overflow-hidden border-2 transition-all text-left group bg-white',
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-lg scale-[1.02]'
          : 'border-border hover:border-primary/40 hover:shadow-md',
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Pro badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wide">
          <Crown className="w-2.5 h-2.5" />
          Pro
        </span>
      </div>

      {/* Lock overlay for non-Pro users */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
          <div className="text-center text-white">
            <Lock className="w-5 h-5 mx-auto mb-1" />
            <span className="text-[10px] font-semibold">Upgrade to use</span>
          </div>
        </div>
      )}

      {/* Live preview — actual mini resume mockup */}
      <div className="aspect-[3/4] p-3 overflow-hidden" style={{ background: '#ffffff' }}>
        <MiniResumePreview template={template} />
      </div>

      {/* Template info */}
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{template.emoji}</span>
          <div className="text-sm font-bold leading-tight">{template.name}</div>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
          {template.description}
        </div>
      </div>
    </button>
  )
}

/**
 * MiniResumePreview — renders a tiny mockup of what a resume looks like
 * in this template's style. Shows:
 *   - Name as a colored bar (accent color)
 *   - Contact line
 *   - Section headings with the template's heading style
 *   - Bullet lines
 *   - Two-column templates show a sidebar
 */
function MiniResumePreview({ template }: { template: ResumeTemplate }) {
  const accent = template.accentColor
  const isTwoColumn = template.layout === 'two-column'
  const isSerif = template.category === 'executive' || template.category === 'academic'
  const isCompact = template.layout === 'compact'
  const isAts = template.layout === 'ats-plain'

  const fontFamily = isSerif
    ? "'Georgia', serif"
    : template.fontFamily

  // Common styles
  const nameStyle: React.CSSProperties = {
    fontSize: isCompact ? '11px' : '13px',
    fontWeight: 800,
    color: '#0f172a',
    borderBottom: `1.5px solid ${accent}`,
    paddingBottom: '2px',
    marginBottom: '4px',
    fontFamily,
  }

  const headingStyle: React.CSSProperties = {
    fontSize: '8px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginTop: '6px',
    marginBottom: '2px',
    textTransform: isAts ? 'none' : 'uppercase',
    letterSpacing: isAts ? '0' : '0.4px',
    borderBottom: isAts ? 'none' : `0.5px solid ${accent}`,
    paddingBottom: '1px',
    fontFamily,
  }

  const lineStyle: React.CSSProperties = {
    fontSize: isCompact ? '6px' : '7px',
    lineHeight: '1.4',
    color: '#475569',
    marginBottom: '2px',
    fontFamily,
  }

  // Sidebar content for two-column templates
  const Sidebar = () => (
    <div
      style={{
        borderLeft: `1.5px solid ${accent}`,
        paddingLeft: '6px',
        background: '#f8fafc',
        borderRadius: '2px',
      }}
    >
      <div style={headingStyle}>Skills</div>
      <div style={lineStyle}>Python, React</div>
      <div style={lineStyle}>AWS, Docker</div>
      <div style={headingStyle}>Tools</div>
      <div style={lineStyle}>Git, Jenkins</div>
    </div>
  )

  if (isTwoColumn) {
    return (
      <div style={{ fontFamily, height: '100%' }}>
        <div style={nameStyle}>John Doe</div>
        <div style={{ ...lineStyle, marginBottom: '4px' }}>john@example.com · Bengaluru</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: '6px' }}>
          <div>
            <div style={headingStyle}>Summary</div>
            <div style={lineStyle}>Software Engineer with 5+ years experience.</div>
            <div style={headingStyle}>Experience</div>
            <div style={lineStyle}>• Senior Eng at Google (2022-Present)</div>
            <div style={lineStyle}>• Eng at Microsoft (2020-2022)</div>
            <div style={headingStyle}>Education</div>
            <div style={lineStyle}>B.Tech CS, IIT Delhi</div>
          </div>
          <Sidebar />
        </div>
      </div>
    )
  }

  // Single-column / compact / ATS-plain
  return (
    <div style={{ fontFamily, height: '100%' }}>
      <div style={nameStyle}>John Doe</div>
      <div style={{ ...lineStyle, marginBottom: '4px' }}>john@example.com · Bengaluru</div>
      <div style={headingStyle}>Professional Summary</div>
      <div style={lineStyle}>Results-driven Software Engineer with 5+ years experience.</div>
      <div style={headingStyle}>Core Skills</div>
      <div style={lineStyle}>Python, JavaScript, React, Node.js, AWS, Docker</div>
      <div style={headingStyle}>Professional Experience</div>
      <div style={lineStyle}>• Senior Engineer at Google (2022-Present)</div>
      <div style={lineStyle}>• Engineer at Microsoft (2020-2022)</div>
      <div style={headingStyle}>Education</div>
      <div style={lineStyle}>B.Tech in Computer Science, IIT Delhi (2019)</div>
    </div>
  )
}
