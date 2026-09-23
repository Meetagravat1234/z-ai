import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, recordAiUse } from '@/lib/rate-limit'

/**
 * POST /api/upload/resume
 *
 * Parses a resume file (PDF, DOC, DOCX, TXT) and returns the extracted
 * plain text. Used by AI tools (resume optimizer, cover letter, ATS score,
 * mock interview) so users don't have to paste their resume manually.
 *
 * NO auth required — works for anonymous users too (matches the AI tools'
 * behavior where they fall back to a demo user when not logged in).
 *
 * Rate limited: 10 uploads/hour per IP to prevent abuse.
 *
 * File size limit: 5MB (matching the UI hint).
 * Text output: truncated to 15,000 chars to stay under AI token limits.
 *
 * Supported formats:
 *   - PDF (.pdf)       → unpdf
 *   - DOCX (.docx)     → mammoth
 *   - DOC (.doc)       → mammoth (legacy Word — may fail, error message guides user to convert)
 *   - TXT (.txt)       → direct read
 *
 * Returns: { text, fileName, charCount, truncated }
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — 10 uploads/hour (prevents abuse without blocking real users)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const rate = checkRateLimit(`upload:${ip}`, 'resumeUpload', 'free')
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: 'Too many uploads. Please wait a few minutes and try again, or paste your resume manually.',
          rateLimited: true,
          retryAfterSeconds: Math.ceil((rate.resetAt - Date.now()) / 1000),
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
      )
    }

    // Parse FormData — throws if body is not multipart/form-data.
    // Wrap in try/catch so we return a friendly 400 instead of 500.
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a PDF, DOCX, or TXT file and try again.' },
        { status: 400 },
      )
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size (5MB max — matching the UI hint)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB. Try a smaller file or paste text manually.` },
        { status: 413 },
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    const ext = fileName.split('.').pop() || ''
    const validExts = ['pdf', 'doc', 'docx', 'txt']
    if (!validExts.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${ext}". Please upload a PDF, DOCX, or TXT file.` },
        { status: 400 },
      )
    }

    // Reject empty files early (0 bytes — e.g. user selected file then emptied it)
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'The file is empty. Please select a valid resume file.' },
        { status: 422 },
      )
    }

    // Extract text based on file type
    let text = ''
    try {
      if (ext === 'txt') {
        text = await file.text()
      } else if (ext === 'pdf') {
        text = await extractFromPdf(file)
      } else if (ext === 'docx') {
        text = await extractFromDocx(file)
      } else if (ext === 'doc') {
        // Legacy .doc format — mammoth doesn't support it reliably.
        // Tell the user to convert to .docx or .pdf.
        return NextResponse.json(
          {
            error: 'Legacy .doc format not supported. Please save as .docx or .pdf and try again.',
          },
          { status: 400 },
        )
      }
    } catch (extractErr: any) {
      console.error('[upload/resume] extraction failed:', extractErr)
      return NextResponse.json(
        {
          error: `Could not extract text from this file. It may be corrupted or password-protected. Try saving as PDF or paste your resume manually.`,
        },
        { status: 422 },
      )
    }

    // Clean up text — remove excessive whitespace, null bytes, etc.
    text = text
      .replace(/\0/g, '') // remove null bytes (some PDFs have them)
      .replace(/\r\n/g, '\n') // normalize line endings
      .replace(/[ \t]+/g, ' ') // collapse multiple spaces/tabs into one
      .replace(/\n{3,}/g, '\n\n') // collapse 3+ newlines into 2
      .trim()

    if (text.length < 50) {
      return NextResponse.json(
        {
          error: 'Could not extract enough text from this file. It may be a scanned image PDF. Try a text-based PDF or paste your resume manually.',
        },
        { status: 422 },
      )
    }

    // Truncate to 15,000 chars to stay under AI token limits
    const MAX_CHARS = 15000
    const truncated = text.length > MAX_CHARS
    if (truncated) {
      text = text.slice(0, MAX_CHARS)
    }

    // Record the upload for rate limiting (only counts successful uploads)
    recordAiUse(`upload:${ip}`, 'resumeUpload')

    return NextResponse.json({
      text,
      fileName: file.name,
      charCount: text.length,
      truncated,
    })
  } catch (e: any) {
    console.error('[upload/resume] error:', e)
    return NextResponse.json(
      { error: 'Upload failed. Please try again or paste your resume manually.' },
      { status: 500 },
    )
  }
}

/**
 * Extract text from a PDF file using unpdf.
 * unpdf is a serverless-friendly PDF parser (no system deps).
 *
 * KNOWN ISSUE: Some PDFs (especially Google Docs / Word exports) store text
 * with explicit per-character positioning, causing unpdf to return text
 * like "R e s u l t s" instead of "Results". We detect this pattern and
 * collapse the extra spaces.
 */
async function extractFromPdf(file: File): Promise<string> {
  const { extractText } = await import('unpdf')
  const buffer = await file.arrayBuffer()
  const result = await extractText(buffer, { mergePages: true })
  let text = result.text || ''

  // Detect "R e s u l t s" pattern — at least 8 consecutive single-letter + space pairs
  // Normal text never has "a b c d e f g h" — only broken PDF extraction does.
  // Use lookahead to find runs of 8+ single letters separated by single spaces.
  const brokenPattern = /[a-zA-Z](?: [a-zA-Z]){7,}/
  if (brokenPattern.test(text)) {
    // Find all runs of single-letter + space + single-letter and collapse them.
    // We do this by repeatedly replacing "X Y" → "XY" but ONLY when both X and Y
    // are part of a longer broken run.
    //
    // Strategy: find each broken run with a regex, then collapse it.
    text = text.replace(/[a-zA-Z](?: [a-zA-Z])+/g, (match) => {
      // Only collapse if the run is at least 8 letters (avoids joining "I am" etc.)
      if (match.length >= 15) {
        return match.replace(/ /g, '')
      }
      return match
    })
  }

  return text
}

/**
 * Extract text from a DOCX file using mammoth.
 * mammoth converts .docx to HTML, then we strip tags.
 */
async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ''
}
