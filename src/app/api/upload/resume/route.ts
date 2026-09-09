import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'

// POST /api/upload/resume
// Accepts a multipart/form-data file upload (PDF, DOC, DOCX, TXT)
// Returns: { text: string, fileName: string, fileType: string, charCount: number }

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
      // Use unpdf — pure JS, no native dependencies, works on Vercel serverless
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const result = await extractText(pdf, { mergePages: true })
      text = result.text || ''
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
