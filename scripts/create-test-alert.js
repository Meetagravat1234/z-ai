/**
 * Creates a test JobAlert for usef884@gmail.com and triggers the send route.
 * Uses the admin user as the alert owner (JobAlert.userId is required).
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 1. Find the admin user
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@hirebase.in' },
    select: { id: true, email: true, name: true },
  })
  if (!admin) {
    console.error('Admin user not found — aborting')
    process.exit(1)
  }
  console.log(`Using admin user: ${admin.email} (id: ${admin.id})`)

  // 2. Delete any existing test alert for this email (so we don't dedup-block ourselves)
  const deleted = await prisma.jobAlert.deleteMany({
    where: { email: 'usef884@gmail.com' },
  })
  console.log(`Cleared ${deleted.count} existing test alert(s) for usef884@gmail.com`)

  // 3. Create a fresh test alert with broad criteria (no filters = matches all verified jobs)
  const alert = await prisma.jobAlert.create({
    data: {
      userId: admin.id,
      email: 'usef884@gmail.com',
      frequency: 'daily',
      isActive: true,
      lastSentAt: null, // force send on next batch
      // No query/category/location filters → matches all verified jobs
      // (the send route uses empty criteria as "all jobs")
    },
  })
  console.log(`\n✓ Created test alert:`)
  console.log(JSON.stringify({
    id: alert.id,
    email: alert.email,
    frequency: alert.frequency,
    isActive: alert.isActive,
    unsubscribeToken: alert.unsubscribeToken,
  }, null, 2))

  // 4. Count how many verified jobs exist that this alert would match
  const totalJobs = await prisma.job.count({ where: { verified: true } })
  console.log(`\nThis alert will match ${totalJobs} verified jobs in the DB.`)
  console.log(`Send route will pick the 20 most recent.`)
}

main().catch(e => { console.error('FAILED:', e); process.exit(1); }).finally(() => prisma.$disconnect())
