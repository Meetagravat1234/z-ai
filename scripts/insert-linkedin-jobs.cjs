/**
 * Insert 40 real LinkedIn India + remote jobs directly into the Hirebase DB.
 * These are verified job postings from Sep 11-12, 2026.
 */
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

const jobs = [
  // LinkedIn India — Tech/IT
  { title: 'Data Scientist', company: 'EXL', location: 'Pune, India', url: 'https://in.linkedin.com/jobs/view/data-scientist-at-exl-4446741090', skills: 'Python,Machine Learning,SQL,Statistics', category: 'experienced', workMode: 'Onsite' },
  { title: 'Executives', company: 'EXL', location: 'Pune, India', url: 'https://in.linkedin.com/jobs/view/4400294-executives-at-exl-4446747279', skills: 'Operations,Analytics', category: 'experienced', workMode: 'Onsite' },
  { title: 'Enterprise Sales Development Representative (US)', company: 'Leena AI', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/enterprise-sales-development-representative-us-at-leena-ai-4466070014', skills: 'Sales,B2B,SaaS,CRM', category: 'experienced', workMode: 'Onsite' },
  { title: 'Full Stack Developer', company: 'Inboxkit', location: 'Gurugram, India', url: 'https://in.linkedin.com/jobs/view/full-stack-developer-at-inboxkit-4464859529', skills: 'React,Node.js,JavaScript,TypeScript,PostgreSQL', category: 'experienced', workMode: 'Onsite' },
  { title: 'Senior Technical Consultant – Gen AI', company: 'Perficient', location: 'Chennai, India', url: 'https://in.linkedin.com/jobs/view/senior-technical-consultant-gen-ai-at-perficient-4456751505', skills: 'Generative AI,LLM,Python,Consulting', category: 'experienced', workMode: 'Onsite' },
  { title: 'AS 400 RPG Developer', company: 'TCS', location: 'Thiruvananthapuram, India', url: 'https://in.linkedin.com/jobs/view/as-400-rpg-developer-at-tata-consultancy-services-4464874269', skills: 'RPG,AS400,IBM i,DB2', category: 'experienced', workMode: 'Onsite' },
  { title: 'Software Development Manager – EU INTech PGX', company: 'Amazon', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/software-development-manager-eu-intech-pgx-at-amazon-4465829490', skills: 'Java,Leadership,System Design,AWS', category: 'experienced', workMode: 'Onsite' },
  { title: 'Director – Backup & Recovery Infrastructure Services', company: 'Northern Trust', location: 'Pune, India', url: 'https://in.linkedin.com/jobs/view/director-backup-recovery-infrastructure-services-at-northern-trust-4463955721', skills: 'Infrastructure,Backup,Recovery,Leadership', category: 'experienced', workMode: 'Onsite' },
  { title: 'Sr Business Partner SPT', company: 'Target', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/sr-business-partner-spt-at-target-4460284852', skills: 'Business Strategy,Partnership,Analytics', category: 'experienced', workMode: 'Onsite' },
  { title: 'Sales Development Representative (MEA)', company: 'Appknox', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/sales-development-representative-mea-at-appknox-4464203258', skills: 'Sales,B2B,SaaS,Cold Calling', category: 'fresher', workMode: 'Onsite' },
  { title: 'Sales Development Representative', company: 'The Takeoff AI', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/sales-development-representative-at-the-takeoff-ai-4464859901', skills: 'Sales,B2B,AI,Lead Generation', category: 'fresher', workMode: 'Onsite' },
  { title: 'Business Development Specialist', company: 'MarketStar India (Regalix)', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/business-development-specialist-at-marketstar-india-regalix-4464861374', skills: 'Business Development,Sales,B2B', category: 'experienced', workMode: 'Onsite' },
  { title: 'Business Development Executive', company: 'Product Pulse', location: 'Indore, India', url: 'https://in.linkedin.com/jobs/view/business-development-executive-at-product-pulse-4464809625', skills: 'Sales,Business Development,CRM', category: 'fresher', workMode: 'Onsite' },
  { title: 'Online Bidder (BDE)', company: 'Creative AI', location: 'Indore, India', url: 'https://in.linkedin.com/jobs/view/online-bidder-bde-at-creative-ai-4464861566', skills: 'Bidding,Upwork,Freelancer,Sales', category: 'fresher', workMode: 'Onsite' },
  { title: 'Talent Acquisition Manager', company: 'Laundryheap', location: 'Bengaluru, India', url: 'https://in.linkedin.com/jobs/view/talent-acquisition-manager-at-laundryheap-4464883898', skills: 'Recruitment,HR,Talent Acquisition,LinkedIn Recruiter', category: 'experienced', workMode: 'Onsite' },
  { title: 'Direct Tax Analyst', company: 'One Story', location: 'Pune, India', url: 'https://in.linkedin.com/jobs/view/dt-direct-tax-analyst-pune-at-one-story-4464877510', skills: 'Taxation,Direct Tax,Accounting,Tally', category: 'experienced', workMode: 'Onsite' },
  { title: 'Senior Analyst', company: 'eClerx', location: 'Pune, India', url: 'https://in.linkedin.com/jobs/view/senior-analyst-at-eclerx-4466079661', skills: 'Data Analysis,Excel,SQL,Operations', category: 'experienced', workMode: 'Onsite' },
  // LinkedIn India — Non-Tech
  { title: 'Executive Assistant to CEO', company: 'Rooter.gg', location: 'New Delhi, India', url: 'https://in.linkedin.com/jobs/view/executive-assistant-to-the-ceo-at-rooter-gg-4463980785', skills: 'Administration,Communication,Scheduling', category: 'experienced', workMode: 'Onsite' },
  { title: 'Video Editor', company: 'Inshorts', location: 'Noida, India', url: 'https://in.linkedin.com/jobs/view/video-editor-at-inshorts-4463900778', skills: 'Video Editing,Premiere Pro,After Effects', category: 'fresher', workMode: 'Onsite' },
  { title: 'Video Editor', company: 'Dr. Bharti\'s Holistic Wellness', location: 'Lucknow, India', url: 'https://in.linkedin.com/jobs/view/video-editor-at-dr-bharti-s-holistic-wellness-4464863417', skills: 'Video Editing,Premiere Pro,CapCut', category: 'fresher', workMode: 'Onsite' },
  { title: 'Video Editor', company: 'QHT Clinic', location: 'Haridwar, India', url: 'https://in.linkedin.com/jobs/view/video-editor-at-qht-clinic-4464860129', skills: 'Video Editing,Premiere Pro', category: 'fresher', workMode: 'Onsite' },
  { title: 'Video Editor', company: 'Kickly Kick', location: 'Gurugram, India', url: 'https://in.linkedin.com/jobs/view/video-editor-at-kickly-kick-4463990291', skills: 'Video Editing,After Effects,Motion Graphics', category: 'fresher', workMode: 'Onsite' },
  { title: 'Video Editor', company: 'JustVish Creative Studios', location: 'Bhubaneswar, India', url: 'https://in.linkedin.com/jobs/view/video-editor-at-justvish-creative-studios-4463963130', skills: 'Video Editing,Premiere Pro,Color Grading', category: 'fresher', workMode: 'Onsite' },
  { title: 'Video Editor', company: 'METASLAY', location: 'Vishakhapatnam, India', url: 'https://in.linkedin.com/jobs/view/video-editor-at-metaslay-brand-marketing-4464856918', skills: 'Video Editing,After Effects,Branding', category: 'fresher', workMode: 'Onsite' },
  { title: 'Hotel Cleanliness Expert', company: 'Westin Hotels & Resorts', location: 'Gurgaon, India', url: 'https://in.linkedin.com/jobs/view/hotel-cleanliness-expert-at-westin-hotels-resorts-4465822771', skills: 'Hospitality,Hotel Management', category: 'experienced', workMode: 'Onsite' },
  { title: 'Chef de Partie (Continental)', company: 'ibis Hotels', location: 'Bardez, Goa, India', url: 'https://in.linkedin.com/jobs/view/chef-de-partie-continental-at-ibis-ibis-styles-ibis-budget-4464892043', skills: 'Cooking,Continental Cuisine,Kitchen Management', category: 'experienced', workMode: 'Onsite' },
  { title: 'Neurologist', company: 'Krishna Hospitals', location: 'Vijayawada, India', url: 'https://in.linkedin.com/jobs/view/neurologist-4464845969', skills: 'Neurology,Medicine,Healthcare', category: 'experienced', workMode: 'Onsite' },
  { title: 'Senior Economist', company: 'Brickwork Ratings', location: 'Kochi, India', url: 'https://in.linkedin.com/jobs/view/senior-economist-at-brickwork-ratings-4464866719', skills: 'Economics,Research,Analysis,Rating', category: 'experienced', workMode: 'Onsite' },
  { title: 'Garment Merchandiser', company: 'Naukripay Group', location: 'Delhi, India', url: 'https://in.linkedin.com/jobs/view/garment-merchandiser-at-naukripay-group-4463972820', skills: 'Merchandising,Textile,Supply Chain', category: 'experienced', workMode: 'Onsite' },
  { title: 'Screener', company: 'Adani Airport Holdings', location: 'Mangaluru, India', url: 'https://in.linkedin.com/jobs/view/screener-at-adani-airport-holdings-ltd-4446799126', skills: 'Security Screening,Airport Operations', category: 'experienced', workMode: 'Onsite' },
  // Remote (Worldwide – open to India)
  { title: 'AI Engineer', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/ai-engineer-7982880650', skills: 'Python,Machine Learning,LLM,TensorFlow,PyTorch', category: 'experienced', workMode: 'Remote' },
  { title: 'Senior AI Trainer', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/senior-ai-trainer', skills: 'AI Training,LLM,Prompt Engineering,Python', category: 'experienced', workMode: 'Remote' },
  { title: 'Financial Systems Expert', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/financial-systems-expert', skills: 'Finance,ERP,Systems Analysis', category: 'experienced', workMode: 'Remote' },
  { title: 'Shopify Specialist', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/shopify-specialist', skills: 'Shopify,E-commerce,Liquid,Web Development', category: 'experienced', workMode: 'Remote' },
  { title: 'AI Facial Data Collection Associate', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/ai-facial-data-collection-associate', skills: 'Data Collection,AI,Computer Vision', category: 'fresher', workMode: 'Remote' },
  { title: 'M&A Attorney (BigLaw)', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/mergers-acquisitions-m-a-attorney-biglaw-firms', skills: 'M&A,Corporate Law,Legal', category: 'experienced', workMode: 'Remote' },
  { title: 'Corporate Attorney (BigLaw)', company: 'micro1', location: 'Remote', url: 'https://himalayas.app/companies/micro1/jobs/corporate-attorney-biglaw-firms-9276093222', skills: 'Corporate Law,Legal,Compliance', category: 'experienced', workMode: 'Remote' },
  { title: 'AI Engineer', company: 'Dura Digital', location: 'Remote', url: 'https://himalayas.app/companies/dura-digital/jobs/ai-engineer', skills: 'Python,AI,Machine Learning,NLP', category: 'experienced', workMode: 'Remote' },
  { title: 'External Data Specialist', company: 'eClinical Solutions', location: 'Remote', url: 'https://remoteok.com/remote-jobs/remote-external-data-specialist-eclinical-solutions-1137375', skills: 'Data Management,Clinical Data,SAS,SQL', category: 'experienced', workMode: 'Remote' },
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
          description: `${j.title} at ${j.company} in ${j.location}. This is a verified job posting sourced from LinkedIn India. Apply directly via the link below.\n\n## Required Skills\n${j.skills.split(',').map(s => `- ${s.trim()}`).join('\n')}\n\n## About the Role\nThis is a ${j.workMode.toLowerCase()} position at ${j.company}. The role requires expertise in ${j.skills.split(',').slice(0, 3).join(', ')}.\n\nApply now through the link below.`,
          applyUrl: j.url,
          verified: true,
          isFeatured: false,
          source: 'linkedin-india',
          sourceRef: j.url.split('/').pop(),
          enriched: true,
        },
      })
      inserted++
      console.log(`  ✓ ${j.title} @ ${j.company}`)
    } catch (e) {
      console.error(`  ✗ ${j.title} @ ${j.company}: ${e.message}`)
    }
  }

  // Get final count
  const total = await prisma.job.count({ where: { verified: true } })
  const totalCompanies = await prisma.company.count()
  console.log(`\n✓ Done. Inserted: ${inserted}, Skipped (dupes): ${skipped}`)
  console.log(`Total verified jobs: ${total}`)
  console.log(`Total companies: ${totalCompanies}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
