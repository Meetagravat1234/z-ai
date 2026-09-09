import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

// POST /api/upload/resume
// Accepts a multipart/form-data file upload (PDF, DOC, DOCX, TXT)
// Returns: { text: string, fileName: string, fileType: string, charCount: number }

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Use pdfjs-dist directly (no test file bug like pdf-parse)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')
  
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  })
  
  const pdf = await loadingTask.promise
  let text = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
    text += pageText + '\n'
  }
  
  return text
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB allowed.' }, { status: 413 })
    }

    const fileName = file.name
    const fileType = fileName.toLowerCase().split('.').pop() || ''
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text = ''

    if (fileType === 'pdf') {
      text = await extractPdfText(buffer)
    } else if (fileType === 'docx' || fileType === 'doc') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value || ''
    } else if (fileType === 'txt') {
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json({
        error: `Unsupported file type: .${fileType}. Please upload PDF, DOC, DOCX, or TXT files.`,
      }, { status: 400 })
    }

    // Clean up the text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (text.length < 50) {
      return NextResponse.json({
        error: 'Could not extract enough text from the file. It might be a scanned PDF (images only) or an empty document.',
      }, { status: 422 })
    }

    // Cap at 15000 chars for AI processing
    const cappedText = text.slice(0, 15000)

    return NextResponse.json({
      ok: true,
      text: cappedText,
      fileName,
      fileType: fileType.toUpperCase(),
      charCount: cappedText.length,
      truncated: text.length > 15000,
    })
  } catch (e: any) {
    console.error('Resume upload error:', e)
    return NextResponse.json({
      error: `Failed to process file: ${e.message || 'Unknown error'}`,
    }, { status: 500 })
  }
}
