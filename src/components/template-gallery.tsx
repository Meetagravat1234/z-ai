'use client'

import * as React from 'react'
import { Check, Crown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RESUME_TEMPLATES, type ResumeTemplate } from '@/lib/resume-templates'

interface TemplateGalleryProps {
  selected: string | null
  onSelect: (slug: string) => void
  isPro: boolean
  onLockedClick?: (template: ResumeTemplate) => void
}

/**
 * TemplateGallery — grid of 10 resume templates with FULL demo resume previews.
 *
 * Each card shows a complete sample resume rendered in the template's style:
 *   - Actual name, contact, sections, bullets (from demoContent)
 *   - Template-specific accent color, font, layout
 *   - Two-column templates show the sidebar layout
 *
 * This lets users SEE exactly how their resume will look before picking.
 */
export function TemplateGallery({ selected, onSelect, isPro, onLockedClick }: TemplateGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">Choose your resume template</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Each template has different sections — pick the one that fits your role.
          All templates fit on 1 page.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
        {RESUME_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.slug}
            template={template}
            isSelected={selected === template.slug}
            isLocked={!isPro && !template.isFree}
            onSelect={() => {
              if (!isPro && !template.isFree) {
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
  const isFree = template.isFree === true
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative rounded-2xl overflow-hidden border-2 transition-all text-left group bg-white',
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-xl scale-[1.01]'
          : 'border-border hover:border-primary/40 hover:shadow-lg',
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Badge — Free or Pro */}
      <div className="absolute top-2 left-2 z-10">
        {isFree ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
            <Check className="w-2.5 h-2.5" />
            Free
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
            <Crown className="w-2.5 h-2.5" />
            Pro
          </span>
        )}
      </div>

      {/* Lock overlay for non-Pro users on Pro-only templates */}
      {isLocked && !isFree && (
        <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
          <div className="text-center text-white">
            <Lock className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs font-semibold">Upgrade to use</span>
          </div>
        </div>
      )}

      {/* Header strip with gradient */}
      <div
        className="h-2"
        style={{ background: template.previewGradient }}
      />

      {/* FULL demo resume preview */}
      <div className="p-4 bg-white" style={{ fontFamily: template.fontFamily }}>
        <FullDemoResume template={template} />
      </div>

      {/* Template info */}
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base">{template.emoji}</span>
          <div className="text-sm font-bold leading-tight">{template.name}</div>
        </div>
        <div className="text-[11px] text-muted-foreground leading-snug">
          {template.description}
        </div>
      </div>
    </button>
  )
}

/**
 * FullDemoResume — renders a complete sample resume in the template's style.
 * Uses the demoContent from each section to show what the resume will look like.
 */
function FullDemoResume({ template }: { template: ResumeTemplate }) {
  const accent = template.accentColor
  const isTwoColumn = template.layout === 'two-column'
  const isAts = template.layout === 'ats-plain'

  // Split sections: header + main sections + sidebar sections
  const headerSection = template.sections.find((s) => s.id === 'header')
  const allSections = template.sections.filter((s) => s.id !== 'header')

  // For two-column templates, identify sidebar sections
  const SIDEBAR_IDS = ['skills', 'tech-stack', 'core-competencies', 'technical-skills', 'tools', 'certifications', 'languages']
  const sidebarSections = isTwoColumn ? allSections.filter((s) => SIDEBAR_IDS.includes(s.id)) : []
  const mainSections = isTwoColumn ? allSections.filter((s) => !SIDEBAR_IDS.includes(s.id)) : allSections

  // Parse header content (name + contact)
  const headerLines = (headerSection?.demoContent || '').split('\n').filter(Boolean)
  const name = headerLines[0] || 'Your Name'
  const titleOrContact = headerLines.slice(1).join(' · ')

  const headingStyle: React.CSSProperties = {
    fontSize: '7px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginTop: '5px',
    marginBottom: '2px',
    textTransform: isAts ? 'none' : 'uppercase',
    letterSpacing: isAts ? '0' : '0.4px',
    borderBottom: isAts ? 'none' : `0.5px solid ${accent}`,
    paddingBottom: '1px',
  }

  const renderSection = (section: typeof allSections[0]) => {
    const lines = section.demoContent.split('\n')
    return (
      <div key={section.id}>
        {section.heading && <div style={headingStyle}>{section.heading}</div>}
        {lines.map((line, i) => {
          if (line.startsWith('•') || line.startsWith('-')) {
            return (
              <div key={i} style={{ fontSize: '6px', lineHeight: '1.4', color: '#475569', marginBottom: '1px', paddingLeft: '6px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: accent }}>•</span>
                <span>{line.replace(/^[•-]\s*/, '')}</span>
              </div>
            )
          }
          // Numbered list (for academic)
          if (/^\[\d+\]/.test(line)) {
            return (
              <div key={i} style={{ fontSize: '6px', lineHeight: '1.4', color: '#475569', marginBottom: '1px', paddingLeft: '8px' }}>
                {line}
              </div>
            )
          }
          return (
            <div key={i} style={{ fontSize: '6px', lineHeight: '1.4', color: '#475569', marginBottom: '1px' }}>
              {line}
            </div>
          )
        })}
      </div>
    )
  }

  if (isTwoColumn && sidebarSections.length > 0) {
    return (
      <div>
        {/* Name + contact */}
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', borderBottom: `1.5px solid ${accent}`, paddingBottom: '2px', marginBottom: '3px' }}>
          {name}
        </div>
        {titleOrContact && (
          <div style={{ fontSize: '5.5px', color: '#64748b', marginBottom: '4px' }}>{titleOrContact}</div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '6px' }}>
          {/* Main column */}
          <div>
            {mainSections.map(renderSection)}
          </div>
          {/* Sidebar */}
          <div style={{ borderLeft: `1px solid ${accent}`, paddingLeft: '5px', background: '#f8fafc' }}>
            {sidebarSections.map(renderSection)}
          </div>
        </div>
      </div>
    )
  }

  // Single-column / compact / ATS
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', borderBottom: `1.5px solid ${accent}`, paddingBottom: '2px', marginBottom: '3px' }}>
        {name}
      </div>
      {titleOrContact && (
        <div style={{ fontSize: '5.5px', color: '#64748b', marginBottom: '4px' }}>{titleOrContact}</div>
      )}
      {allSections.map(renderSection)}
    </div>
  )
}
