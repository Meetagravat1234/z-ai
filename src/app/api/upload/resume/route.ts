import { NextRequest, NextResponse } from 'next/server'

// POST /api/upload/resume
// Body: multipart/form-data with field "file" (PDF, DOC, DOCX, or TXT, max 5MB)
// Returns: { text: string, fileName: string, charCount: number, truncated: boolean }
//
// Extracts text from uploaded resume files so users don't have to copy-paste.
// Supports: .txt (plain), .pdf (text-based only — scanned PDFs won't work),
// .docx (via mammoth). Legacy .doc is not supported (would need LibreOffice).
//
// IMPORTANT: This route MUST exist. Without it, the frontend gets a 404 HTML
// page from Next.js, which fails JSON parsing with "Unexpected token '<'",
// showing the user a confusing "File upload is temporarily unavailable"
// error. This route returns proper JSON even on failure.

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a file.' },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Max 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        },
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
      // PDF — use unpdf (pure JS, Vercel/serverless-friendly, no native deps)
      // unpdf uses Mozilla PDF.js under the hood but wraps it in a cleaner API
      // that doesn't require setting workerSrc (which was causing issues).
      try {
        const arrayBuffer = await file.arrayBuffer()
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
        const result = await extractText(pdf, { mergePages: true })
        text = result.text || ''
      } catch (e: any) {
        console.error('[upload/resume] PDF parse error:', e?.message || e)
        return NextResponse.json(
          {
            error:
              'Failed to read PDF. If it is a scanned image, please paste your resume manually below.',
          },
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
        console.error('[upload/resume] DOCX parse error:', e?.message || e)
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
