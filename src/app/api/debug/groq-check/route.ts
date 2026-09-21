import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    hasGroqKey: !!process.env.GROQ_API_KEY,
    groqKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.slice(0, 10) + '...' : null,
  })
}
