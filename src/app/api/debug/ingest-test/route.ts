import { NextRequest, NextResponse } from 'next/server'
import { ingestJobs } from '@/lib/ingest'

export async function POST(req: NextRequest) {
  try {
    const result = await ingestJobs('debug-test', [{
      title: 'Debug Test Engineer',
      company: 'DebugTestCorp',
      location: 'Bengaluru, India',
      description: 'We need a test engineer with Python experience.',
      applyUrl: 'https://example.com/debug-test',
      sourceRef: 'debug-test-001',
    }], false)

    return NextResponse.json({ result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) }, { status: 500 })
  }
}
