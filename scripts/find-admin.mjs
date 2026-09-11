import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
const prisma = new PrismaClient()
async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true, name: true, role: true }
  })
  console.log('Admin users:', admins.length)
  for (const a of admins) {
    console.log(`  ${a.email} (${a.name || 'no name'}) — role: ${a.role}`)
  }
  // Also check all users
  const allUsers = await prisma.user.findMany({
    select: { email: true, name: true, role: true },
    take: 20,
    orderBy: { createdAt: 'desc' }
  })
  console.log('\nRecent users:')
  for (const u of allUsers) {
    console.log(`  ${u.email} (${u.name || 'no name'}) — role: ${u.role}`)
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
