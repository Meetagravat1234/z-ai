// Seed script — populates the database with companies, jobs, and articles
import { db } from '../src/lib/db'

const companies = [
  { name: "Google", slug: "google", industry: "Technology", size: "1000+", hq: "Mountain View, USA", hiringActivity: "High", sevenDayTrend: 50, logo: "🔍", website: "https://google.com", description: "Google LLC is an American multinational technology company specializing in Internet-related services and products.", culture: "Innovation-driven, collaborative, and inclusive workplace.", benefits: "Health insurance, Free food, Gym, Education reimbursement, Parental leave" },
  { name: "Amazon", slug: "amazon", industry: "E-commerce / Cloud", size: "1000+", hq: "Seattle, USA", hiringActivity: "High", sevenDayTrend: 25, logo: "📦", website: "https://amazon.com", description: "Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, and digital streaming.", culture: "Customer-obsessed, fast-paced, data-driven.", benefits: "Health insurance, Stock options, 401k, PTO" },
  { name: "Microsoft", slug: "microsoft", industry: "Technology", size: "1000+", hq: "Redmond, USA", hiringActivity: "Medium", sevenDayTrend: 0, logo: "🪟", website: "https://microsoft.com", description: "Microsoft Corporation is an American multinational technology corporation producing computer software, consumer electronics, and personal computers.", culture: "Growth mindset, diversity, and inclusion.", benefits: "Health insurance, Stock options, 401k match, Wellness" },
  { name: "NVIDIA", slug: "nvidia", industry: "Semiconductors / AI", size: "1000+", hq: "Santa Clara, USA", hiringActivity: "High", sevenDayTrend: 200, logo: "🎮", website: "https://nvidia.com", description: "NVIDIA Corporation is an American multinational technology company that designs graphics processing units for gaming and professional markets.", culture: "Engineering-first, fast-paced, AI-focused.", benefits: "Health insurance, Stock options, ESPP, Wellness" },
  { name: "Cisco", slug: "cisco", industry: "Networking", size: "1000+", hq: "San Jose, USA", hiringActivity: "Medium", sevenDayTrend: -33, logo: "🌐", website: "https://cisco.com", description: "Cisco Systems, Inc. is an American multinational technology company that develops, manufactures, and sells networking hardware and software.", culture: "Collaborative, flexible, customer-focused.", benefits: "Health insurance, 401k, PTO, Wellness" },
  { name: "Accenture", slug: "accenture", industry: "IT Services / Consulting", size: "1000+", hq: "Dublin, Ireland", hiringActivity: "High", sevenDayTrend: 100, logo: "🏢", website: "https://accenture.com", description: "Accenture plc is a multinational professional services company providing services in strategy, consulting, digital, technology and operations.", culture: "Performance-driven, learning-focused, diverse.", benefits: "Health insurance, PTO, 401k, Training" },
  { name: "HPE", slug: "hpe", industry: "Enterprise IT", size: "1000+", hq: "Houston, USA", hiringActivity: "Medium", sevenDayTrend: -50, logo: "💻", website: "https://hpe.com", description: "Hewlett Packard Enterprise Company is an American multinational enterprise information technology company.", culture: "Innovation-led, hybrid work friendly.", benefits: "Health insurance, Stock, PTO, Wellness" },
  { name: "Qualcomm", slug: "qualcomm", industry: "Semiconductors / Wireless", size: "1000+", hq: "San Diego, USA", hiringActivity: "Medium", sevenDayTrend: 0, logo: "📡", website: "https://qualcomm.com", description: "Qualcomm Inc. is an American multinational corporation that creates semiconductors, software, and services related to wireless technology.", culture: "Engineering excellence, innovation.", benefits: "Health insurance, Stock, ESPP, Education" },
  { name: "Airbus", slug: "airbus", industry: "Aerospace", size: "1000+", hq: "Toulouse, France", hiringActivity: "Medium", sevenDayTrend: -25, logo: "✈️", website: "https://airbus.com", description: "Airbus SE is a European multinational aerospace corporation. It designs, manufactures and sells civil and military aerospace products.", culture: "Engineering-first, international, mission-driven.", benefits: "Health insurance, Pension, PTO, Family" },
  { name: "Mastercard", slug: "mastercard", industry: "Financial Services", size: "1000+", hq: "Purchase, USA", hiringActivity: "Medium", sevenDayTrend: 0, logo: "💳", website: "https://mastercard.com", description: "Mastercard Inc. is an American multinational financial services corporation offering payment processing and related services.", culture: "Diverse, ethical, customer-obsessed.", benefits: "Health insurance, Stock, 401k, PTO" },
  { name: "Honeywell", slug: "honeywell", industry: "Conglomerate", size: "1000+", hq: "Charlotte, USA", hiringActivity: "Medium", sevenDayTrend: 50, logo: "🏭", website: "https://honeywell.com", description: "Honeywell International Inc. is an American multinational conglomerate operating in aerospace, building technologies, and performance materials.", culture: "Engineering-driven, performance-focused.", benefits: "Health insurance, 401k, PTO, Stock" },
  { name: "GE HealthCare", slug: "ge-healthcare", industry: "Medical Devices", size: "1000+", hq: "Chicago, USA", hiringActivity: "Medium", sevenDayTrend: -20, logo: "🏥", website: "https://gehealthcare.com", description: "GE HealthCare Technologies Inc. is an American multinational medical technology company.", culture: "Mission-driven, innovative, patient-focused.", benefits: "Health insurance, 401k, PTO, Wellness" },
  { name: "Flex", slug: "flex", industry: "Manufacturing", size: "1000+", hq: "Austin, USA", hiringActivity: "Medium", sevenDayTrend: 0, logo: "🔧", website: "https://flex.com", description: "Flex Ltd. is a Singaporean-American multinational electronics contract manufacturer.", culture: "Operational excellence, global, diverse.", benefits: "Health insurance, 401k, PTO" },
  { name: "KPMG", slug: "kpmg", industry: "Professional Services", size: "1000+", hq: "Amstelveen, NL", hiringActivity: "Medium", sevenDayTrend: -10, logo: "📊", website: "https://kpmg.com", description: "KPMG International Limited is a multinational professional services network and one of the Big Four accounting firms.", culture: "Learning-driven, professional, ethical.", benefits: "Health insurance, Pension, PTO, Training" },
  { name: "Maersk", slug: "maersk", industry: "Logistics / Shipping", size: "1000+", hq: "Copenhagen, DK", hiringActivity: "Medium", sevenDayTrend: -50, logo: "🚢", website: "https://maersk.com", description: "A.P. Moller-Maersk Group is a Danish shipping and logistics company.", culture: "Global, diverse, sustainability-focused.", benefits: "Health insurance, Pension, PTO, Family" },
  { name: "State Street", slug: "state-street", industry: "Financial Services", size: "1000+", hq: "Boston, USA", hiringActivity: "Medium", sevenDayTrend: -30, logo: "🏦", website: "https://statestreet.com", description: "State Street Corporation is an American financial services and bank holding company.", culture: "Stable, professional, growth-oriented.", benefits: "Health insurance, 401k, Pension, PTO" },
  { name: "Infineon", slug: "infineon", industry: "Semiconductors", size: "1000+", hq: "Neubiberg, DE", hiringActivity: "Medium", sevenDayTrend: 200, logo: "⚡", website: "https://infineon.com", description: "Infineon Technologies AG is a German semiconductor manufacturer.", culture: "Engineering-driven, innovative, sustainable.", benefits: "Health insurance, Pension, Stock, Wellness" },
  { name: "Hitachi Energy", slug: "hitachi-energy", industry: "Energy / Power", size: "1000+", hq: "Zurich, CH", hiringActivity: "Medium", sevenDayTrend: 0, logo: "🔋", website: "https://hitachienergy.com", description: "Hitachi Energy is a global technology leader advancing a sustainable energy future for all.", culture: "Sustainability-driven, innovative, global.", benefits: "Health insurance, Pension, PTO" },
  { name: "IQVIA", slug: "iqvia", industry: "Healthcare / Data", size: "1000+", hq: "Durham, USA", hiringActivity: "Medium", sevenDayTrend: -50, logo: "💊", website: "https://iqvia.com", description: "IQVIA Holdings Inc. is an American multinational company serving the life sciences industry.", culture: "Data-driven, mission-driven, patient-first.", benefits: "Health insurance, 401k, PTO, Wellness" },
  { name: "WSP", slug: "wsp", industry: "Engineering Consulting", size: "1000+", hq: "Montreal, CA", hiringActivity: "Medium", sevenDayTrend: -25, logo: "🏗️", website: "https://wsp.com", description: "WSP Global Inc. is a Canadian consulting firm providing engineering and design services.", culture: "Collaborative, sustainable, future-focused.", benefits: "Health insurance, Pension, PTO, Wellness" },
  { name: "Caterpillar", slug: "caterpillar", industry: "Heavy Machinery", size: "1000+", hq: "Deerfield, USA", hiringActivity: "Medium", sevenDayTrend: 0, logo: "🚜", website: "https://caterpillar.com", description: "Caterpillar Inc. is an American construction equipment manufacturer.", culture: "Engineering excellence, durable products.", benefits: "Health insurance, 401k, Pension, PTO" },
  { name: "HARMAN", slug: "harman", industry: "Connected Technologies", size: "1000+", hq: "Stamford, USA", hiringActivity: "Medium", sevenDayTrend: -10, logo: "🔊", website: "https://harman.com", description: "HARMAN International is an American audio and infotronics equipment company, subsidiary of Samsung.", culture: "Innovation-driven, music-loving, global.", benefits: "Health insurance, 401k, PTO, Wellness" },
]

const jobs = [
  { title: "Software Engineer (Evergreen)", company: "Cisco", category: "fresher", employmentType: "Full-time", workMode: "Hybrid", experience: "0 Years", salaryMin: 80, salaryMax: 200, location: "Bengaluru", skills: "Java,Python,JavaScript,React", description: "Join Cisco's software engineering team as an evergreen fresher role. You'll work on networking products used by enterprises worldwide.", postedAtDaysAgo: 21 },
  { title: "Software Development Engineer I", company: "Amazon", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0 Years", salaryMin: 45, salaryMax: 95, location: "Bengaluru", skills: "Python,Java,Data Structures,Algorithms", description: "Amazon SDE I role for fresh graduates. Build scalable systems that serve millions of customers daily.", postedAtDaysAgo: 21 },
  { title: "Silicon Engineer, Platform and Devices, University Graduate", company: "Google", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0 Years", salaryMin: 80, salaryMax: 120, location: "Bengaluru", skills: "Verification,SoC,ASIC,Verilog,RTL", description: "Google's silicon engineering role for 2026 university graduates. Work on custom silicon that powers Google's hardware.", postedAtDaysAgo: 21 },
  { title: "ASIC Verification Engineer", company: "NVIDIA", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "1 Year", salaryMin: 80, salaryMax: 150, location: "Hyderabad", skills: "Verification,RTL Debug,ASIC,Verilog,UVM", description: "Verify NVIDIA's next-generation GPU and AI accelerator designs. Work with cutting-edge hardware.", postedAtDaysAgo: 21 },
  { title: "2027 Campus Hire — Associate Engineer, Software", company: "Qualcomm", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0 Years", salaryMin: 100, salaryMax: 230, location: "Hyderabad,Bengaluru,Chennai,Noida", skills: "Firmware,Information Systems,Computer Science,Embedded Systems", description: "Qualcomm's 2027 campus hiring program for software engineers. Multiple locations across India.", postedAtDaysAgo: 28 },
  { title: "Engineering Services Practitioner — Aircraft Interior Design", company: "Accenture", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0-2 Years", salaryMin: 160, salaryMax: 360, location: "Bengaluru", skills: "CATIA,CAD,GD&T,BOM,Mechanical Design", description: "Design aircraft interiors at Airbus via Accenture engineering services. CATIA expertise required.", postedAtDaysAgo: 21 },
  { title: "Materials Engineer", company: "Accenture", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0-2 Years", salaryMin: 160, salaryMax: 360, location: "Bengaluru", skills: "Validation,CAD,Quality Assurance", description: "Materials engineering role supporting aerospace engineering projects.", postedAtDaysAgo: 21 },
  { title: "QuickSpecs Publication Administrator", company: "HPE", category: "fresher", employmentType: "Full-time", workMode: "Hybrid", experience: "0-2 Years", salaryMin: 50, salaryMax: 100, location: "Chennai", skills: "HTML basics,Excel,Digital Publishing,Attention to Detail", description: "Manage HPE product specification publications. Hybrid role based in Chennai.", postedAtDaysAgo: 21 },
  { title: "College Intern — Software", company: "HPE", category: "internship", employmentType: "Internship", workMode: "Remote", experience: "0 Years", salaryMin: 150, salaryMax: 330, location: "Bengaluru", skills: "Python", description: "Remote software engineering internship at HPE for college students.", postedAtDaysAgo: 21 },
  { title: "Data Science Intern", company: "Microsoft", category: "internship", employmentType: "Internship", workMode: "Hybrid", experience: "0 Years", salaryMin: 50, salaryMax: 100, location: "Hyderabad", skills: "Python,ML,SQL,Statistics", description: "Microsoft Research internship in data science and applied ML.", postedAtDaysAgo: 14 },
  { title: "Cabin Technical Change Management Engineer", company: "Airbus", category: "experienced", employmentType: "Full-time", workMode: "Onsite", experience: "3-5 Years", salaryMin: 150, salaryMax: 300, location: "Bengaluru", skills: "Cabin Systems,Change Management,Engineering,Aerospace", description: "Lead cabin technical changes for Airbus aircraft programs. Bengaluru engineering center.", postedAtDaysAgo: 7 },
  { title: "Software Engineer I — Network Testing & Automation", company: "HPE", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0 Years", salaryMin: 60, salaryMax: 120, location: "Bengaluru", skills: "Python,Networking,Automation,Testing", description: "Automate network testing for HPE Aruba products. Fresh graduate role.", postedAtDaysAgo: 14 },
  { title: "Sales Operations Analyst", company: "HPE", category: "experienced", employmentType: "Full-time", workMode: "Hybrid", experience: "2-4 Years", salaryMin: 90, salaryMax: 180, location: "Bengaluru", skills: "Excel,Sales Ops,Analytics,CRM", description: "Drive sales operations excellence at HPE through data-driven insights.", postedAtDaysAgo: 14 },
  { title: "Customer Success Engineer", company: "HPE", category: "experienced", employmentType: "Full-time", workMode: "Remote", experience: "1-3 Years", salaryMin: 80, salaryMax: 150, location: "Remote, India", skills: "Customer Support,Cloud,Networking", description: "Remote customer success role at HPE GreenLake cloud platform.", postedAtDaysAgo: 10 },
  { title: "Backend Engineer", company: "Google", category: "experienced", employmentType: "Full-time", workMode: "Hybrid", experience: "3-5 Years", salaryMin: 250, salaryMax: 500, location: "Hyderabad", skills: "Go,Distributed Systems,Cloud,Kubernetes", description: "Build scalable backend systems at Google Cloud. 3+ years experience required.", postedAtDaysAgo: 5 },
  { title: "Frontend Engineer", company: "Microsoft", category: "experienced", employmentType: "Full-time", workMode: "Hybrid", experience: "2-5 Years", salaryMin: 200, salaryMax: 400, location: "Bengaluru", skills: "React,TypeScript,CSS,Accessibility", description: "Build delightful user experiences for Microsoft 365 products.", postedAtDaysAgo: 3 },
  { title: "Machine Learning Engineer", company: "NVIDIA", category: "experienced", employmentType: "Full-time", workMode: "Onsite", experience: "2-4 Years", salaryMin: 300, salaryMax: 600, location: "Bengaluru", skills: "PyTorch,CUDA,TensorRT,LLM", description: "Optimize ML inference pipelines for NVIDIA's AI platforms.", postedAtDaysAgo: 4 },
  { title: "Walk-in Drive: Customer Support Executive", company: "Accenture", category: "walk-in", employmentType: "Full-time", workMode: "Onsite", experience: "0-2 Years", salaryMin: 30, salaryMax: 50, location: "Pune", skills: "Communication,English,MS Office", description: "Walk-in interview for customer support executive. Carry resume and ID proof.", postedAtDaysAgo: 2 },
  { title: "Walk-in Drive: Junior Analyst", company: "KPMG", category: "walk-in", employmentType: "Full-time", workMode: "Onsite", experience: "0-1 Years", salaryMin: 40, salaryMax: 60, location: "Gurugram", skills: "Excel,Analysis,Communication", description: "Walk-in drive for junior analyst role at KPMG Gurugram office.", postedAtDaysAgo: 1 },
  { title: "Referral: Engineering Manager", company: "Google", category: "hidden", employmentType: "Full-time", workMode: "Hybrid", experience: "8+ Years", salaryMin: 800, salaryMax: 1500, location: "Bengaluru", skills: "Leadership,Distributed Systems,Mentoring", description: "Hidden referral-only role for engineering manager. Reach out via referral network.", postedAtDaysAgo: 7 },
  { title: "Referral: Senior Cloud Architect", company: "Amazon", category: "hidden", employmentType: "Full-time", workMode: "Remote", experience: "8+ Years", salaryMin: 700, salaryMax: 1400, location: "Remote, India", skills: "AWS,Architecture,Migration", description: "Hidden referral role for AWS senior cloud architect. Not publicly listed.", postedAtDaysAgo: 10 },
  { title: "Internship: DevOps Engineer", company: "Cisco", category: "internship", employmentType: "Internship", workMode: "Hybrid", experience: "0 Years", salaryMin: 30, salaryMax: 50, location: "Bengaluru", skills: "Docker,Kubernetes,CICD,AWS", description: "6-month DevOps internship at Cisco. Stipend provided.", postedAtDaysAgo: 5 },
  { title: "Internship: UX Designer", company: "Microsoft", category: "internship", employmentType: "Internship", workMode: "Onsite", experience: "0 Years", salaryMin: 40, salaryMax: 70, location: "Hyderabad", skills: "Figma,Research,Prototyping,Design", description: "12-week UX design internship at Microsoft Hyderabad.", postedAtDaysAgo: 8 },
  { title: "Junior Software Engineer — Python", company: "HPE", category: "fresher", employmentType: "Full-time", workMode: "Hybrid", experience: "0 Years", salaryMin: 60, salaryMax: 120, location: "Chennai", skills: "Python,Django,REST,SQL", description: "Junior Python developer role at HPE Chennai. Hybrid work.", postedAtDaysAgo: 12 },
  { title: "Cloud Solutions Architect", company: "Microsoft", category: "experienced", employmentType: "Full-time", workMode: "Remote", experience: "5-8 Years", salaryMin: 500, salaryMax: 1000, location: "Remote, India", skills: "Azure,Architecture,Migration,Enterprise", description: "Senior cloud architect for Microsoft Azure enterprise customers.", postedAtDaysAgo: 6 },
  { title: "Embedded Software Engineer", company: "Qualcomm", category: "experienced", employmentType: "Full-time", workMode: "Onsite", experience: "2-4 Years", salaryMin: 150, salaryMax: 300, location: "Hyderabad", skills: "C,C++,RTOS,Embedded Linux", description: "Develop embedded firmware for Qualcomm's mobile chipset platforms.", postedAtDaysAgo: 9 },
  { title: "Aerospace Design Engineer", company: "Airbus", category: "experienced", employmentType: "Full-time", workMode: "Onsite", experience: "3-6 Years", salaryMin: 180, salaryMax: 350, location: "Bengaluru", skills: "CATIA,Aerospace,Structural Design", description: "Structural design engineer for Airbus A350 program.", postedAtDaysAgo: 11 },
  { title: "AI Research Scientist", company: "Google", category: "experienced", employmentType: "Full-time", workMode: "Hybrid", experience: "4+ Years", salaryMin: 600, salaryMax: 1200, location: "Bengaluru", skills: "Research,LLM,ML,PhD", description: "Google Research scientist role focused on large language models.", postedAtDaysAgo: 15 },
  { title: "Junior Recruiter", company: "Accenture", category: "fresher", employmentType: "Full-time", workMode: "Onsite", experience: "0 Years", salaryMin: 35, salaryMax: 60, location: "Pune", skills: "Communication,Sourcing,ATS", description: "Entry-level recruiter role at Accenture talent acquisition team.", postedAtDaysAgo: 6 },
  { title: "QA Engineer — Automation", company: "Cisco", category: "experienced", employmentType: "Full-time", workMode: "Hybrid", experience: "2-4 Years", salaryMin: 120, salaryMax: 220, location: "Bengaluru", skills: "Selenium,Cypress,Python,API Testing", description: "Automated QA engineering role for Cisco Webex products.", postedAtDaysAgo: 4 },
]

const articles = [
  { title: "How Companies Actually Hire Freshers in India", slug: "how-companies-hire-freshers-india", excerpt: "Understand the actual hiring funnel: ATS screening, coding tests, technical interviews, HR rounds — and what each filter actually evaluates.", category: "fresher", tags: "hiring,freshers,india", readMinutes: 8, coverEmoji: "🎓" },
  { title: "Why Companies Ask for Experience in Fresher Jobs", slug: "why-companies-ask-experience-fresher-jobs", excerpt: "It seems contradictory, but it is a deliberate filter. Here is why HR does it and how to still get the interview.", category: "fresher", tags: "freshers,experience,hiring", readMinutes: 6, coverEmoji: "🤔" },
  { title: "How to Tell Whether a Job Is Actually Fresher-Friendly", slug: "tell-fresher-friendly-jobs", excerpt: "Not every 0 years job is built for freshers. Learn the red flags and the green flags from job descriptions.", category: "fresher", tags: "freshers,jobs,red-flags", readMinutes: 5, coverEmoji: "🚩" },
  { title: "ATS-Friendly Resume in 2026: A Practical Template", slug: "ats-friendly-resume-2026", excerpt: "Most resumes are rejected by robots before a human ever sees them. Build one that passes ATS and impresses recruiters.", category: "resume", tags: "resume,ats,template", readMinutes: 10, coverEmoji: "📄" },
  { title: "The STAR Method for Behavioral Interviews", slug: "star-method-behavioral-interviews", excerpt: "Situation, Task, Action, Result. Master this framework and never freeze in a behavioral interview again.", category: "interview", tags: "interview,behavioral,star", readMinutes: 7, coverEmoji: "⭐" },
  { title: "Negotiating Your First Salary: A Fresher Guide", slug: "negotiating-first-salary-fresher", excerpt: "Yes, freshers can negotiate. Here is how to research market rates, anchor your number, and handle this is our final offer.", category: "career", tags: "salary,negotiation,fresher", readMinutes: 9, coverEmoji: "💰" },
  { title: "Hidden Jobs: How to Find Roles Before They Are Posted", slug: "hidden-jobs-find-roles", excerpt: "The best jobs often never get posted publicly. Here is how to access the referral economy and hidden job market.", category: "career", tags: "hidden-jobs,referrals,networking", readMinutes: 8, coverEmoji: "🕵️" },
  { title: "Top Skills in Demand for 2026 Software Roles", slug: "top-skills-2026-software-roles", excerpt: "From LLM integration to platform engineering, here is what employers actually want right now, ranked by frequency in job posts.", category: "industry", tags: "skills,software,2026,trends", readMinutes: 11, coverEmoji: "📊" },
  { title: "Remote vs Hybrid vs Onsite: What Is Right for You?", slug: "remote-hybrid-onsite-comparison", excerpt: "Each work mode has tradeoffs. We break down compensation, career growth, culture, and lifestyle impacts.", category: "career", tags: "remote,hybrid,onsite,work", readMinutes: 7, coverEmoji: "🏠" },
  { title: "How to Use AI Tools to Tailor Your Resume", slug: "ai-tools-tailor-resume", excerpt: "AI resume optimizers are powerful but easy to misuse. Here is the correct workflow for AI-assisted resume tailoring.", category: "resume", tags: "ai,resume,tools", readMinutes: 6, coverEmoji: "🤖" },
  { title: "Software Hiring Report 2026", slug: "software-hiring-report-2026", excerpt: "Our analysis of 5,000+ software job listings: top companies, salary ranges, in-demand skills, and hiring velocity trends.", category: "industry", tags: "report,software,hiring,data", readMinutes: 15, coverEmoji: "📈" },
  { title: "Walk-in Interviews: Do They Still Work?", slug: "walk-in-interviews-still-work", excerpt: "Walk-in drives can be a shortcut or a trap. Here is when they are worth attending and what to expect.", category: "career", tags: "walk-in,interview,jobs", readMinutes: 5, coverEmoji: "🚶" },
]

async function main() {
  console.log("Seeding database...")
  
  await db.savedJob.deleteMany()
  await db.application.deleteMany()
  await db.job.deleteMany()
  await db.company.deleteMany()
  await db.article.deleteMany()
  await db.user.deleteMany()
  
  const demoUser = await db.user.create({
    data: {
      email: "demo@careernest.org",
      name: "Demo User",
      role: "candidate",
      headline: "Full-Stack Developer",
    },
  })
  
  const companyMap: Record<string, string> = {}
  for (const c of companies) {
    const created = await db.company.create({ data: c })
    companyMap[c.name] = created.id
  }
  console.log(`Created ${companies.length} companies`)
  
  for (const j of jobs) {
    const companyId = companyMap[j.company]
    if (!companyId) continue
    const companyData = companies.find((c) => c.name === j.company)
    await db.job.create({
      data: {
        title: j.title,
        companyId,
        category: j.category,
        employmentType: j.employmentType,
        workMode: j.workMode,
        experience: j.experience,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: "INR",
        location: j.location,
        skills: j.skills,
        description: j.description,
        applyUrl: companyData?.website ? `${companyData.website}/careers` : 'https://example.com/careers',
        postedAt: new Date(Date.now() - j.postedAtDaysAgo * 24 * 60 * 60 * 1000),
        isFeatured: Math.random() > 0.7,
        verified: true,
      },
    })
  }
  console.log(`Created ${jobs.length} jobs`)
  
  for (const a of articles) {
    await db.article.create({
      data: {
        ...a,
        content: `${a.excerpt}\n\nThis is an expanded version of the article content. In a production environment, this would contain the full article body written by the editorial team.\n\n## Key Takeaways\n\n- Insight one about ${a.title.toLowerCase()}\n- Practical tip for the reader\n- Common mistake to avoid\n- Recommended next step\n\nThe full editorial process ensures each piece is reviewed for accuracy, relevance, and actionable value for candidates navigating the modern job market.`,
        published: true,
      },
    })
  }
  console.log(`Created ${articles.length} articles`)
  
  const firstJobs = await db.job.findMany({ take: 3 })
  for (const job of firstJobs) {
    await db.savedJob.create({ data: { userId: demoUser.id, jobId: job.id } })
  }
  
  if (firstJobs[0]) {
    await db.application.create({
      data: {
        userId: demoUser.id,
        jobId: firstJobs[0].id,
        company: "Amazon",
        role: firstJobs[0].title,
        location: "Bengaluru",
        salary: "12 LPA",
        status: "interview",
        url: "https://example.com",
      },
    })
  }
  
  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
