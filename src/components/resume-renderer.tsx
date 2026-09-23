'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { getTemplate, type ResumeTemplate } from '@/lib/resume-templates'

interface ResumeRendererProps {
  /** Markdown content from the AI */
  content: string
  /** Template slug — controls the visual style */
  templateSlug: string | null
  /** Optional className for outer wrapper */
  className?: string
}

/**
 * ResumeRenderer — renders AI-generated Markdown resume content
 * with template-specific styling.
 *
 * How it works:
 *   1. Parses the Markdown content (simple parser, no library needed)
 *   2. Applies template-specific CSS based on the template's layout + accent color + font
 *   3. Two-column templates get a sidebar layout
 *   4. ATS-plain templates get minimal styling (max readability)
 *
 * The renderer handles:
 *   - # H1 (name) → large heading at top
 *   - ## H2 (section headings) → with accent color underline
 *   - ### H3 (subsections) → smaller heading
 *   - - bullet points
 *   - **bold** text
 *   - *italic* text
 *   - Paragraphs
 *   - Horizontal rules (---)
 *
 * For two-column templates, the renderer looks for a "## Skills" or
 * "## Core Skills" section and moves it to the sidebar.
 */
export function ResumeRenderer({ content, templateSlug, className }: ResumeRendererProps) {
  const template = templateSlug ? getTemplate(templateSlug) : null

  // Parse the Markdown into structured blocks
  const blocks = React.useMemo(() => parseMarkdown(content), [content])

  // For two-column layouts, extract sidebar content (Skills, Tools, Certifications)
  const { mainBlocks, sidebarBlocks } = React.useMemo(() => {
    if (!template || (template.layout !== 'two-column' && template.layout !== 'compact')) {
      return { mainBlocks: blocks, sidebarBlocks: [] }
    }
    return splitSidebar(blocks)
  }, [blocks, template])

  if (!content?.trim()) {
    return null
  }

  // No template selected → use default styling (current behavior)
  if (!template) {
    return (
      <div className={cn('text-sm leading-relaxed', className)}>
        <DefaultMarkdownView blocks={blocks} />
      </div>
    )
  }

  // ATS-plain template → minimal styling
  if (template.layout === 'ats-plain') {
    return (
      <div
        className={cn('text-sm leading-relaxed', className)}
        style={{ fontFamily: template.fontFamily, color: '#000' }}
      >
        <DefaultMarkdownView blocks={blocks} accentColor={template.accentColor} />
      </div>
    )
  }

  // Two-column templates → sidebar layout
  if (template.layout === 'two-column' && sidebarBlocks.length > 0) {
    return (
      <div
        className={cn('resume-template two-column', className)}
        style={{
          fontFamily: template.fontFamily,
          '--resume-accent': template.accentColor,
        } as React.CSSProperties}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
          {/* Main column */}
          <div className="main-column">
            <DefaultMarkdownView blocks={mainBlocks} accentColor={template.accentColor} />
          </div>

          {/* Sidebar */}
          <aside className="sidebar-column bg-muted/30 rounded-lg p-4">
            <SidebarMarkdownView blocks={sidebarBlocks} accentColor={template.accentColor} />
          </aside>
        </div>
      </div>
    )
  }

  // Single-column / compact templates
  return (
    <div
      className={cn('resume-template', template.layout, className)}
      style={{
        fontFamily: template.fontFamily,
        '--resume-accent': template.accentColor,
      } as React.CSSProperties}
    >
      <DefaultMarkdownView blocks={blocks} accentColor={template.accentColor} />
    </div>
  )
}

// ============================================================================
// MARKDOWN PARSER — simple, no library needed
// ============================================================================

interface MarkdownBlock {
  type: 'h1' | 'h2' | 'h3' | 'bullet' | 'paragraph' | 'hr' | 'empty'
  text: string
  /** For bullets, the indentation level (0 = top-level, 1 = nested) */
  indent?: number
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.split('\n')
  const blocks: MarkdownBlock[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      blocks.push({ type: 'empty', text: '' })
      continue
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr', text: '' })
      continue
    }

    // H1
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() })
      continue
    }

    // H2
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() })
      continue
    }

    // H3
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() })
      continue
    }

    // Bullet point
    const bulletMatch = trimmed.match(/^(\s*)([-*•])\s+(.*)$/)
    if (bulletMatch) {
      const indent = Math.floor((line.length - line.trimStart().length) / 2)
      blocks.push({ type: 'bullet', text: bulletMatch[3], indent })
      continue
    }

    // Numbered list (treat as bullet)
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (numberedMatch) {
      blocks.push({ type: 'bullet', text: numberedMatch[1], indent: 0 })
      continue
    }

    // Paragraph
    blocks.push({ type: 'paragraph', text: trimmed })
  }

  return blocks
}

// ============================================================================
// SIDEBAR SPLITTING — for two-column templates
// ============================================================================

function splitSidebar(blocks: MarkdownBlock[]): {
  mainBlocks: MarkdownBlock[]
  sidebarBlocks: MarkdownBlock[]
} {
  const SIDEBAR_SECTIONS = ['skills', 'core skills', 'tools', 'certifications', 'languages', 'core competencies']
  const mainBlocks: MarkdownBlock[] = []
  const sidebarBlocks: MarkdownBlock[] = []

  let inSidebarSection = false
  let currentSectionBlocks: MarkdownBlock[] = []

  for (const block of blocks) {
    if (block.type === 'h2') {
      // If we were collecting a sidebar section, flush it
      if (inSidebarSection && currentSectionBlocks.length > 0) {
        sidebarBlocks.push(...currentSectionBlocks)
        currentSectionBlocks = []
      }

      const headingLower = block.text.toLowerCase()
      if (SIDEBAR_SECTIONS.some((s) => headingLower.includes(s))) {
        inSidebarSection = true
        currentSectionBlocks.push(block)
        continue
      } else {
        inSidebarSection = false
        mainBlocks.push(block)
        continue
      }
    }

    if (inSidebarSection) {
      currentSectionBlocks.push(block)
    } else {
      mainBlocks.push(block)
    }
  }

  // Flush any remaining sidebar blocks
  if (currentSectionBlocks.length > 0) {
    sidebarBlocks.push(...currentSectionBlocks)
  }

  return { mainBlocks, sidebarBlocks }
}

// ============================================================================
// RENDERERS
// ============================================================================

/**
 * Default markdown renderer — renders blocks in order, no sidebar.
 */
function DefaultMarkdownView({ blocks, accentColor = '#6366f1' }: { blocks: MarkdownBlock[]; accentColor?: string }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={i} className="text-2xl font-extrabold mt-4 mb-2 first:mt-0" style={{ color: '#000' }}>
                {renderInline(block.text)}
              </h1>
            )
          case 'h2':
            return (
              <h2
                key={i}
                className="text-base font-bold mt-5 mb-2 pb-1 border-b-2"
                style={{ borderColor: accentColor, color: '#000' }}
              >
                {renderInline(block.text)}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} className="text-sm font-bold mt-3 mb-1 text-foreground">
                {renderInline(block.text)}
              </h3>
            )
          case 'bullet':
            return (
              <div key={i} className="flex gap-2 mb-1" style={{ paddingLeft: `${(block.indent || 0) * 16}px` }}>
                <span style={{ color: accentColor }}>•</span>
                <span className="flex-1 text-foreground">{renderInline(block.text)}</span>
              </div>
            )
          case 'paragraph':
            return (
              <p key={i} className="mb-2 text-foreground leading-relaxed">
                {renderInline(block.text)}
              </p>
            )
          case 'hr':
            return <hr key={i} className="my-3 border-border" />
          case 'empty':
            return <div key={i} className="h-2" />
          default:
            return null
        }
      })}
    </>
  )
}

/**
 * Sidebar renderer — for skills/tools/certifications in two-column templates.
 * Renders sections in a more compact format.
 */
function SidebarMarkdownView({ blocks, accentColor = '#10b981' }: { blocks: MarkdownBlock[]; accentColor?: string }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h3
                key={i}
                className="text-xs font-bold uppercase tracking-wide mt-3 mb-2 first:mt-0 pb-1 border-b"
                style={{ borderColor: accentColor, color: '#000' }}
              >
                {renderInline(block.text)}
              </h3>
            )
          case 'h3':
            return (
              <h4 key={i} className="text-xs font-semibold mt-2 mb-1 text-foreground">
                {renderInline(block.text)}
              </h4>
            )
          case 'bullet':
            return (
              <div key={i} className="text-xs mb-1 text-foreground">
                {renderInline(block.text)}
              </div>
            )
          case 'paragraph':
            return (
              <p key={i} className="text-xs mb-2 text-foreground leading-relaxed">
                {renderInline(block.text)}
              </p>
            )
          case 'empty':
            return <div key={i} className="h-1" />
          default:
            return null
        }
      })}
    </>
  )
}

/**
 * Render inline markdown: **bold**, *italic*, [links](url)
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    if (boldMatch) {
      const idx = remaining.indexOf(boldMatch[0])
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
      }
      parts.push(<strong key={key++} className="font-bold text-foreground">{boldMatch[1]}</strong>)
      remaining = remaining.slice(idx + boldMatch[0].length)
      continue
    }

    // Italic: *text*
    const italicMatch = remaining.match(/\*([^*]+)\*/)
    if (italicMatch) {
      const idx = remaining.indexOf(italicMatch[0])
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
      }
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>)
      remaining = remaining.slice(idx + italicMatch[0].length)
      continue
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      const idx = remaining.indexOf(linkMatch[0])
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
      }
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(idx + linkMatch[0].length)
      continue
    }

    // No more matches — push rest as plain text
    parts.push(<span key={key++}>{remaining}</span>)
    break
  }

  return <>{parts}</>
}
