import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: `File too large. Max 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` }, { status: 400 })

    const name = file.name.toLowerCase()
    const isTxt = name.endsWith('.txt')
    const isPdf = name.endsWith('.pdf')
    const isDocx = name.endsWith('.docx')
    if (!isTxt && !isPdf && !isDocx) return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' }, { status: 400 })

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
      } catch { return NextResponse.json({ error: 'Failed to read PDF. If it is a scanned image, please paste your resume manually below.' }, { status: 400 }) }
    } else if (isDocx) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        text = result.value || ''
      } catch { return NextResponse.json({ error: 'Failed to read DOCX. Please paste your resume manually.' }, { status: 400 }) }
    }

    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    if (text.length > 15000) { text = text.slice(0, 15000); truncated = true }
    if (!text) return NextResponse.json({ error: 'Could not extract text. Please paste your resume manually below.' }, { status: 400 })

    return NextResponse.json({ text, fileName: file.name, charCount: text.length, truncated })
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Failed to process file.' }, { status: 500 }) }
}
