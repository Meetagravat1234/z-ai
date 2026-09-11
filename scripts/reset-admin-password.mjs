/**
 * Reset admin password.
 * Usage: node scripts/reset-admin-password.mjs <new-password>
 * 
 * This script:
 *   1. Finds the admin user (admin@hirebase.in)
 *   2. Hashes the new password with bcrypt
 *   3. Updates the DB
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const newPassword = process.argv[2]
  if (!newPassword) {
    console.error('Usage: node scripts/reset-admin-password.mjs <new-password>')
    process.exit(1)
  }

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@hirebase.in' },
  })

  if (!admin) {
    console.error('Admin user not found: admin@hirebase.in')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hashedPassword },
  })

  console.log(`✓ Admin password updated successfully`)
  console.log(`  Email: admin@hirebase.in`)
  console.log(`  New password: ${newPassword}`)
  console.log(`  Login URL: https://www.hirebase.in/auth`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
