const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function main() {
  // Check how many alerts exist
  const alerts = await prisma.jobAlert.findMany({
    select: { id: true, email: true, isActive: true, createdAt: true }
  })
  console.log(`Found ${alerts.length} existing alerts`)
  console.log(JSON.stringify(alerts, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
