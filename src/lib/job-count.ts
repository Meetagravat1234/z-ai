/**
 * Dynamic job count — fetches the REAL verified job count from the database.
 *
 * Why this exists:
 * - Previously, "860+" was hardcoded in 15+ files (layout, page, jobs, pricing, etc.)
 * - When jobs expired (30-day cleanup) or new jobs were added, the count became stale
 * - Users saw "860+" but /jobs showed 725 → trust issue
 *
 * This function fetches the actual count from the DB. It's called from:
 * - layout.tsx (default title + meta description)
 * - app/page.tsx (homepage metadata + JSON-LD)
 * - app/jobs/page.tsx (already uses db.job.count — no change needed)
 * - app/pricing/page.tsx (description + CTA text)
 * - app/insights/[slug]/page.tsx (CTA text)
 *
 * The count is cached for 5 minutes (matching the ISR revalidation period)
 * to avoid hitting the DB on every request.
 */

import { db } from '@/lib/db'

let cachedCount: number | null = null
let cacheTime: number = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Returns the current number of verified jobs.
 * Cached for 5 minutes to avoid DB load on every page render.
 *
 * Usage:
 *   const jobCount = await getVerifiedJobCount()
 *   title: `Hirebase — India's AI-Powered Job Portal | ${jobCount}+ Verified Jobs`
 */
export async function getVerifiedJobCount(): Promise<number> {
  // Check cache first
  if (cachedCount !== null && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedCount
  }

  try {
    const count = await db.job.count({ where: { verified: true } })
    // Round down to nearest 10 for cleaner display (e.g., 725 → 720)
    // This avoids the count flickering between 724 and 726 as jobs are
    // added/expired throughout the day.
    const displayCount = Math.floor(count / 10) * 10
    cachedCount = displayCount
    cacheTime = Date.now()
    return displayCount
  } catch (e) {
    // If DB is unavailable, return the last known count or 0
    return cachedCount ?? 0
  }
}

/**
 * Returns a display string like "720+" for use in titles and descriptions.
 * This is the SINGLE SOURCE OF TRUTH for job counts across the site.
 */
export async function getJobCountDisplay(): Promise<string> {
  const count = await getVerifiedJobCount()
  return `${count}+`
}
