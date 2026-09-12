const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function main() {
  // Update full tests to 30 min (since they'll have 50 questions eventually)
  await prisma.skillTest.updateMany({
    where: { testType: 'full' },
    data: { durationMin: 30 }
  })
  
  // Update topic tests to 15 min (since they'll have 10 questions)
  await prisma.skillTest.updateMany({
    where: { testType: 'topic' },
    data: { durationMin: 15 }
  })
  
  const fullTests = await prisma.skillTest.count({ where: { testType: 'full' } })
  const topicTests = await prisma.skillTest.count({ where: { testType: 'topic' } })
  const totalQuestions = await prisma.skillTestQuestion.count()
  
  console.log(`Full tests: ${fullTests} (30 min each)`)
  console.log(`Topic tests: ${topicTests} (15 min each)`)
  console.log(`Total questions: ${totalQuestions}`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
