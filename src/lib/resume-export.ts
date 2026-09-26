/**
 * Resume / cover-letter export utilities.
 *
 * PDF:
 *   Desktop: Uses browser's native print engine (window.print) via hidden iframe.
 *           Opens print dialog → user selects 'Save as PDF'. Best quality (text-based PDF).
 *   Mobile: Uses jsPDF + html2canvas for DIRECT download (no print dialog).
 *           File downloads immediately — better mobile UX.
 *
 * DOCX: Uses the docx npm package to generate a real .docx file client-side.
 */

import { getTemplate, type ResumeTemplate } from '@/lib/resume-templates'

/**
 * Detect if user is on a mobile device.
 * Used to decide between print-based PDF (desktop) vs jsPDF (mobile).
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth < 768)
}

// ============================================================
// Markdown → PDF (desktop: print / mobile: direct download)
// ============================================================
export async function generatePdfFromMarkdown(
  markdown: string,
  fileName: string,
  templateSlug?: string | null,
): Promise<void> {
  // Mobile → direct download (no print dialog)
  // Desktop → print dialog (better quality, text-based PDF)
  if (isMobileDevice()) {
    return generatePdfMobile(markdown, fileName, templateSlug)
  } else {
    return generatePdfDesktop(markdown, fileName, templateSlug)
  }
}

// ============================================================
// Desktop: PDF via browser print engine (text-based, high quality)
// ============================================================
async function generatePdfDesktop(
  markdown: string,
  fileName: string,
  templateSlug?: string | null,
): Promise<void> {
  const html = markdownToHtml(markdown)
  const template = templateSlug ? getTemplate(templateSlug) ?? null : null
  const css = buildPrintCss(template)
  const finalHtml = template?.layout === 'two-column'
    ? wrapTwoColumnLayout(html)
    : html

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

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

  await new Promise(resolve => setTimeout(resolve, 500))
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()

  setTimeout(() => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  }, 1000)
}

// ============================================================
// Mobile: PDF via jsPDF + html2canvas (direct download, no print dialog)
// ============================================================
async function generatePdfMobile(
  markdown: string,
  fileName: string,
  templateSlug?: string | null,
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const html = markdownToHtml(markdown)
  const template = templateSlug ? getTemplate(templateSlug) ?? null : null
  const css = buildPrintCss(template)
  const finalHtml = template?.layout === 'two-column'
    ? wrapTwoColumnLayout(html)
    : html

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '794px'
  container.style.background = '#ffffff'
  container.style.padding = '40px 48px'
  container.innerHTML = `<style>${css}</style>${finalHtml}`
  document.body.appendChild(container)

  try {
    await new Promise((r) => setTimeout(r, 300))
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pdfWidth = 210
    const pdfHeight = 297
    const margin = 10 // 10mm margin on all sides
    const contentWidth = pdfWidth - margin * 2
    const contentHeight = (canvas.height * contentWidth) / canvas.width

    if (contentHeight <= pdfHeight - margin * 2) {
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight)
    } else {
      let heightLeft = contentHeight
      let position = margin
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight)
      heightLeft -= (pdfHeight - margin * 2)
      while (heightLeft > 0) {
        position = -(contentHeight - heightLeft) + margin
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight)
        heightLeft -= (pdfHeight - margin * 2)
      }
    }

    pdf.save(fileName)
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  }
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
  const fontFamily = template?.fontFamily || "'Inter', 'Helvetica', Arial, sans-serif"

  // Simple, clean, professional CSS — not too fancy
  const baseFontSize = '11pt'
  const baseMargin = '0.5in 0.6in'
  const baseLineHeight = '1.4'

  let css = `
  @page { size: A4; margin: 0.5in 0.6in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${fontFamily};
    font-size: ${baseFontSize};
    line-height: ${baseLineHeight};
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 20pt;
    font-weight: 700;
    margin: 0 0 4pt 0;
    color: #0f1729;
    border-bottom: 2pt solid ${accent};
    padding-bottom: 4pt;
  }
  h2 {
    font-size: 12pt;
    font-weight: 700;
    margin: 12pt 0 4pt 0;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    border-bottom: 0.5pt solid ${accent};
    padding-bottom: 2pt;
  }
  h3 {
    font-size: 11pt;
    font-weight: 700;
    margin: 8pt 0 2pt 0;
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
    grid-template-columns: 1fr 160pt;
    gap: 12pt;
  }
  @media (max-width: 480px) {
    .resume-container { grid-template-columns: 1fr; gap: 8pt; }
    .resume-sidebar { border-left: none; border-top: 1pt solid ${accent}; padding: 8pt; }
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
