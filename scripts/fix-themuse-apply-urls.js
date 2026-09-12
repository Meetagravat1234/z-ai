/**
 * Add fallback apply URLs for the 8 themuse jobs whose companies had no
 * website in our DB. We hardcode the well-known career page URL for each
 * company so the "Apply now" button works instead of showing
 * "Apply link not available".
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const COMPANY_CAREER_URLS = {
  'SpaceX': 'https://www.spacex.com/careers/',
  'Methodist Le Bonheur Healthcare': 'https://www.methodisthealth.org/careers/',
  'USAA': 'https://www.usaajobs.com/',
  'Residential Home Health and Hospice': 'https://www.residentialhomehealth.com/careers/',
  'SAS Retail Services': 'https://www.sasretailservices.com/careers/',
  'celonis': 'https://www.celonis.com/careers/',
  'Advantage Solutions': 'https://careers.advantagesolutions.net/',
  'Optum': 'https://careers.unitedhealthgroup.com/',
}

async function main() {
  const jobs = await prisma.job.findMany({
    where: { applyUrl: null },
    include: { company: true },
  })

  console.log(`Found ${jobs.length} jobs with null applyUrl`)

  let updated = 0
  for (const job of jobs) {
    const careerUrl = COMPANY_CAREER_URLS[job.company.name]
    if (careerUrl) {
      await prisma.job.update({
        where: { id: job.id },
        data: { applyUrl: careerUrl },
      })
      // Also update the company website while we're at it
      await prisma.company.update({
        where: { id: job.company.id },
        data: { website: careerUrl.replace(/\/careers\/?$/, '') },
      })
      console.log(`✓ ${job.title} @ ${job.company.name} → ${careerUrl}`)
      updated++
    } else {
      // No known URL — mark as unverified so it doesn't show in public lists
      await prisma.job.update({
        where: { id: job.id },
        data: { verified: false },
      })
      console.log(`⚠ ${job.title} @ ${job.company.name} — unknown company, marked unverified`)
    }
  }

  console.log(`\nDone. Updated ${updated} of ${jobs.length} jobs.`)
  const remaining = await prisma.job.count({ where: { applyUrl: null, verified: true } })
  console.log(`Remaining verified jobs with null applyUrl: ${remaining}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
