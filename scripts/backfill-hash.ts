// Backfill hash for existing jobs and mark them as enriched (since they came from seed data)
import { db } from '../src/lib/db'
import crypto from 'crypto'

async function main() {
  const jobs = await db.job.findMany()
  console.log(`Backfilling ${jobs.length} jobs...`)
  let updated = 0
  for (const j of jobs) {
    if (j.hash) continue
    const hash = crypto.createHash('sha1').update(`${j.title}|${j.companyId}|${j.location}`).digest('hex')
    await db.job.update({
      where: { id: j.id },
      data: {
        hash,
        source: 'manual',
        enriched: true,
        enrichedAt: new Date(),
        originalDescription: j.description,
      },
    })
    updated++
  }
  console.log(`Updated ${updated} jobs`)
}

main().catch(console.error).finally(() => db.$disconnect())
