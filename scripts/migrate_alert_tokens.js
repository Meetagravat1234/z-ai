const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Add the column as nullable first (idempotent — safe to re-run)
  console.log('Step 1: Adding unsubscribeToken column as nullable...')
  await prisma.$executeRawUnsafe(`ALTER TABLE "JobAlert" ADD COLUMN IF NOT EXISTS "unsubscribeToken" TEXT;`)
  console.log('  ✓ Column added')

  // Backfill existing rows with random tokens
  console.log('Step 2: Backfilling existing alerts with tokens...')
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "JobAlert"
    SET "unsubscribeToken" = 'migr_' || encode(gen_random_bytes(16), 'hex')
    WHERE "unsubscribeToken" IS NULL;
  `)
  console.log(`  ✓ Backfilled ${result} alerts`)

  // Make the column NOT NULL
  console.log('Step 3: Making column NOT NULL...')
  await prisma.$executeRawUnsafe(`ALTER TABLE "JobAlert" ALTER COLUMN "unsubscribeToken" SET NOT NULL;`)
  console.log('  ✓ Column is now NOT NULL')

  // Add unique index (drop first if exists, then create)
  console.log('Step 4: Adding unique index...')
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "JobAlert_unsubscribeToken_key";`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "JobAlert_unsubscribeToken_key" ON "JobAlert"("unsubscribeToken");`)
  console.log('  ✓ Unique index created')

  // Add other indexes
  console.log('Step 5: Adding performance indexes...')
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "JobAlert_userId_idx" ON "JobAlert"("userId");`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "JobAlert_isActive_lastSentAt_idx" ON "JobAlert"("isActive", "lastSentAt");`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "JobAlert_email_idx" ON "JobAlert"("email");`)
  console.log('  ✓ Indexes created')

  // Verify
  const alerts = await prisma.jobAlert.findMany({ select: { id: true, email: true, unsubscribeToken: true }})
  console.log('\nVerification — alerts now have tokens:')
  console.log(JSON.stringify(alerts, null, 2))
}
main().catch(e => { console.error('MIGRATION FAILED:', e); process.exit(1); }).finally(() => prisma.$disconnect())
