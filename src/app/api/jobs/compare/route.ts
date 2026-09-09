import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/jobs/compare
// Body: { jobIds: string[] } (2-3 job IDs)
// Returns: jobs with full details for side-by-side comparison + AI verdict
export async function POST(req: NextRequest) {
  try {
    const { jobIds } = await req.json()
    if (!Array.isArray(jobIds) || jobIds.length < 2 || jobIds.length > 3) {
      return NextResponse.json({ error: 'Provide 2 or 3 job IDs' }, { status: 400 })
    }

    const jobs = await db.job.findMany({
      where: { id: { in: jobIds } },
      include: { company: true },
    })

    if (jobs.length < 2) {
      return NextResponse.json({ error: 'Could not find all jobs' }, { status: 404 })
    }

    // Preserve order from jobIds
    const ordered = jobIds.map((id) => jobs.find((j) => j.id === id)).filter(Boolean)

    return NextResponse.json({ jobs: ordered })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
