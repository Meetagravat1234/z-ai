import { NextRequest, NextResponse } from 'next/server'

// POST /api/upload/resume
// Body: multipart/form-data with field "file" (PDF, DOC, DOCX, or TXT, max 5MB)
// Returns: { text: string, fileName: string, charCount: number, truncated: boolean }

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

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Max 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        },
        { status: 400 },
      )
    }

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

    let text = ''
    let truncated = false

    if (isTxt) {
      text = await file.text()
    } else if (isPdf) {
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
      return NextResponse.json(
        {
          error:
            'Legacy .doc format not supported. Please save as .docx or .pdf, or paste your resume manually below.',
        },
        { status: 400 },
      )
    }

    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

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
