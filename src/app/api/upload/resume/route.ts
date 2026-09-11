import { NextRequest, NextResponse } from 'next/server'

// POST /api/upload/resume
// Body: multipart/form-data with field "file" (PDF, DOC, DOCX, or TXT, max 5MB)
// Returns: { text: string, fileName: string, charCount: number, truncated: boolean }
//
// Extracts text from uploaded resume files so users don't have to copy-paste.
// Supports: .txt (plain), .pdf (text-based only — scanned PDFs won't work), .doc/.docx (basic).
//
// NOTE: For DOCX we use the mammoth library on the server side.
// For now we use a lightweight approach: extract text from plain text files
// and return a helpful message for unsupported formats. This avoids heavy
// dependencies and keeps the route fast.
//
// When the route is missing, the frontend gets a 404 HTML page (the Next.js
// 404), which fails JSON parsing with "Unexpected token '<'". That's why
// this route exists — even if extraction fails, we return a proper JSON error.

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded. Please select a file.' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 400 },
      )
    }

    // Validate file type
    const name = file.name.toLowerCase()
    const isTxt = name.endsWith('.txt')
    const isPdf = name.endsWith('.pdf')
    const isDoc = name.endsWith('.doc')
    const isDocx = name.endsWith('.docx')

    if (!isTxt && !isPdf && !isDoc && !isDocx) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.' },
        { status: 400 },
      )
    }

    // ============================================================
    // Text extraction
    // ============================================================
    let text = ''
    let truncated = false

    if (isTxt) {
      // Plain text file — just read it
      text = await file.text()
    } else if (isPdf) {
      // PDF — use pdfjs-dist (Mozilla PDF.js — reliable, pure JS, no native deps)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)
        // Dynamic import — legacy build path works in both Node and Vercel
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
        const doc = await pdfjs.getDocument({ data }).promise
        let extracted = ''
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          const content = await page.getTextContent()
          const strings = content.items.map((item: any) => item.str)
          extracted += strings.join(' ') + '\n'
        }
        text = extracted
      } catch (e: any) {
        console.error('[upload/resume] PDF parse error:', e.message)
        return NextResponse.json(
          { error: 'Failed to read PDF. If it is a scanned image, please paste your resume manually below.' },
          { status: 400 },
        )
      }
    } else if (isDocx) {
      // DOCX — use mammoth (handles the zip extraction internally, no AWS deps)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        text = result.value || ''
      } catch (e: any) {
        return NextResponse.json(
          { error: 'Failed to read DOCX. Please paste your resume manually.' },
          { status: 400 },
        )
      }
    } else if (isDoc) {
      // Legacy .doc (binary) — can't easily parse without heavy libraries.
      // Tell user to convert to DOCX or PDF.
      return NextResponse.json(
        {
          error:
            'Legacy .doc format not supported. Please save as .docx or .pdf, or paste your resume manually below.',
        },
        { status: 400 },
      )
    }

    // Clean up extracted text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
      .trim()

    // Truncate if too long (LLM context limits)
    const MAX_CHARS = 15000
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS)
      truncated = true
    }

    if (!text) {
      return NextResponse.json(
        {
          error:
            'Could not extract text from this file. If it is a scanned image PDF, please paste your resume manually below.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      text,
      fileName: file.name,
      charCount: text.length,
      truncated,
    })
  } catch (e: any) {
    console.error('[upload/resume] error:', e)
    return NextResponse.json(
      { error: e.message || 'Failed to process uploaded file.' },
      { status: 500 },
    )
  }
}

// ============================================================
// Fallback PDF text extraction — basic regex on raw buffer
// ============================================================
// Works for text-based PDFs (not scanned images). Extracts strings between
// BT and ET markers (PDF's text object markers). Less accurate than pdf-parse
// but works as a fallback when the library isn't installed.
function extractTextFromPdfFallback(buffer: Buffer): string {
  try {
    const text = buffer.toString('latin1')
    // Extract content between BT (Begin Text) and ET (End Text) markers
    const matches = text.match(/BT\s+([\s\S]*?)\s+ET/g) || []
    let extracted = ''
    for (const m of matches) {
      // Pull text from Tj and TJ operators
      const tjMatches = m.match(/\(([^)]*)\)\s*Tj/g) || []
      for (const tj of tjMatches) {
        const t = tj.match(/\(([^)]*)\)/)
        if (t) extracted += t[1]
      }
      const tjArrayMatches = m.match(/\[([^\]]*)\]\s*TJ/g) || []
      for (const tj of tjArrayMatches) {
        const parts = tj.match(/\(([^)]*)\)/g) || []
        for (const p of parts) {
          extracted += p.replace(/[()]/g, '')
        }
      }
      extracted += '\n'
    }
    return extracted || ''
  } catch {
    return ''
  }
}
