/**
 * Resume Templates Configuration — Phase 3 (Properly Designed)
 *
 * Each template now has:
 *   - Unique SECTIONS (not all templates have the same sections)
 *   - Demo resume content (shown in the gallery as a FULL preview)
 *   - AI prompt modifier (tells AI which sections to generate)
 *   - Placeholder instructions (for sections where user's resume has no data)
 *
 * Research basis: Analyzed Canva, Novoresume, Zety, Resume.io templates.
 * Different roles need different sections:
 *   - Software Engineer → Projects + Technical Skills
 *   - Designer → Portfolio + Selected Work
 *   - Executive → Core Competencies + Awards + Board Memberships
 *   - Academic → Publications + Research Interests + Teaching
 *   - Fresher → Objective + Internships + Academic Projects
 *
 * For sections where the user's resume has NO data, the AI is instructed
 * to either skip the section OR add placeholder text like "[Add your certifications]"
 * so the user knows to fill it in.
 *
 * Common sections (like Personal Attributes) get example content if the
 * user's resume doesn't mention them — e.g. "Quick learner, team player,
 * ability to work effectively under pressure".
 */

export interface ResumeSection {
  /** Section slug — used in AI prompt + renderer */
  id: string
  /** Display name for the section heading */
  heading: string
  /** Whether this section is required (always shown, even if empty) */
  required: boolean
  /** Placeholder text shown if user's resume has no data for this section */
  placeholder?: string
  /** Example content shown in the demo preview */
  demoContent: string
}

export interface ResumeTemplate {
  slug: string
  name: string
  description: string
  emoji: string
  /** Gradient colors for the card header strip */
  previewGradient: string
  category: 'tech' | 'creative' | 'executive' | 'academic' | 'compact' | 'ats'
  layout: 'single-column' | 'two-column' | 'compact' | 'ats-plain'
  accentColor: string
  fontFamily: string
  sortOrder: number
  /** UNIQUE sections for this template — different templates have different sections */
  sections: ResumeSection[]
  /** Additional instructions for the AI when generating this template */
  aiPromptModifier: string
  /** Whether this template is free (no Pro required). Default: false (Pro-only). */
  isFree?: boolean
}

// ============================================================================
// DEMO RESUME CONTENT — used in the template gallery previews
// This is a complete sample resume shown so users can see how the template looks
// ============================================================================
const DEMO_NAME = 'Aarav Sharma'
const DEMO_TITLE = 'Senior Software Engineer'
const DEMO_CONTACT = 'aarav.sharma@email.com · +91 98765 43210 · Bengaluru, India · linkedin.com/in/aaravsharma'

// ============================================================================
// THE 10 TEMPLATES — each with unique sections
// ============================================================================
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  // 1. Modern Minimalist — Software Engineer
  {
    slug: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean, single-column. Best for software engineers.',
    emoji: '📄',
    previewGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    category: 'tech',
    layout: 'single-column',
    accentColor: '#6366f1',
    fontFamily: "'Inter', system-ui, sans-serif",
    sortOrder: 1,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + DEMO_CONTACT },
      { id: 'summary', heading: 'Professional Summary', required: true, placeholder: '[Add a 2-sentence summary of your experience and what you\'re looking for]', demoContent: 'Results-driven Software Engineer with 6+ years of experience building scalable web applications. Proven track record of leading teams and delivering high-quality software on time.' },
      { id: 'technical-skills', heading: 'Technical Skills', required: true, placeholder: '[List your technical skills: Languages, Frameworks, Tools]', demoContent: 'Languages: Python, JavaScript, TypeScript, Go\nFrameworks: React, Node.js, Django, FastAPI\nCloud: AWS (EC2, S3, Lambda), Docker, Kubernetes\nDatabases: PostgreSQL, MongoDB, Redis' },
      { id: 'experience', heading: 'Professional Experience', required: true, placeholder: '[Add your work experience — Job Title | Company | Dates | Bullets]', demoContent: 'Senior Software Engineer | Google | Bengaluru | 2022–Present\n• Led migration of monolith to microservices, reducing deploy time by 60%\n• Built real-time analytics dashboard handling 1M+ events/day\n• Mentored 4 junior engineers\n\nSoftware Engineer | Microsoft | Hyderabad | 2020–2022\n• Developed RESTful APIs serving 500K+ daily requests\n• Reduced API latency by 40% through query optimization' },
      { id: 'projects', heading: 'Notable Projects', required: false, placeholder: '[Add 1-2 notable projects you\'ve built]', demoContent: 'Open Source Contributer — github.com/aaravsharma\n• Built a popular npm package (10K+ weekly downloads)\n• Contributed to 15+ open source projects' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add your education — Degree | College | Year]', demoContent: 'B.Tech in Computer Science | IIT Delhi | 2016–2020\nGPA: 8.7/10' },
    ],
    aiPromptModifier: `Sections to include: Professional Summary, Technical Skills, Professional Experience, Notable Projects (if mentioned in resume), Education.
If the user's resume doesn't have project info, skip the Projects section entirely.
Technical Skills should be categorized: Languages, Frameworks, Cloud, Databases.`,
    isFree: true,  // Modern Minimalist — free for all users
  },

  // 2. Tech Forward — Developer/DevOps
  {
    slug: 'tech-forward',
    name: 'Tech Forward',
    description: 'Two-column with skills sidebar. Best for developers & DevOps.',
    emoji: '💻',
    previewGradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    category: 'tech',
    layout: 'two-column',
    accentColor: '#10b981',
    fontFamily: "'JetBrains Mono', 'Inter', monospace",
    sortOrder: 2,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + DEMO_TITLE + '\n' + DEMO_CONTACT },
      { id: 'about', heading: 'About', required: true, placeholder: '[Add a 1-sentence intro about yourself]', demoContent: 'Backend-focused engineer passionate about distributed systems and open source.' },
      { id: 'tech-stack', heading: 'Tech Stack', required: true, placeholder: '[Add your tech stack: Languages, Frameworks, Tools]', demoContent: 'Python, Go, TypeScript\nDjango, FastAPI, React\nPostgreSQL, Redis, Kafka\nAWS, Docker, K8s, Terraform' },
      { id: 'experience', heading: 'Experience', required: true, placeholder: '[Add your work experience]', demoContent: 'Google — Senior SWE (2022–Now)\n• Built payment system handling 1M+ txns/day\n• Reduced P99 latency by 50%\n\nMicrosoft — SWE (2020–2022)\n• Developed event-driven microservices\n• Led migration to Kubernetes' },
      { id: 'projects', heading: 'Open Source & Projects', required: false, placeholder: '[Add your open source contributions or side projects]', demoContent: 'github.com/aaravsharma — 2K+ stars\n• fastapi-utils (500⭐): Utility decorators for FastAPI\n• kafka-lag-monitor: Monitor consumer lag in real-time' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add your education]', demoContent: 'B.Tech CS, IIT Delhi (2020)' },
    ],
    aiPromptModifier: `Format as TWO-COLUMN resume. Main column: About, Experience, Education. Sidebar (right): Tech Stack, Open Source & Projects.
Tech Stack should be a comma-separated list of skills (max 20 items).
If no open source contributions, show "[Add your GitHub/projects here]" placeholder.`,
  },

  // 3. Executive Classic — Senior Manager
  {
    slug: 'executive-classic',
    name: 'Executive Classic',
    description: 'Serif fonts, traditional layout. Best for senior roles & managers.',
    emoji: '🎯',
    previewGradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    category: 'executive',
    layout: 'single-column',
    accentColor: '#1e293b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    sortOrder: 3,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + DEMO_TITLE + '\n' + DEMO_CONTACT },
      { id: 'executive-summary', heading: 'Executive Summary', required: true, placeholder: '[Add a 3-4 sentence executive summary highlighting your leadership experience]', demoContent: 'Visionary technology leader with 12+ years of experience scaling engineering teams from 10 to 100+ engineers. Proven track record of delivering enterprise products worth $50M+ ARR. Adept at aligning technical strategy with business goals.' },
      { id: 'core-competencies', heading: 'Core Competencies', required: true, placeholder: '[Add your core competencies — leadership, strategy, technical areas]', demoContent: 'Engineering Leadership | Strategic Planning | Team Building (0→100+)| Product Strategy | Stakeholder Management | Budget Planning ($10M+) | Cross-functional Collaboration | Technical Architecture' },
      { id: 'experience', heading: 'Professional Experience', required: true, placeholder: '[Add your leadership roles — Title | Company | Team Size | Budget | Bullets]', demoContent: 'Director of Engineering | Stripe | Bengaluru | 2020–Present\n• Led 80+ engineers across 6 teams (Payments, Risk, Infra)\n• Managed $8M annual engineering budget\n• Drove 99.99% uptime for payment systems\n\nSenior Engineering Manager | Google | 2016–2020\n• Scaled team from 15 to 50 engineers\n• Launched 3 major products generating $20M+ revenue' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add your education + any executive education]', demoContent: 'B.Tech in Computer Science, IIT Bombay (2012)\nExecutive Education: Leadership in Tech, Stanford GSB (2019)' },
      { id: 'awards', heading: 'Awards & Recognition', required: false, placeholder: '[Add awards, patents, or industry recognition]', demoContent: '• TechCrunch Disrupt Winner (2018)\n• 3 US Patents in distributed systems\n• Speaker at AWS re:Invent 2022' },
    ],
    aiPromptModifier: `Format as EXECUTIVE resume with serif tone. Sections: Executive Summary, Core Competencies, Professional Experience, Education, Awards & Recognition (if any).
Use formal language. Emphasize leadership metrics: team size, budget, revenue impact.
Core Competencies should be a single comma-separated line.
If no awards, skip that section entirely.`,
  },

  // 4. Creative Bold — Designer/Marketer
  {
    slug: 'creative-bold',
    name: 'Creative Bold',
    description: 'Color accents, modern typography. Best for designers & marketers.',
    emoji: '🎨',
    previewGradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    category: 'creative',
    layout: 'two-column',
    accentColor: '#f59e0b',
    fontFamily: "'Inter', system-ui, sans-serif",
    sortOrder: 4,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + 'Product Designer' + '\n' + DEMO_CONTACT },
      { id: 'highlights', heading: 'Highlights', required: true, placeholder: '[Add 3-4 key achievements as bullets]', demoContent: '• 5+ years designing B2B SaaS products used by 100K+ users\n• Led redesign that increased conversion by 35%\n• Speaker at Config 2023 (Figma conference)\n• Featured in Awwwards 3 times' },
      { id: 'about', heading: 'About Me', required: true, placeholder: '[Add a 2-3 sentence creative bio]', demoContent: 'Designer who codes. I bridge the gap between pixels and products — turning complex problems into delightful experiences. Previously at Figma, now freelancing.' },
      { id: 'selected-work', heading: 'Selected Work', required: true, placeholder: '[Add 2-3 notable projects with impact metrics]', demoContent: 'Redesign at Razorpay (2023)\n• Led end-to-end redesign of checkout flow\n• Increased conversion rate by 35%\n• Reduced drop-off by 22%\n\nDesign System at PhonePe (2022)\n• Built component library used by 40+ designers\n• Reduced design-to-dev handoff time by 60%' },
      { id: 'experience', heading: 'Experience', required: true, placeholder: '[Add your roles — Title | Company | Dates | Impact]', demoContent: 'Senior Designer | Razorpay | 2022–Present\nProduct Designer | PhonePe | 2020–2022\nUI Designer | Freshworks | 2019–2020' },
      { id: 'skills', heading: 'Skills & Tools', required: true, placeholder: '[Add your design skills + tools]', demoContent: 'Figma, Framer, Webflow, Sketch\nPrototyping, User Research, Design Systems\nHTML/CSS, React (basic)\nMotion design (After Effects)' },
      { id: 'education', heading: 'Education', required: false, placeholder: '[Add your education or relevant courses]', demoContent: 'B.Des, NID Ahmedabad (2019)' },
    ],
    aiPromptModifier: `Format as CREATIVE resume with personality. Sections: Highlights (3-4 bullets), About Me (conversational), Selected Work, Experience, Skills & Tools, Education.
Use engaging language. For Selected Work, include quantified impact (%, numbers).
Skills should be comma-separated with tools listed.
If no formal education, skip Education section.`,
  },

  // 5. Compact Professional — Fresher/Entry-level
  {
    slug: 'compact-professional',
    name: 'Compact Professional',
    description: 'Dense layout, fits 1 page. Best for freshers & entry-level.',
    emoji: '📦',
    previewGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    category: 'compact',
    layout: 'compact',
    accentColor: '#3b82f6',
    fontFamily: "'Inter', system-ui, sans-serif",
    sortOrder: 5,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + 'Fresher — Computer Science' + '\n' + DEMO_CONTACT },
      { id: 'objective', heading: 'Career Objective', required: true, placeholder: '[Add a 1-2 sentence career objective]', demoContent: 'Motivated Computer Science graduate seeking a Software Engineer role to apply my skills in Python, React, and AWS to build impactful products.' },
      { id: 'skills', heading: 'Skills', required: true, placeholder: '[List your skills: Languages, Frameworks, Tools]', demoContent: 'Python, JavaScript, React, Node.js, SQL, Git, AWS, Docker' },
      { id: 'internships', heading: 'Internships', required: false, placeholder: '[Add any internships — Role | Company | Duration | What you did]', demoContent: 'SDE Intern | Amazon | Summer 2025\n• Built internal tool used by 50+ engineers\n• Automated deployment pipeline\n\nWeb Dev Intern | Startup | Summer 2024\n• Built company website with React/Next.js' },
      { id: 'projects', heading: 'Academic Projects', required: true, placeholder: '[Add 2-3 projects you built — Name, Tech, What it does]', demoContent: 'E-Commerce Platform (Final Year Project)\n• Built full-stack app with React + Django + PostgreSQL\n• Implemented payment gateway, search, and reviews\n\nML Sentiment Analyzer\n• Trained model on 50K+ reviews\n• Achieved 92% accuracy' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add your education — Degree | College | Year | GPA]', demoContent: 'B.Tech in Computer Science | VIT Vellore | 2022–2026\nCGPA: 8.9/10' },
      { id: 'achievements', heading: 'Achievements', required: false, placeholder: '[Add achievements: hackathons, awards, certifications]', demoContent: '• Winner, Smart India Hackathon 2024\n• AWS Certified Developer — Associate\n• LeetCode rating: 1850+ (Top 5%)' },
    ],
    aiPromptModifier: `Format as COMPACT resume that fits on 1 page. Sections: Career Objective, Skills, Internships (if any), Academic Projects, Education, Achievements (if any).
Be very concise — max 3 bullets per item.
If no internships, skip that section but keep Projects.
For freshers, emphasize projects and academic achievements.`,
  },

  // 6. Academic Style — Researcher/PhD
  {
    slug: 'academic-style',
    name: 'Academic Style',
    description: 'Numbered sections, citation format. Best for researchers & PhDs.',
    emoji: '🎓',
    previewGradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    category: 'academic',
    layout: 'single-column',
    accentColor: '#7c3aed',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    sortOrder: 6,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + 'Research Scientist — Machine Learning' + '\n' + DEMO_CONTACT + ' · Google Scholar: scholar.google.com/aaravsharma' },
      { id: 'research-interests', heading: 'Research Interests', required: true, placeholder: '[Add your research interests — 3-5 areas]', demoContent: 'Large Language Models, Computer Vision, Reinforcement Learning, AI Safety, Interpretable ML' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add education in reverse chronological — Degree | Institution | Year | Thesis]', demoContent: 'Ph.D. in Computer Science | Stanford University | 2023\nDissertation: "Efficient Training of LLMs on Consumer Hardware"\nAdvisor: Prof. Christopher Manning\n\nB.Tech in CS | IIT Bombay | 2018' },
      { id: 'publications', heading: 'Publications', required: true, placeholder: '[Add your publications in citation format]', demoContent: '[1] Sharma, A. et al. (2024). "Scaling Laws for Efficient LLM Training." NeurIPS 2024.\n[2] Sharma, A. & Manning, C. (2023). "Interpreting Attention in Transformers." ACL 2023.\n[3] Sharma, A. et al. (2022). "Few-Shot Learning with Vision-Language Models." ICML 2022.' },
      { id: 'research-experience', heading: 'Research Experience', required: true, placeholder: '[Add research positions — Role | Lab | Duration | Work]', demoContent: 'Research Scientist | Google DeepMind | 2023–Present\n• Leading LLM efficiency research\n• Published 3 papers at top-tier venues\n\nResearch Intern | Meta AI | Summer 2022\n• Worked on vision-language models\n• Co-authored 1 paper' },
      { id: 'teaching', heading: 'Teaching Experience', required: false, placeholder: '[Add teaching assistant roles]', demoContent: 'TA for CS224N (NLP) | Stanford | Winter 2023\nTA for CS231N (CV) | Stanford | Spring 2022' },
      { id: 'awards', heading: 'Awards & Honors', required: false, placeholder: '[Add academic awards, fellowships, grants]', demoContent: '• Stanford Graduate Fellowship (2018–2023)\n• Best Paper Award, ACL 2023\n• Google PhD Fellowship in NLP' },
    ],
    aiPromptModifier: `Format as ACADEMIC CV with numbered sections. Use citation format for publications.
Sections: Research Interests, Education, Publications, Research Experience, Teaching (if any), Awards (if any).
Publications format: [1] Author, A. et al. (Year). "Title." Venue.
If no publications, show "[Add your publications here]".
If no teaching experience, skip that section.`,
  },

  // 7. Startup Friendly — Startup applicant
  {
    slug: 'startup-friendly',
    name: 'Startup Friendly',
    description: 'Casual-modern, personality-focused. Best for startup applicants.',
    emoji: '🚀',
    previewGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    category: 'creative',
    layout: 'two-column',
    accentColor: '#ec4899',
    fontFamily: "'Inter', system-ui, sans-serif",
    sortOrder: 7,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + 'Full-Stack Engineer 🚀' + '\n' + DEMO_CONTACT },
      { id: 'about', heading: 'About Me', required: true, placeholder: '[Add a 2-3 sentence casual bio]', demoContent: 'Builder at heart. I\'ve shipped 5 products in 3 years — 2 failed, 1 acquired, 2 still running. I love 0→1 work, hate meetings, and code in Go + React.' },
      { id: 'what-i-do', heading: 'What I Do', required: true, placeholder: '[Add 3-4 things you\'re great at]', demoContent: '🛠 Build MVPs in weeks, not months\n📊 Turn data into product decisions\n🤝 Work directly with founders\n🚢 Ship daily, iterate fast' },
      { id: 'experience', heading: 'Experience', required: true, placeholder: '[Add your roles — keep it punchy]', demoContent: 'Founding Engineer | Razorpay (2023–Now)\n• Built payments infra from scratch\n• Hired and trained 8 engineers\n• 0→1 on 3 major features\n\nFull-Stack Dev | CRED (2021–2023)\n• Shipped member rewards feature\n• 2M+ users in 6 months' },
      { id: 'side-projects', heading: 'Side Projects', required: false, placeholder: '[Add your side hustles / weekend projects]', demoContent: '🔥 shipfast.dev — boilerplate for SaaS founders (500+ users)\n💰 indiehacker earning $2K/mo\n📱 3 apps on App Store' },
      { id: 'skills', heading: 'Skills', required: true, placeholder: '[Add your skills — keep it real]', demoContent: '💻 Go, TypeScript, Python\n🛠 React, Next.js, Postgres\n☁️ AWS, Vercel, Supabase\n🔧 Docker, Git, CI/CD' },
      { id: 'education', heading: 'Education', required: false, placeholder: '[Add education — or skip if not relevant]', demoContent: 'B.Tech CS, BITS Pilani (2021)\n— but I learned more on GitHub 😄' },
    ],
    aiPromptModifier: `Format as STARTUP-friendly resume. Casual tone, emoji-friendly section names.
Sections: About Me (conversational), What I Do (3-4 punchy bullets), Experience, Side Projects (if any), Skills (with emoji prefixes), Education.
Use confident but humble tone. Show personality.
If no side projects, skip that section.`,
  },

  // 8. Corporate Traditional — Bank/Govt
  {
    slug: 'corporate-traditional',
    name: 'Corporate Traditional',
    description: 'Conservative, structured. Best for bank/finance/govt jobs.',
    emoji: '🏦',
    previewGradient: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
    category: 'executive',
    layout: 'single-column',
    accentColor: '#0f766e',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    sortOrder: 8,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + 'Chartered Accountant' + '\n' + DEMO_CONTACT },
      { id: 'profile', heading: 'Professional Profile', required: true, placeholder: '[Add a 2-3 sentence formal profile]', demoContent: 'Qualified Chartered Accountant with 8 years of experience in financial auditing, taxation, and compliance. Proven expertise in handling audits for listed companies with turnover exceeding ₹500 crores.' },
      { id: 'key-qualifications', heading: 'Key Qualifications', required: true, placeholder: '[Add your qualifications — certifications, memberships, licenses]', demoContent: '• Chartered Accountant (ICAI, 2016) — Rank 15\n• Company Secretary (Executive Level)\n• Certified Internal Auditor (CIA)\n• Member: ICAI, IIA India' },
      { id: 'experience', heading: 'Professional Experience', required: true, placeholder: '[Add your roles — Title | Organisation | Duration | Responsibilities]', demoContent: 'Senior Audit Manager | Deloitte India | Mumbai | 2020–Present\n• Led audit teams for 15+ listed companies\n• Handled statutory audits with turnover ₹100–500Cr\n• Reviewed quarterly compliance for SEBI filings\n\nAudit Associate | EY India | 2016–2020\n• Conducted internal audits for banks and NBFCs\n• Prepared tax audit reports u/s 44AB' },
      { id: 'education', heading: 'Academic Qualifications', required: true, placeholder: '[Add your education — Degree | Institution | Year | Score]', demoContent: 'Chartered Accountancy | ICAI | 2016 (Rank 15)\nB.Com (Hons) | Shri Ram College of Commerce | 2013\nScore: 78%' },
      { id: 'certifications', heading: 'Certifications', required: false, placeholder: '[Add professional certifications]', demoContent: '• Diploma in Information Systems Audit (DISA)\n• Certificate Course on GST (ICAI)\n• Forensic Accounting & Fraud Detection (ICAI)' },
      { id: 'languages', heading: 'Languages', required: false, placeholder: '[Add languages you speak]', demoContent: 'English (Fluent), Hindi (Native), Marathi (Conversational)' },
    ],
    aiPromptModifier: `Format as CONSERVATIVE corporate resume. Formal language, no contractions.
Sections: Professional Profile, Key Qualifications, Professional Experience, Academic Qualifications, Certifications (if any), Languages (if any).
Use Indian context (₹ for amounts, Indian institutions).
If no certifications, skip that section.`,
  },

  // 9. ATS Maximum — ATS-optimized
  {
    slug: 'ats-maximum',
    name: 'ATS Maximum',
    description: 'Plain text, max keyword density. Best for ATS-heavy applications.',
    emoji: '⚡',
    previewGradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
    category: 'ats',
    layout: 'ats-plain',
    accentColor: '#f97316',
    fontFamily: "'Inter', 'Arial', sans-serif",
    sortOrder: 9,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + DEMO_TITLE + '\n' + DEMO_CONTACT },
      { id: 'summary', heading: 'Professional Summary', required: true, placeholder: '[Add a 2-sentence summary using keywords from the job description]', demoContent: 'Senior Software Engineer with 6+ years of experience in Python, React, and AWS. Proven expertise in building scalable microservices, CI/CD pipelines, and distributed systems.' },
      { id: 'core-competencies', heading: 'Core Competencies', required: true, placeholder: '[Add comma-separated keywords — mirror the job description]', demoContent: 'Python, JavaScript, TypeScript, React, Node.js, Django, FastAPI, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, Redis, CI/CD, Microservices, REST APIs, GraphQL, Terraform, Linux, Git' },
      { id: 'technical-skills', heading: 'Technical Skills', required: true, placeholder: '[Categorize your technical skills]', demoContent: 'Programming Languages: Python, JavaScript, TypeScript, Go, Java\nWeb Frameworks: React, Node.js, Django, FastAPI, Express\nCloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, Terraform, Jenkins\nDatabases: PostgreSQL, MongoDB, MySQL, Redis, DynamoDB\nTools: Git, JIRA, Linux, Bash, REST APIs, GraphQL' },
      { id: 'experience', heading: 'Professional Experience', required: true, placeholder: '[Add experience — each bullet should contain keywords from the JD]', demoContent: 'Senior Software Engineer | Google | Bengaluru | 2022–Present\n• Developed Python-based microservices handling 1M+ daily requests on AWS\n• Built React frontend dashboard with real-time data visualization\n• Implemented CI/CD pipeline using Jenkins, Docker, and Kubernetes\n• Optimized PostgreSQL queries reducing latency by 40%\n\nSoftware Engineer | Microsoft | Hyderabad | 2020–2022\n• Built RESTful APIs using Node.js, Express, and MongoDB\n• Deployed services on AWS using Docker and Terraform\n• Wrote unit tests using Jest with 90% code coverage' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add education — Degree | Institution | Year]', demoContent: 'B.Tech in Computer Science | IIT Delhi | 2016–2020' },
      { id: 'certifications', heading: 'Certifications', required: false, placeholder: '[Add relevant certifications]', demoContent: 'AWS Certified Solutions Architect — Associate (2023)\nCertified Kubernetes Administrator (CKA) — 2022' },
    ],
    aiPromptModifier: `Format as ATS-MAXIMUM resume. Plain Markdown, no fancy formatting.
CRITICAL: Mirror the EXACT keywords from the job description.
- If JD says "Python 3", write "Python 3" not just "Python"
- If JD says "microservices architecture", use that exact phrase
- Each experience bullet MUST contain at least 1 keyword from the JD
Sections: Professional Summary (keyword-rich), Core Competencies (comma-separated keywords from JD), Technical Skills (categorized), Professional Experience, Education, Certifications (if any).
No tables, no columns, no images. Maximum keyword density without keyword stuffing.`,
    isFree: true,  // ATS Maximum — free for all users (most basic)
  },

  // 10. Hybrid Modern — Most roles
  {
    slug: 'hybrid-modern',
    name: 'Hybrid Modern',
    description: 'Two-column, ATS-friendly. Best for most roles.',
    emoji: '🔄',
    previewGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    category: 'tech',
    layout: 'two-column',
    accentColor: '#06b6d4',
    fontFamily: "'Inter', system-ui, sans-serif",
    sortOrder: 10,
    sections: [
      { id: 'header', heading: '', required: true, demoContent: DEMO_NAME + '\n' + DEMO_TITLE + '\n' + DEMO_CONTACT },
      { id: 'summary', heading: 'Professional Summary', required: true, placeholder: '[Add a 2-sentence summary of your experience]', demoContent: 'Software Engineer with 6+ years of experience building scalable web applications. Specialized in Python, React, and AWS with a track record of delivering high-impact products.' },
      { id: 'experience', heading: 'Professional Experience', required: true, placeholder: '[Add your work experience]', demoContent: 'Senior Software Engineer | Google | Bengaluru | 2022–Present\n• Built microservices handling 1M+ daily requests\n• Reduced API latency by 40%\n• Mentored 4 junior engineers\n\nSoftware Engineer | Microsoft | 2020–2022\n• Developed RESTful APIs in Python and Node.js\n• Deployed on AWS with Docker + Kubernetes' },
      { id: 'education', heading: 'Education', required: true, placeholder: '[Add your education]', demoContent: 'B.Tech in Computer Science | IIT Delhi | 2020\nGPA: 8.7/10' },
      { id: 'skills', heading: 'Core Skills', required: true, placeholder: '[Add your core skills]', demoContent: 'Python, JavaScript, TypeScript, React, Node.js, Django, FastAPI, PostgreSQL, MongoDB, AWS, Docker, Kubernetes' },
      { id: 'tools', heading: 'Tools & Platforms', required: false, placeholder: '[Add tools you use]', demoContent: 'Git, JIRA, Jenkins, Linux, VS Code, Postman, Datadog' },
      { id: 'certifications', heading: 'Certifications', required: false, placeholder: '[Add certifications if any]', demoContent: 'AWS Solutions Architect Associate (2023)\nKubernetes Administrator (CKA)' },
      { id: 'languages', heading: 'Languages', required: false, placeholder: '[Add languages you speak]', demoContent: 'English (Fluent), Hindi (Native), Kannada (Conversational)' },
    ],
    aiPromptModifier: `Format as HYBRID resume (two-column but ATS-readable).
Main column (left): Professional Summary, Professional Experience, Education.
Sidebar (right): Core Skills, Tools & Platforms, Certifications, Languages.
Use standard bullet points. Keep sidebar concise (max 15 items per section).
If user has no certifications or languages, show "[Add your certifications]" or "[Add languages you speak]" placeholder.`,
  },
]

/**
 * Get a template by slug. Returns undefined if not found.
 */
export function getTemplate(slug: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.slug === slug)
}

/**
 * Get the default template.
 */
export function getDefaultTemplate(): ResumeTemplate {
  return RESUME_TEMPLATES[0]
}

/**
 * Check if a slug is a valid template.
 */
export function isValidTemplate(slug: string): boolean {
  return RESUME_TEMPLATES.some((t) => t.slug === slug)
}
