import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendJobAlertEmail } from '@/lib/email/send-alerts'
import { getAdminUser } from '@/lib/admin-auth'

// GET /api/alerts/send — triggered by cron-job.org daily
// CRITICAL: Now requires either admin auth OR a CRON_SECRET header.
// Previously was open to anyone — attackers could trigger mass email spam.
export async function GET(req: Request) {
  // Auth check — allow admin OR a secret cron token
  const admin = await getAdminUser()
  const cronSecret = req.headers.get('x-cron-secret')
  const validCronSecret = process.env.CRON_SECRET

  if (!admin && !(cronSecret && validCronSecret && cronSecret === validCronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active alerts that haven't been sent in the last 20 hours
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000)
    const alerts = await db.jobAlert.findMany({
      where: {
        isActive: true,
        OR: [
          { lastSentAt: null },
          { lastSentAt: { lt: twentyHoursAgo } },
        ],
      },
      include: { user: true },
    })

    let totalEmailsSent = 0
    let totalJobsMatched = 0
    const results: any[] = []

    for (const alert of alerts) {
      try {
        // Build the job query based on alert criteria
        const where: any = { verified: true }
        
        if (alert.lastSentAt) {
          // Only include jobs posted after last alert was sent
          where.postedAt = { gt: alert.lastSentAt }
        } else {
          // First alert — include jobs from last 7 days
          where.postedAt = { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }

        if (alert.query) {
          where.OR = [
            { title: { contains: alert.query, mode: 'insensitive' } },
            { skills: { contains: alert.query, mode: 'insensitive' } },
            { description: { contains: alert.query, mode: 'insensitive' } },
          ]
        }
        if (alert.category) where.category = alert.category
        if (alert.workMode) where.workMode = alert.workMode
        if (alert.location) where.location = { contains: alert.location, mode: 'insensitive' }
        if (alert.minSalary) where.salaryMin = { gte: alert.minSalary }

        const matchingJobs = await db.job.findMany({
          where,
          include: { company: true },
          orderBy: { postedAt: 'desc' },
          take: 20,
        })

        if (matchingJobs.length === 0) {
          results.push({ email: alert.email, matched: 0, sent: false, reason: 'no matching jobs' })
          // Still update lastSentAt so we don't keep checking
          await db.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } })
          continue
        }

        // Send the email
        const emailResult = await sendJobAlertEmail({
          to: alert.email,
          userName: alert.user?.name || undefined,
          alertCriteria: {
            query: alert.query,
            category: alert.category,
            location: alert.location,
            workMode: alert.workMode,
          },
          jobs: matchingJobs.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company.name,
            logo: j.company.logo,
            location: j.location,
            salary: j.salaryMin && j.salaryMax
              ? `₹${j.salaryMin / 10} – ₹${j.salaryMax / 10} LPA`
              : 'Not disclosed',
            workMode: j.workMode,
            category: j.category,
            applyUrl: j.applyUrl,
          })),
        })

        if (emailResult.success) {
          totalEmailsSent++
          totalJobsMatched += matchingJobs.length
          results.push({ email: alert.email, matched: matchingJobs.length, sent: true })
        } else {
          results.push({ email: alert.email, matched: matchingJobs.length, sent: false, error: emailResult.error })
        }

        // Update lastSentAt
        await db.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } })
      } catch (e: any) {
        results.push({ email: alert.email, matched: 0, sent: false, error: e.message })
      }
    }

    return NextResponse.json({
      ok: true,
      alertsProcessed: alerts.length,
      emailsSent: totalEmailsSent,
      jobsMatched: totalJobsMatched,
      results,
    })
  } catch (e: any) {
    console.error('Alert send error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
