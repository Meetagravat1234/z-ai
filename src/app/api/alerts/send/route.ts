import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendJobAlertEmail } from '@/lib/email/send-alerts'
import { cleanJobTitle } from '@/lib/seo-routes'
import { estimateSalaryForJob } from '@/lib/salary-estimate'

// GET /api/alerts/send — triggered by Vercel Cron daily at 3:30 AM UTC (9 AM IST)
// Also supports x-cron-secret header for cron-job.org integration.
//
// This route is intentionally unauthenticated (same as /api/sync/* and
// /api/jobs/cleanup) so Vercel Cron can trigger it without sending auth
// headers. The worst case from abuse is sending some job alert emails,
// which is harmless — alerts are rate-limited by the lastSentAt field
// (max 1 email per 20 hours per alert).
export async function GET(req: Request) {
  // Optional: check for x-cron-secret header (for cron-job.org)
  // But DON'T require it — Vercel Cron doesn't send custom headers.
  const cronSecret = req.headers.get('x-cron-secret')
  const validCronSecret = process.env.CRON_SECRET
  const hasSecret = cronSecret && validCronSecret && cronSecret === validCronSecret

  // Log whether this was triggered by Vercel Cron (no secret) or cron-job.org (with secret)
  console.log(`[alerts/send] Triggered ${hasSecret ? 'via cron-job.org' : 'via Vercel Cron (no secret)'}`)

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
          // Split the query into individual keywords by comma, slash, or whitespace.
          // e.g. "React,Frontend,Full stack,Mern stack" → ["React", "Frontend", "Full", "stack", "Mern", "stack"]
          // Then match ANY keyword in title/skills/description.
          // Without this split, Prisma searches for the WHOLE phrase as-is,
          // which matches NOTHING (e.g. "React,Frontend,Full stack,Mern stack" as one phrase).
          const keywords = alert.query
            .split(/[,/\s]+/)
            .map((k) => k.trim())
            .filter((k) => k.length > 2)  // skip 1-2 char fragments
            .slice(0, 10)  // cap at 10 keywords to keep query fast

          if (keywords.length > 0) {
            // For each keyword, build an OR group (title OR skills OR description contains it).
            // Then nest all keyword-groups in an outer OR so ANY keyword matches.
            where.OR = keywords.map((k) => ({
              OR: [
                { title: { contains: k, mode: 'insensitive' } },
                { skills: { contains: k, mode: 'insensitive' } },
                { description: { contains: k, mode: 'insensitive' } },
              ],
            }))
          }
        }
        if (alert.category) where.category = alert.category
        if (alert.workMode) where.workMode = alert.workMode
        if (alert.location) {
          // Fuzzy location matching — handles common misspellings like
          // "banglore" → matches "Bengaluru" and "Bangalore".
          //
          // ALSO splits the location by comma/slash (same fix as the query):
          //   "Pune,Banglore,Mumbai,Hyderabad" → ["Pune", "Banglore", "Mumbai", "Hyderabad"]
          // Without splitting, Prisma searches for the whole phrase which matches nothing.
          const locRaw = alert.location.toLowerCase().trim()
          const locationVariations: Record<string, string[]> = {
            'banglore': ['Bengaluru', 'Bangalore', 'banglore'],
            'bangalore': ['Bengaluru', 'Bangalore', 'banglore'],
            'bengaluru': ['Bengaluru', 'Bangalore', 'banglore'],
            'bombay': ['Mumbai', 'Bombay'],
            'mumbai': ['Mumbai', 'Bombay'],
            'gurgaon': ['Gurugram', 'Gurgaon'],
            'gurugram': ['Gurugram', 'Gurgaon'],
            'madras': ['Chennai', 'Madras'],
            'chennai': ['Chennai', 'Madras'],
            'delhi': ['Delhi', 'Noida', 'Gurugram', 'Gurgaon'],
            'ncr': ['Delhi', 'Noida', 'Gurugram', 'Gurgaon'],
          }

          // Split multi-city input into individual cities
          const cities = locRaw
            .split(/[,/\s]+/)
            .map((c) => c.trim())
            .filter((c) => c.length > 2)
            .slice(0, 10)

          // Build variations for each city
          const variations: string[] = []
          for (const city of cities) {
            const vars = locationVariations[city] || [city]
            for (const v of vars) {
              if (!variations.includes(v)) variations.push(v)
            }
          }

          // Location matching is ADDITIVE (AND with the keyword OR groups)
          const locationClauses = variations.map((v) => ({
            location: { contains: v, mode: 'insensitive' },
          }))
          where.AND = where.AND || []
          where.AND.push({ OR: locationClauses })
        }
        if (alert.minSalary) where.salaryMin = { gte: alert.minSalary }

        // Get total count of matching jobs first (the email only shows the top 10)
        const [matchingJobs, totalMatching] = await Promise.all([
          db.job.findMany({
            where,
            include: { company: true },
            orderBy: { postedAt: 'desc' },
            take: 20, // fetch 20 so we have headroom; email slices to 10
          }),
          db.job.count({ where }),
        ])

        if (matchingJobs.length === 0) {
          results.push({ email: alert.email, matched: 0, sent: false, reason: 'no matching jobs' })
          // Still update lastSentAt so we don't keep checking
          await db.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } })
          continue
        }

        // Build the job list for the email — apply cleanJobTitle + estimated
        // salary so the email shows realistic ranges instead of "Not disclosed"
        // for every job (which was the previous behavior and looked bad).
        const jobsForEmail = await Promise.all(
          matchingJobs.map(async (j) => {
            const cleanTitle = cleanJobTitle(j.title, j.company.name)
            // Determine salary display — use actual salary if available,
            // otherwise compute an estimate from our benchmark data
            let salaryDisplay: string
            if (j.salaryMin != null && j.salaryMax != null) {
              const minLpa = j.salaryMin / 10
              const maxLpa = j.salaryMax / 10
              const fmt = (n: number) => Number.isInteger(n) ? `${n}` : n.toFixed(1)
              salaryDisplay = `₹${fmt(minLpa)}–${fmt(maxLpa)} LPA`
            } else {
              try {
                const estimate = await estimateSalaryForJob({
                  title: j.title,
                  location: j.location,
                  experience: j.experience,
                  category: j.category,
                  company: j.company,
                })
                if (estimate) {
                  const minLpa = estimate.min / 10
                  const maxLpa = estimate.max / 10
                  const fmt = (n: number) => Number.isInteger(n) ? `${n}` : n.toFixed(1)
                  salaryDisplay = `Est. ₹${fmt(minLpa)}–${fmt(maxLpa)} LPA`
                } else {
                  salaryDisplay = 'Not disclosed'
                }
              } catch {
                salaryDisplay = 'Not disclosed'
              }
            }
            return {
              id: j.id,
              title: cleanTitle,
              company: j.company.name,
              logo: j.company.logo,
              location: j.location,
              salary: salaryDisplay,
              workMode: j.workMode,
              category: j.category,
              applyUrl: j.applyUrl,
            }
          })
        )

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
          totalMatching,
          jobs: jobsForEmail,
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
