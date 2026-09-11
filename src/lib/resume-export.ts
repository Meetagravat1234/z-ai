/**
 * Resume / cover-letter export utilities.
 *
 * Two formats supported:
 *   - PDF  (using jsPDF — client-side, no server)
 *   - DOCX (using docx package — client-side, no server)
 *
 * Both take markdown text from the AI output and produce a properly formatted
 * document with headings, bullet points, and proper typography.
 *
 * Why client-side:
 *   - No Vercel function timeout issues
 *   - No server CPU cost
 *   - Works offline after page load
 *   - Instant download (no waiting for server)
 *
 * Both functions return a Blob that the caller can trigger as a download.
 */

// ============================================================
// Markdown → PDF (using jsPDF)
// ============================================================
export async function generatePdfFromMarkdown(markdown: string, fileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    compress: true,
  })

  // Page dimensions + margins (in points; 1pt = 1/72 inch)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 50 // ~0.7 inch margins
  const maxWidth = pageWidth - margin * 2
  let cursorY = margin

  // Helper: add a new page if cursor is near bottom
  const ensureSpace = (needed: number) => {
    if (cursorY + needed > pageHeight - margin) {
      doc.addPage()
      cursorY = margin
    }
  }

  // Helper: wrap text to fit page width
  const wrapText = (text: string, fontSize: number): string[] => {
    doc.setFontSize(fontSize)
    return doc.splitTextToSize(text, maxWidth) as string[]
  }

  // Parse markdown line by line
  const lines = markdown.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // Blank line — small vertical spacing
      cursorY += 8
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      ensureSpace(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      const wrapped = wrapText(trimmed.slice(4), 12)
      doc.text(wrapped, margin, cursorY)
      cursorY += wrapped.length * 16 + 6
    } else if (trimmed.startsWith('## ')) {
      ensureSpace(35)
      cursorY += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(20, 20, 20)
      const wrapped = wrapText(trimmed.slice(3), 14)
      doc.text(wrapped, margin, cursorY)
      cursorY += wrapped.length * 18 + 8
    } else if (trimmed.startsWith('# ')) {
      ensureSpace(40)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      const wrapped = wrapText(trimmed.slice(2), 18)
      doc.text(wrapped, margin, cursorY)
      cursorY += wrapped.length * 22 + 10
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet point
      ensureSpace(20)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 40)
      const bulletText = '•  ' + stripMarkdown(trimmed.slice(2))
      const wrapped = wrapText(bulletText, 11)
      // Indent bullet points slightly
      doc.text(wrapped, margin + 12, cursorY)
      cursorY += wrapped.length * 14 + 3
    } else {
      // Regular paragraph
      ensureSpace(20)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 40)
      const cleanText = stripMarkdown(trimmed)
      const wrapped = wrapText(cleanText, 11)
      doc.text(wrapped, margin, cursorY)
      cursorY += wrapped.length * 14 + 4
    }
  }

  // Save the PDF
  doc.save(fileName)
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
    AlignmentType,
  } = docx

  // Parse markdown into paragraphs
  const paragraphs: any[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // Blank line — add small spacer paragraph
      paragraphs.push(new Paragraph({ children: [] }))
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: stripMarkdown(trimmed.slice(4)), bold: true, size: 24 })],
          spacing: { before: 200, after: 100 },
        }),
      )
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: stripMarkdown(trimmed.slice(3)), bold: true, size: 28 })],
          spacing: { before: 240, after: 120 },
        }),
      )
    } else if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: stripMarkdown(trimmed.slice(2)), bold: true, size: 36 })],
          spacing: { before: 280, after: 160 },
        }),
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet point
      paragraphs.push(
        new Paragraph({
          children: parseInlineMarkdown(trimmed.slice(2)),
          bullet: { level: 0 },
          spacing: { after: 60 },
        }),
      )
    } else {
      // Regular paragraph
      paragraphs.push(
        new Paragraph({
          children: parseInlineMarkdown(trimmed),
          spacing: { after: 80 },
        }),
      )
    }
  }

  // Build the document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch in twips (1/20 point)
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
            size: 22, // 11pt (size is in half-points)
            color: '333333',
          },
          paragraph: {
            spacing: { line: 312 }, // 1.3x line spacing
          },
        },
      },
    },
  })

  // Generate the .docx file as a Blob → trigger download
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, fileName)
}

// ============================================================
// Helpers
// ============================================================

/**
 * Strip markdown formatting from text (used for PDF where jsPDF can't render **bold** inline).
 * For DOCX we keep the formatting via parseInlineMarkdown().
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold**
    .replace(/\*([^*]+)\*/g, '$1')        // *italic*
    .replace(/_([^_]+)_/g, '$1')          // _italic_
    .replace(/`([^`]+)`/g, '$1')         // `code`
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')  // [text](url) → text
}

/**
 * Parse inline markdown (bold, italic, code) into TextRun objects for DOCX.
 * Supports: **bold**, *italic*, `code`, [text](url)
 */
function parseInlineMarkdown(text: string): any[] {
  const runs: any[] = []
  // Simple regex-based parser: find **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add any text before this match as a normal run
    if (match.index > lastIndex) {
      runs.push(new (require('docx').TextRun)({ text: text.slice(lastIndex, match.index) }))
    }
    // Add the matched run with appropriate formatting
    if (match[2]) {
      // **bold**
      runs.push(new (require('docx').TextRun)({ text: match[2], bold: true }))
    } else if (match[3]) {
      // *italic*
      runs.push(new (require('docx').TextRun)({ text: match[3], italics: true }))
    } else if (match[4]) {
      // `code`
      runs.push(new (require('docx').TextRun)({ text: match[4], font: 'Consolas' }))
    } else if (match[5]) {
      // [text](url) → make text bold + underlined (Word doesn't have native hyperlinks in TextRun)
      runs.push(new (require('docx').TextRun)({ text: match[5], color: '0563C1', underline: {} }))
    }
    lastIndex = regex.lastIndex
  }
  // Add any remaining text after last match
  if (lastIndex < text.length) {
    runs.push(new (require('docx').TextRun)({ text: text.slice(lastIndex) }))
  }
  // If no markdown was found, return the plain text as a single run
  if (runs.length === 0) {
    runs.push(new (require('docx').TextRun)({ text }))
  }
  return runs
}

/**
 * Trigger a browser download for a Blob.
 */
function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Clean up the object URL after a short delay (download has started)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
