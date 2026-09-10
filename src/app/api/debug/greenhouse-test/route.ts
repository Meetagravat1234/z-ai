import { NextResponse } from 'next/server'
import { fetchGreenhouse } from '@/lib/job-sources/sources'

export async function GET() {
  const result = await fetchGreenhouse('stripe')
  return NextResponse.json({
    source: result.source,
    jobsCount: result.jobs.length,
    firstJob: result.jobs[0] || null,
    error: result.error,
  })
}
