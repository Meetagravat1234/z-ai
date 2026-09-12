/**
 * Insert verified LinkedIn India jobs.
 * Checks for duplicates by applyUrl before inserting.
 */
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

const jobs = [
  // Note: senior-economist-at-brickwork-ratings was already added — skipped
  { title: 'Cable Technician', company: 'SLB', location: 'India', url: 'https://in.linkedin.com/jobs/view/cable-technician-at-slb-4429483422', skills: 'Cable Installation,Field Service,Telecom,Networking', category: 'experienced', workMode: 'Onsite' },
  { title: 'Accountant', company: 'Synthocure Pharma LLP', location: 'India', url: 'https://in.linkedin.com/jobs/view/accountant-at-synthocure-pharma-llp-4465106390', skills: 'Accounting,Tally,GST,TDS,Financial Reporting', category: 'experienced', workMode: 'Onsite' },
  { title: 'TC CS CRCR AI Risk and Compliance Manager', company: 'EY', location: 'India', url: 'https://in.linkedin.com/jobs/view/tc-cs-crcr-ai-risk-and-compliance-manager-at-ey-4463491218', skills: 'AI Risk,Compliance,Risk Management,Governance,Audit', category: 'experienced', workMode: 'Onsite' },
]

async function main() {
  let inserted = 0
  let skipped = 0

  for (const j of jobs) {
    try {
      // Check if job already exists (by applyUrl)
      const existing = await prisma.job.findFirst({
        where: { applyUrl: j.url },
        select: { id: true },
      })
      if (existing) {
        console.log(`  SKIP (dupe): ${j.title} @ ${j.company}`)
        skipped++
        continue
      }

      // Create or get company
      const companySlug = j.company.toLowerCase().replace(/[^a-z0-9]/g, '-')
      let company = await prisma.company.findUnique({ where: { slug: companySlug } })
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: j.company,
            slug: companySlug,
            industry: null,
            verified: true,
          },
        })
      }

      // Create job
      await prisma.job.create({
        data: {
          title: j.title,
          companyId: company.id,
          category: j.category,
          employmentType: 'Full-time',
          workMode: j.workMode,
          experience: j.category === 'fresher' ? '0-2 Years' : '3+ Years',
          location: j.location,
          skills: j.skills,
          description: `${j.title} at ${j.company} in ${j.location}. This is a verified job posting sourced from LinkedIn India. Apply directly via the link below.\n\n## Required Skills\n${j.skills.split(',').map(function(s) { return '- ' + s.trim() }).join('\n')}\n\n## About the Role\nThis is a ${j.workMode.toLowerCase()} position at ${j.company}. Apply now through the link below.`,
          applyUrl: j.url,
          verified: true,
          isFeatured: false,
          source: 'linkedin-india',
          sourceRef: j.url.split('/').pop(),
          enriched: true,
        },
      })
      inserted++
      console.log(`  OK: ${j.title} @ ${j.company}`)
    } catch (e) {
      console.error(`  FAIL: ${j.title} @ ${j.company}: ${e.message}`)
    }
  }

  const total = await prisma.job.count({ where: { verified: true } })
  const totalCompanies = await prisma.company.count()
  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
  console.log(`Total verified jobs: ${total}`)
  console.log(`Total companies: ${totalCompanies}`)
}

main().catch(function(e) { console.error(e); process.exit(1) }).finally(function() { return prisma.$disconnect() })
