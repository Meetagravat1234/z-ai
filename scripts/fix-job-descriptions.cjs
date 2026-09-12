/**
 * Fix jobs with poor descriptions — generate proper descriptions based on
 * title, company, location, and skills.
 */
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function main() {
  // Find jobs with poor descriptions (generic LinkedIn template text)
  const jobs = await prisma.job.findMany({
    where: {
      verified: true,
      description: {
        contains: 'This is a verified job posting sourced from LinkedIn India. Apply directly via the link below.',
      },
    },
    select: { id: true, title: true, location: true, skills: true, category: true, workMode: true, experience: true, companyId: true, applyUrl: true },
    take: 500,
  })
  
  console.log(`Found ${jobs.length} jobs with poor descriptions`)
  
  let updated = 0
  for (const job of jobs) {
    // Get company name
    const company = await prisma.company.findUnique({
      where: { id: job.companyId },
      select: { name: true, industry: true },
    })
    
    const companyName = company?.name || 'the company'
    const industry = company?.industry || ''
    const skills = job.skills ? job.skills.split(',').filter(s => s.trim()).map(s => s.trim()) : []
    const isFresher = job.category === 'fresher'
    const isRemote = /remote/i.test(job.workMode)
    const location = job.location || 'India'
    
    // Generate a proper description
    let desc = `## About the Role\n\n`
    desc += `We are looking for a ${job.title} to join ${companyName}${industry ? `, a leading ${industry.toLowerCase()} company` : ''}. `
    desc += `This is a ${job.workMode.toLowerCase()} ${job.employmentType || 'full-time'} position based in ${location}.\n\n`
    
    desc += `## Key Responsibilities\n\n`
    desc += `- Lead and contribute to ${job.title.toLowerCase()} initiatives\n`
    desc += `- Collaborate with cross-functional teams to deliver high-quality results\n`
    desc += `- Apply best practices and industry standards in your work\n`
    desc += `- Drive continuous improvement and innovation\n\n`
    
    if (skills.length > 0 && skills[0] !== 'Relevant Skills') {
      desc += `## Required Qualifications\n\n`
      skills.forEach(s => { desc += `- ${s}\n` })
      desc += '\n'
    } else {
      desc += `## Required Qualifications\n\n`
      desc += `- Relevant experience in ${job.title.toLowerCase()}\n`
      desc += `- Strong communication and problem-solving skills\n`
      desc += `- Ability to work in a fast-paced environment\n\n`
    }
    
    desc += `## What We Offer\n\n`
    desc += `- Competitive salary and benefits\n`
    desc += `- Opportunity to work with a growing team\n`
    desc += `- Career growth and learning opportunities\n`
    if (isRemote) {
      desc += `- Remote work flexibility\n`
    }
    desc += '\n'
    
    desc += `## How to Apply\n\n`
    desc += `Click the "Apply now" button to be redirected to the official application page. `
    desc += `${companyName} is an equal opportunity employer.\n`
    
    // Update the job
    await prisma.job.update({
      where: { id: job.id },
      data: {
        description: desc,
        skills: skills.length > 0 && skills[0] !== 'Relevant Skills' ? job.skills : generateSkillsFromTitle(job.title),
      },
    })
    updated++
  }
  
  console.log(`Updated ${updated} job descriptions`)
  
  // Also fix jobs with "Relevant Skills" — generate proper skills from title
  const skillFixJobs = await prisma.job.findMany({
    where: { skills: 'Relevant Skills' },
    select: { id: true, title: true },
    take: 200,
  })
  
  console.log(`Found ${skillFixJobs.length} jobs with "Relevant Skills" — fixing...`)
  let skillsUpdated = 0
  for (const job of skillFixJobs) {
    const newSkills = generateSkillsFromTitle(job.title)
    await prisma.job.update({
      where: { id: job.id },
      data: { skills: newSkills },
    })
    skillsUpdated++
  }
  console.log(`Updated ${skillsUpdated} skill fields`)
  
  // Also fix jobs with no applyUrl — set applyUrl from sourceRef if available
  const noApplyJobs = await prisma.job.findMany({
    where: { applyUrl: null, verified: true },
    select: { id: true, sourceRef: true, source: true },
    take: 100,
  })
  
  console.log(`Found ${noApplyJobs.length} jobs with no applyUrl`)
  let applyFixed = 0
  for (const job of noApplyJobs) {
    if (job.sourceRef && job.sourceRef.startsWith('http')) {
      await prisma.job.update({
        where: { id: job.id },
        data: { applyUrl: job.sourceRef },
      })
      applyFixed++
    }
  }
  console.log(`Fixed ${applyFixed} applyUrls`)
}

function generateSkillsFromTitle(title) {
  const t = title.toLowerCase()
  const skills = []
  if (/python/.test(t)) skills.push('Python')
  if (/java\b/.test(t) && !/javascript/.test(t)) skills.push('Java')
  if (/javascript|js\b/.test(t)) skills.push('JavaScript')
  if (/react|mern|mean/.test(t)) skills.push('React', 'Node.js')
  if (/angular/.test(t)) skills.push('Angular')
  if (/vue/.test(t)) skills.push('Vue.js')
  if (/c\+\+|cpp/.test(t)) skills.push('C++')
  if (/\bc\b/.test(t) && !/c\+\+/.test(t)) skills.push('C')
  if (/sql|database|db/.test(t)) skills.push('SQL')
  if (/ai|machine.?learning|ml\b/.test(t)) skills.push('AI', 'Machine Learning')
  if (/data.?scient/.test(t)) skills.push('Python', 'Data Science', 'Statistics')
  if (/data.?engineer/.test(t)) skills.push('SQL', 'ETL', 'Data Warehousing')
  if (/data.?anal/.test(t)) skills.push('SQL', 'Excel', 'Data Analysis')
  if (/devops|ansible|cloud|aws|azure|gcp/.test(t)) skills.push('DevOps', 'AWS', 'Docker', 'Kubernetes')
  if (/frontend|front.?end/.test(t)) skills.push('JavaScript', 'React', 'CSS', 'HTML')
  if (/backend|back.?end/.test(t)) skills.push('Python', 'REST API', 'Databases')
  if (/full.?stack/.test(t)) skills.push('JavaScript', 'React', 'Node.js', 'SQL')
  if (/sales|business.?develop|bde|inside.?sales/.test(t)) skills.push('Sales', 'B2B', 'CRM', 'Communication')
  if (/video.?editor|motion.?graphic/.test(t)) skills.push('Video Editing', 'Premiere Pro', 'After Effects')
  if (/graphic.?design/.test(t)) skills.push('Graphic Design', 'Photoshop', 'Illustrator')
  if (/accountant|tax|finance/.test(t)) skills.push('Accounting', 'Tally', 'GST', 'Financial Reporting')
  if (/hr|recruiter|talent/.test(t)) skills.push('HR', 'Recruitment', 'Talent Acquisition')
  if (/hotel|chef|steward|housekeeping|guest|front.?office/.test(t)) skills.push('Hospitality', 'Hotel Management')
  if (/architect/.test(t)) skills.push('Architecture', 'System Design')
  if (/marketing/.test(t)) skills.push('Marketing', 'Digital Marketing', 'SEO')
  if (/manager|lead|director/.test(t)) skills.push('Leadership', 'Project Management')
  if (/tester|qa|quality/.test(t)) skills.push('Testing', 'Selenium', 'Test Automation')
  if (/security/.test(t)) skills.push('Cybersecurity', 'Network Security')
  if (/embedded|firmware|rtl|verification|hardware/.test(t)) skills.push('Embedded Systems', 'C', 'RTOS')
  if (/android|mobile/.test(t)) skills.push('Android', 'Kotlin', 'Mobile Development')
  if (/ios/.test(t)) skills.push('iOS', 'Swift', 'Mobile Development')
  return skills.length > 0 ? skills.join(', ') : 'Communication, Problem Solving, Teamwork'
}

main()
  .catch(function(e) { console.error(e); process.exit(1) })
  .finally(function() { return prisma.$disconnect() })
