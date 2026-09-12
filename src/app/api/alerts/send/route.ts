import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendJobAlertEmail } from '@/lib/email/send-alerts'
import { getAdminUser } from '@/lib/admin-auth'
import { cleanJobTitle } from '@/lib/seo-routes'

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
    // Pick which alerts to send. We respect the frequency field:
    // - daily alerts: throttle to 20h (so a daily alert sent at 9 AM today
    //   won't fire again until 5 AM tomorrow even if cron runs hourly)
    // - weekly alerts: throttle to 6 days (so a weekly alert fires once a week
    //   even though cron runs daily — this also gives a 1-day grace window
    //   in case a daily cron fails)
    const now = Date.now()
    const twentyHoursAgo = new Date(now - 20 * 60 * 60 * 1000)
    const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000)

    const alerts = await db.jobAlert.findMany({
      where: {
        isActive: true,
        OR: [
          // Never sent yet
          { lastSentAt: null },
          // Daily alerts: last sent > 20h ago
          { frequency: 'daily', lastSentAt: { lt: twentyHoursAgo } },
          // Weekly alerts: last sent > 6 days ago
          { frequency: 'weekly', lastSentAt: { lt: sixDaysAgo } },
          // Any other frequency value (default to daily cadence)
          { frequency: { notIn: ['daily', 'weekly'] }, lastSentAt: { lt: twentyHoursAgo } },
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

        // Send the email — pass unsubscribe token so the email footer
        // includes a working one-click unsubscribe link.
        const emailResult = await sendJobAlertEmail({
          to: alert.email,
          userName: alert.user?.name || undefined,
          alertCriteria: {
            query: alert.query,
            category: alert.category,
            location: alert.location,
            workMode: alert.workMode,
          },
          unsubscribeToken: alert.unsubscribeToken,
          jobs: matchingJobs.map((j) => ({
            id: j.id,
            title: cleanJobTitle(j.title, j.company.name),
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
