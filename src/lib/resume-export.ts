/**
 * Resume / cover-letter export utilities.
 *
 * PDF: Uses browser's native print engine (window.print) via a hidden iframe.
 *      This produces REAL text-based PDFs (not images) — ATS-friendly + good looking.
 *      The user clicks "Download PDF" → print dialog opens → they save as PDF.
 *      When a template slug is provided, applies template-specific CSS
 *      (accent color, font family, two-column layout for sidebar templates).
 *
 * DOCX: Uses the docx npm package to generate a real .docx file client-side.
 *       Opens in MS Word / Google Docs / LibreOffice. Editable.
 *       Note: DOCX format has limited styling support — accent color is applied
 *       to headings, but two-column layouts aren't supported in Word.
 */

import { getTemplate, type ResumeTemplate } from '@/lib/resume-templates'

// ============================================================
// Markdown → PDF (via browser print engine)
// ============================================================
export async function generatePdfFromMarkdown(
  markdown: string,
  fileName: string,
  templateSlug?: string | null,
): Promise<void> {
  // Convert markdown to clean HTML
  const html = markdownToHtml(markdown)

  // Get template-specific CSS (or default if no template)
  const template = templateSlug ? getTemplate(templateSlug) ?? null : null
  const css = buildPrintCss(template)

  // For two-column templates, wrap the HTML with sidebar layout
  const finalHtml = template?.layout === 'two-column'
    ? wrapTwoColumnLayout(html)
    : html

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  // Write the resume HTML + print CSS into the iframe
  const printDoc = iframe.contentWindow?.document
  if (!printDoc) {
    document.body.removeChild(iframe)
    throw new Error('Could not create print window')
  }

  printDoc.open()
  printDoc.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${fileName.replace(/\.(pdf|docx)$/, '')}</title>
<style>
${css}
</style>
</head>
<body>
${finalHtml}
</body>
</html>
  `)
  printDoc.close()

  // Wait for the iframe to render, then trigger print
  await new Promise(resolve => setTimeout(resolve, 500))

  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()

  // Remove the iframe after print dialog closes
  setTimeout(() => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  }, 1000)
}

// ============================================================
// Template-specific CSS builder
// ============================================================

/**
 * Build print CSS for a specific resume template.
 * Each template has its own accent color, font family, and layout style.
 * When no template is provided, uses the default green accent (#10b981).
 */
function buildPrintCss(template: ResumeTemplate | null): string {
  const accent = template?.accentColor || '#10b981'
  const fontFamily = template?.fontFamily || "'Calibri', 'Helvetica Neue', Arial, sans-serif"

  // Templates use readable sizes that fill 1 page naturally.
  // User requested: "resume is created in 2 pages and i want that is created in 1 page"
  // but also: "not making full page resume" (too short).
  // Solution: use 10pt font + normal margins + 5-6 bullets per job = fills exactly 1 page.
  const baseFontSize = '10pt'
  const baseMargin = '0.5in 0.6in'
  const baseLineHeight = '1.4'

  // Base CSS — shared across all templates
  let css = `
  @page {
    size: A4;
    margin: ${baseMargin};
  }
  * { box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    font-size: ${baseFontSize};
    line-height: ${baseLineHeight};
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin: 0;
    padding: 0;
  }`

  // H1 (name) — uses accent color
  css += `
  h1 {
    font-size: 18pt;
    font-weight: 700;
    margin: 0 0 4pt 0;
    color: #0f1729;
    border-bottom: 2pt solid ${accent};
    padding-bottom: 4pt;
    letter-spacing: -0.3pt;
  }`

  // H2 (section headings) — template-specific style
  if (template?.layout === 'ats-plain') {
    css += `
    h2 {
      font-size: 11pt;
      font-weight: 700;
      margin: 10pt 0 3pt 0;
      color: #1a1a1a;
    }`
  } else if (template?.category === 'executive' || template?.category === 'academic') {
    css += `
    h2 {
      font-size: 11pt;
      font-weight: 700;
      margin: 10pt 0 3pt 0;
      color: #1a1a1a;
      border-bottom: 0.5pt solid ${accent};
      padding-bottom: 2pt;
    }`
  } else {
    css += `
    h2 {
      font-size: 11pt;
      font-weight: 700;
      margin: 10pt 0 3pt 0;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      border-bottom: 0.5pt solid ${accent};
      padding-bottom: 2pt;
    }`
  }

  css += `
  h3 {
    font-size: 10pt;
    font-weight: 700;
    margin: 6pt 0 2pt 0;
    color: ${accent};
  }
  p { margin: 0 0 4pt 0; line-height: 1.4; }
  ul, ol { margin: 0 0 4pt 0; padding-left: 16pt; }
  li { margin-bottom: 2pt; line-height: 1.35; }
  li::marker { color: ${accent}; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  hr { border: none; border-top: 0.5pt solid #d1d5db; margin: 8pt 0; }
  a { color: ${accent}; text-decoration: underline; }
  h1, h2, h3, li { page-break-inside: avoid; }
  body > h1:first-child { margin-top: 0; }`

  // Two-column layout CSS
  if (template?.layout === 'two-column') {
    css += `
  .resume-container {
    display: grid;
    grid-template-columns: 1fr 180pt;
    gap: 14pt;
  }
  .resume-main { grid-column: 1; }
  .resume-sidebar {
    grid-column: 2;
    background: #f8fafc;
    padding: 8pt 10pt;
    border-left: 2pt solid ${accent};
  }
  .resume-sidebar h2 {
    font-size: 10pt;
    margin: 8pt 0 3pt 0;
    border-bottom: 0.5pt solid ${accent};
    text-transform: uppercase;
  }
  .resume-sidebar h2:first-child { margin-top: 0; }
  .resume-sidebar p, .resume-sidebar li {
    font-size: 9pt;
    line-height: 1.3;
  }`
  }

  return css
}

/**
 * Wrap HTML content in a two-column layout for sidebar templates.
 * Extracts Skills, Tools, Certifications sections and moves them to the sidebar.
 */
function wrapTwoColumnLayout(html: string): string {
  const sidebarHeadings = ['skills', 'core skills', 'tools', 'certifications', 'languages', 'core competencies']
  const sections: { content: string; isSidebar: boolean }[] = []

  const parts = html.split(/(?=<h2[^>]*>)/i)
  let preContent = ''
  if (parts.length > 0 && !parts[0].match(/<h2/i)) {
    preContent = parts[0]
    parts.shift()
  }

  for (const part of parts) {
    const headingMatch = part.match(/<h2[^>]*>(.*?)<\/h2>/i)
    const heading = headingMatch ? headingMatch[1].toLowerCase().trim() : ''
    const isSidebar = sidebarHeadings.some((s) => heading.includes(s))
    sections.push({ content: part, isSidebar })
  }

  const mainParts = sections.filter((s) => !s.isSidebar).map((s) => s.content).join('')
  const sidebarParts = sections.filter((s) => s.isSidebar).map((s) => s.content).join('')

  if (!sidebarParts) return html

  return `
    ${preContent}
    <div class="resume-container">
      <div class="resume-main">${mainParts}</div>
      <div class="resume-sidebar">${sidebarParts}</div>
    </div>
  `
}

// ============================================================
// Markdown → DOCX (using docx package)
// ============================================================
export async function generateDocxFromMarkdown(markdown: string, fileName: string): Promise<void> {
  const docx = await import('docx')
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
  } = docx

  const paragraphs: any[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      paragraphs.push(new Paragraph({ children: [] }))
      continue
    }

    if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: stripMarkdown(trimmed.slice(4)), bold: true, size: 23 })],
          spacing: { before: 200, after: 80 },
        }),
      )
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: stripMarkdown(trimmed.slice(3)), bold: true, size: 26 })],
          spacing: { before: 240, after: 80 },
          border: {
            bottom: { color: 'D1D5DB', space: 1, style: 'single', size: 6 },
          },
        }),
      )
    } else if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: stripMarkdown(trimmed.slice(2)), bold: true, size: 32, color: '0F1A1F' })],
          spacing: { before: 0, after: 120 },
          border: {
            bottom: { color: '10B981', space: 1, style: 'single', size: 12 },
          },
        }),
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineMarkdown(trimmed.slice(2)),
          bullet: { level: 0 },
          spacing: { after: 40 },
        }),
      )
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseInlineMarkdown(trimmed),
          spacing: { after: 60 },
        }),
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: '1A1A1A',
          },
          paragraph: {
            spacing: { line: 280 },
          },
        },
      },
    },
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, fileName)
}

// ============================================================
// Helpers
// ============================================================

/**
 * Convert markdown to clean HTML for PDF printing.
 * Supports: # H1, ## H2, ### H3, - bullets, **bold**, *italic*, [text](url), ---, paragraphs
 */
function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  let html = ''
  let inList = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false }
      continue
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (inList) { html += '</ul>'; inList = false }
      html += '<hr>'
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h3>${inlineHtml(trimmed.slice(4))}</h3>`
    } else if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h2>${inlineHtml(trimmed.slice(3))}</h2>`
    } else if (trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h1>${inlineHtml(trimmed.slice(2))}</h1>`
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { html += '<ul>'; inList = true }
      html += `<li>${inlineHtml(trimmed.slice(2))}</li>`
    } else {
      if (inList) { html += '</ul>'; inList = false }
      html += `<p>${inlineHtml(trimmed)}</p>`
    }
  }
  if (inList) html += '</ul>'
  return html
}

/** Convert inline markdown (**bold**, *italic*, [text](url)) to HTML */
function inlineHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

/** Strip all markdown formatting (for DOCX headings) */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
}

/** Parse inline markdown into docx TextRun objects */
function parseInlineMarkdown(text: string): any[] {
  const docx = require('docx')
  const runs: any[] = []
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new docx.TextRun({ text: text.slice(lastIndex, match.index) }))
    }
    if (match[2]) {
      runs.push(new docx.TextRun({ text: match[2], bold: true }))
    } else if (match[3]) {
      runs.push(new docx.TextRun({ text: match[3], italics: true }))
    } else if (match[4]) {
      runs.push(new docx.TextRun({ text: match[4], font: 'Consolas' }))
    } else if (match[5]) {
      runs.push(new docx.TextRun({ text: match[5], color: '0563C1', underline: {} }))
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    runs.push(new docx.TextRun({ text: text.slice(lastIndex) }))
  }
  if (runs.length === 0) {
    runs.push(new docx.TextRun({ text }))
  }
  return runs
}

/** Trigger browser download for a Blob */
function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
