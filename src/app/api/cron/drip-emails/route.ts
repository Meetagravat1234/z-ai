import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendDripDay1Welcome, sendDripDay3Reminder, sendDripDay7Offer } from '@/lib/email/drip-emails'

/**
 * GET /api/cron/drip-emails
 *
 * Triggered daily by Vercel Cron (or cron-job.org).
 * Sends drip email campaign to users who signed up but haven't used AI tools.
 *
 * Stages:
 *   Stage 0: No email sent yet → if user signed up 1+ day ago, send Day 1 welcome
 *   Stage 1: Welcome sent → if 3+ days since signup, send Day 3 reminder
 *   Stage 2: Reminder sent → if 7+ days since signup, send Day 7 offer
 *   Stage 3: Offer sent → no more emails (campaign complete)
 *
 * Skips:
 *   - Users who have used ANY AI tool (they're already activated)
 *   - Users who upgraded to Pro (already converted)
 *   - Admin users
 */
export async function GET() {
  try {
    const now = Date.now()
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    let sent1 = 0, sent3 = 0, sent7 = 0
    let skippedActivated = 0, skippedPro = 0, errors = 0

    // === Stage 0 → Stage 1: Send Day 1 welcome ===
    // Users who signed up 1+ day ago, haven't received any drip email yet
    const stage0Users = await db.user.findMany({
      where: {
        role: 'candidate',
        dripEmailStage: 0,
        createdAt: { lt: oneDayAgo },
        // Skip users who already used AI tools (they're activated)
        resumeOptimizationsUsed: 0,
        atsChecksUsed: 0,
        coverLettersUsed: 0,
        mockInterviewsUsed: 0,
        skillGapAnalysesUsed: 0,
        salaryPredictionsUsed: 0,
      },
      take: 100, // cap to avoid timeout
    })

    for (const user of stage0Users) {
      try {
        await sendDripDay1Welcome({ to: user.email, userName: user.name || undefined })
        await db.user.update({
          where: { id: user.id },
          data: { dripEmailStage: 1, dripEmailSentAt: new Date() },
        })
        sent1++
      } catch (e: any) {
        console.error(`[drip] Day 1 failed for ${user.email}:`, e.message?.slice(0, 80))
        errors++
      }
    }

    // === Stage 1 → Stage 2: Send Day 3 reminder ===
    const stage1Users = await db.user.findMany({
      where: {
        role: 'candidate',
        dripEmailStage: 1,
        createdAt: { lt: threeDaysAgo },
        resumeOptimizationsUsed: 0,
        atsChecksUsed: 0,
        coverLettersUsed: 0,
        mockInterviewsUsed: 0,
      },
      take: 100,
    })

    for (const user of stage1Users) {
      try {
        await sendDripDay3Reminder({ to: user.email, userName: user.name || undefined })
        await db.user.update({
          where: { id: user.id },
          data: { dripEmailStage: 2, dripEmailSentAt: new Date() },
        })
        sent3++
      } catch (e: any) {
        console.error(`[drip] Day 3 failed for ${user.email}:`, e.message?.slice(0, 80))
        errors++
      }
    }

    // === Stage 2 → Stage 3: Send Day 7 offer ===
    const stage2Users = await db.user.findMany({
      where: {
        role: 'candidate',
        dripEmailStage: 2,
        createdAt: { lt: sevenDaysAgo },
        subscriptionTier: 'free', // only send to non-Pro users
        resumeOptimizationsUsed: 0,
        atsChecksUsed: 0,
        coverLettersUsed: 0,
        mockInterviewsUsed: 0,
      },
      take: 100,
    })

    for (const user of stage2Users) {
      try {
        await sendDripDay7Offer({ to: user.email, userName: user.name || undefined })
        await db.user.update({
          where: { id: user.id },
          data: { dripEmailStage: 3, dripEmailSentAt: new Date() },
        })
        sent7++
      } catch (e: any) {
        console.error(`[drip] Day 7 failed for ${user.email}:`, e.message?.slice(0, 80))
        errors++
      }
    }

    return NextResponse.json({
      ok: true,
      sent: { day1: sent1, day3: sent3, day7: sent7 },
      errors,
      totalProcessed: stage0Users.length + stage1Users.length + stage2Users.length,
    })
  } catch (e: any) {
    console.error('[drip-emails] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
