import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL?.slice(0, 60) + '...',
    DIRECT_URL: process.env.DIRECT_URL?.slice(0, 60) + '...',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  })
}
