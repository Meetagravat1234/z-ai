// Shared utilities for SEO-friendly routes.

/**
 * Convert a string to a URL-safe slug.
 * "Senior Software Engineer" → "senior-software-engineer"
 */
export function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric (keep spaces + hyphens)
    .replace(/\s+/g, '-')         // spaces → hyphens
    .replace(/-+/g, '-')          // collapse repeated hyphens
    .replace(/^-|-$/g, '')        // trim leading/trailing hyphen
}

/**
 * Build the canonical URL path for a job: /jobs/[id]-[title-slug]
 * We embed the job ID at the start so the server route can extract it
 * without a separate DB lookup by slug (no slug column needed).
 */
export function jobUrl(job: { id: string; title: string }): string {
  return `/jobs/${job.id}-${slugify(job.title)}`
}

/**
 * Extract the job ID from a slug-style path segment.
 * Input:  "cmabc123-senior-software-engineer"
 * Output: "cmabc123"
 * CUIDs are 24+ lowercase alphanumeric chars, so match greedily until the first hyphen.
 */
export function parseJobIdFromSlug(slug: string): string | null {
  if (!slug) return null
  // CUIDs start with "c" and are 24+ chars. But our job IDs might be other formats too.
  // Strategy: take everything before the first "-" as the ID.
  const dashIdx = slug.indexOf('-')
  if (dashIdx === -1) return slug // entire slug is the ID
  return slug.substring(0, dashIdx)
}

/** Canonical URL for a company. */
export function companyUrl(slug: string): string {
  return `/companies/${slug}`
}

/** Canonical URL for a city page. */
export function cityUrl(citySlug: string): string {
  return `/jobs/${citySlug}`
}

/** Canonical URL for a role page. */
export function roleUrl(roleSlug: string): string {
  return `/roles/${roleSlug}`
}

/** List of cities that get their own static landing page. */
export const CITY_PAGES: Array<{
  slug: string
  name: string
  state: string
  searchTerms: string[]
  description: string
}> = [
  {
    slug: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    searchTerms: ['Bengaluru', 'Bangalore'],
    description:
      'Bengaluru (Bangalore) is India\u2019s IT capital, home to 1.5 million tech professionals. Browse verified jobs across Whitefield, Electronic City, Koramangala, and Indiranagar at companies like Google, Microsoft, Amazon, Flipkart, and Swiggy.',
  },
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    searchTerms: ['Hyderabad', 'Hitech City', 'Gachibowli'],
    description:
      'Hyderabad is a top-tier tech hub with major campuses in HITEC City, Gachibowli, and Madhapur. Find verified openings at Microsoft, Google, Amazon, Meta, and leading Indian startups.',
  },
  {
    slug: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    searchTerms: ['Pune', 'Hinjewadi', 'Kharadi'],
    description:
      'Pune is a fast-growing IT destination with major tech parks in Hinjewadi (Rajiv Gandhi Infotech Park), Kharadi, and Magarpatta. Browse verified jobs at TCS, Infosys, Wipro, and product startups.',
  },
  {
    slug: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    searchTerms: ['Chennai', 'OMR', 'Guindy', 'Tidel Park'],
    description:
      'Chennai hosts major IT corridors along OMR (Old Mahabalipuram Road), Tidel Park, and DLF Cybercity. Find verified openings at Cognizant, TCS, Infosys, Zoho, and SaaS startups.',
  },
  {
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    searchTerms: ['Mumbai', 'Navi Mumbai', 'Andheri', 'BKC'],
    description:
      'Mumbai is India\u2019s financial capital with growing tech presence in BKC, Andheri East, and Navi Mumbai. Browse verified openings at fintech, media, and product companies.',
  },
  {
    slug: 'delhi-ncr',
    name: 'Delhi NCR',
    state: 'Delhi / NCR',
    searchTerms: ['Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'NCR'],
    description:
      'Delhi NCR (including Noida, Gurugram, and Greater Noida) hosts major tech and startup ecosystems. Find verified openings at Google, Microsoft, Paytm, Zomato, Swiggy, and SaaS startups.',
  },
  {
    slug: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    searchTerms: ['Kolkata', 'Salt Lake', 'New Town'],
    description:
      'Kolkata\u2019s tech corridor spans Salt Lake Sector V and New Town. Browse verified openings at TCS, Cognizant, Wipro, and emerging East India startups.',
  },
  {
    slug: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    searchTerms: ['Ahmedabad', 'Gandhinagar', 'GIFT City'],
    description:
      'Ahmedabad and nearby GIFT City (Gandhinagar) are emerging tech hubs. Find verified openings at fintech, SaaS, and product startups.',
  },
  {
    slug: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    searchTerms: ['Jaipur', 'Sitapura', 'Malviya Nagar'],
    description:
      'Jaipur\u2019s tech scene is growing in Sitapura Industrial Area and Malviya Nagar. Browse verified openings at product startups and IT services companies.',
  },
  {
    slug: 'chandigarh',
    name: 'Chandigarh',
    state: 'Punjab / Haryana',
    searchTerms: ['Chandigarh', 'Mohali', 'Panchkula', 'Rajiv Gandhi IT Park'],
    description:
      'Chandigarh (including Mohali and Panchkula) hosts IT parks like Rajiv Gandhi Technology Park. Find verified openings at product startups and IT services companies.',
  },
  {
    slug: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    searchTerms: ['Kochi', 'Kakkanad', 'Infopark'],
    description:
      'Kochi\u2019s Infopark in Kakkanad hosts major IT employers. Browse verified openings at TCS, Cognizant, Wipro, IBS Software, and SaaS startups.',
  },
  {
    slug: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    searchTerms: ['Coimbatore', 'Tidel Park', 'Saravanampatti'],
    description:
      'Coimbatore\u2019s tech corridor centers on Tidel Park and Saravanampatti. Find verified openings at product startups and IT services companies.',
  },
  {
    slug: 'remote',
    name: 'Remote (Work from Home)',
    state: 'India',
    searchTerms: ['Remote', 'Work from Home', 'WFH'],
    description:
      'Browse 100+ verified remote jobs you can do from anywhere in India. Includes full-time, contract, and freelance roles across software, data, design, marketing, and product.',
  },
]

/** List of role-specific landing pages. */
export const ROLE_PAGES: Array<{
  slug: string
  name: string
  keywords: string[]
  salaryRange: string
  description: string
  topSkills: string[]
}> = [
  {
    slug: 'software-engineer',
    name: 'Software Engineer',
    keywords: ['Software Engineer', 'SDE', 'Software Developer', 'Software Development Engineer'],
    salaryRange: '6 - 25 LPA',
    description:
      'Software Engineer roles in India span backend, frontend, and full-stack development. Entry-level SDE-I roles start around 6-12 LPA at services companies and 15-25 LPA at product companies. Senior SDE-II / SDE-III roles pay 25-60 LPA.',
    topSkills: ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'System Design', 'SQL'],
  },
  {
    slug: 'data-scientist',
    name: 'Data Scientist',
    keywords: ['Data Scientist', 'ML Engineer', 'Machine Learning'],
    salaryRange: '8 - 35 LPA',
    description:
      'Data Scientist roles involve statistical modeling, ML pipelines, and analytics. Entry-level roles start at 8-15 LPA; senior roles at top product companies pay 25-50 LPA. Skills: Python, SQL, scikit-learn, deep learning, statistics.',
    topSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'TensorFlow', 'AWS'],
  },
  {
    slug: 'product-manager',
    name: 'Product Manager',
    keywords: ['Product Manager', 'PM', 'Senior PM', 'Group PM'],
    salaryRange: '15 - 60 LPA',
    description:
      'Product Manager roles in India pay among the highest in tech. APM roles start at 15-20 LPA; senior PMs at product companies earn 35-60 LPA. Skills: stakeholder management, analytics, roadmapping, user research.',
    topSkills: ['Roadmapping', 'Analytics', 'SQL', 'User Research', 'A/B Testing', 'Stakeholder Management'],
  },
  {
    slug: 'full-stack-developer',
    name: 'Full Stack Developer',
    keywords: ['Full Stack', 'Full Stack Developer', 'MERN', 'MEAN'],
    salaryRange: '6 - 28 LPA',
    description:
      'Full Stack Developers handle both frontend (React, Vue, Angular) and backend (Node.js, Python, Java). Entry-level: 6-12 LPA. Mid-level: 12-20 LPA. Senior: 20-35 LPA.',
    topSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
  },
  {
    slug: 'frontend-developer',
    name: 'Frontend Developer',
    keywords: ['Frontend', 'Frontend Developer', 'UI Developer', 'React Developer'],
    salaryRange: '5 - 25 LPA',
    description:
      'Frontend Developer roles focus on React, Vue, or Angular. Entry-level: 5-10 LPA. Mid-level: 10-18 LPA. Senior: 18-30 LPA. Skills: JavaScript/TypeScript, React, CSS, accessibility, performance.',
    topSkills: ['React', 'TypeScript', 'CSS', 'Tailwind', 'Next.js', 'Accessibility'],
  },
  {
    slug: 'backend-developer',
    name: 'Backend Developer',
    keywords: ['Backend', 'Backend Developer', 'API Developer', 'Server-side Developer'],
    salaryRange: '6 - 30 LPA',
    description:
      'Backend Developer roles span Java, Python, Node.js, and Go. Entry-level: 6-12 LPA. Mid-level: 12-22 LPA. Senior: 22-40 LPA. Skills: REST/GraphQL APIs, databases, microservices, message queues.',
    topSkills: ['Java', 'Python', 'Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'Microservices'],
  },
  {
    slug: 'devops-engineer',
    name: 'DevOps Engineer',
    keywords: ['DevOps', 'SRE', 'Site Reliability Engineer', 'Platform Engineer'],
    salaryRange: '8 - 35 LPA',
    description:
      'DevOps Engineer roles focus on CI/CD, cloud infrastructure, and observability. Entry-level: 8-15 LPA. Mid-level: 15-25 LPA. Senior: 25-45 LPA. Skills: AWS/GCP/Azure, Kubernetes, Docker, Terraform, CI/CD.',
    topSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux', 'Prometheus'],
  },
  {
    slug: 'ui-ux-designer',
    name: 'UI/UX Designer',
    keywords: ['UI Designer', 'UX Designer', 'Product Designer', 'UI/UX'],
    salaryRange: '6 - 30 LPA',
    description:
      'UI/UX Designer (Product Designer) roles blend interaction design, visual design, and user research. Entry-level: 6-10 LPA. Mid-level: 10-18 LPA. Senior: 18-35 LPA. Skills: Figma, prototyping, design systems, user research.',
    topSkills: ['Figma', 'Prototyping', 'Design Systems', 'User Research', 'Wireframing', 'Accessibility'],
  },
  {
    slug: 'data-analyst',
    name: 'Data Analyst',
    keywords: ['Data Analyst', 'Business Analyst', 'Analytics', 'BI Analyst'],
    salaryRange: '5 - 20 LPA',
    description:
      'Data Analyst roles involve SQL, dashboards, and stakeholder reporting. Entry-level: 5-9 LPA. Mid-level: 9-15 LPA. Senior: 15-25 LPA. Skills: SQL, Python, Excel, Power BI / Tableau, statistics.',
    topSkills: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel', 'Statistics'],
  },
  {
    slug: 'qa-engineer',
    name: 'QA Engineer',
    keywords: ['QA', 'Quality Assurance', 'Test Engineer', 'SDET', 'Automation Engineer'],
    salaryRange: '5 - 22 LPA',
    description:
      'QA Engineer (and SDET - Software Development Engineer in Test) roles cover manual + automated testing. Entry-level: 5-9 LPA. Mid-level: 9-15 LPA. Senior SDET: 15-30 LPA. Skills: Selenium, Playwright, Cypress, API testing, CI integration.',
    topSkills: ['Selenium', 'Playwright', 'Cypress', 'API Testing', 'Python', 'Java'],
  },
  {
    slug: 'android-developer',
    name: 'Android Developer',
    keywords: ['Android', 'Android Developer', 'Kotlin Developer', 'Mobile Developer'],
    salaryRange: '6 - 28 LPA',
    description:
      'Android Developer roles span native Kotlin/Java and cross-platform (React Native, Flutter). Entry-level: 6-10 LPA. Mid-level: 10-18 LPA. Senior: 18-30 LPA. Skills: Kotlin, Jetpack Compose, Coroutines, MVVM, Gradle.',
    topSkills: ['Kotlin', 'Java', 'Jetpack Compose', 'Coroutines', 'MVVM', 'Android SDK'],
  },
  {
    slug: 'ios-developer',
    name: 'iOS Developer',
    keywords: ['iOS', 'iOS Developer', 'Swift Developer', 'iPhone Developer'],
    salaryRange: '7 - 30 LPA',
    description:
      'iOS Developer roles use Swift and SwiftUI (or older Objective-C). Entry-level: 7-12 LPA. Mid-level: 12-20 LPA. Senior: 20-35 LPA. Skills: Swift, SwiftUI, Combine, CoreData, Xcode, App Store submission.',
    topSkills: ['Swift', 'SwiftUI', 'Combine', 'CoreData', 'Xcode', 'UIKit'],
  },
  {
    slug: 'cloud-engineer',
    name: 'Cloud Engineer',
    keywords: ['Cloud Engineer', 'AWS Engineer', 'Azure Engineer', 'GCP Engineer', 'Cloud Architect'],
    salaryRange: '8 - 35 LPA',
    description:
      'Cloud Engineer roles focus on AWS, Azure, or GCP infrastructure. Entry-level: 8-14 LPA. Mid-level: 14-22 LPA. Senior/Architect: 22-45 LPA. Skills: IaC (Terraform/CloudFormation), networking, security, containerization.',
    topSkills: ['AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes', 'Networking', 'Linux'],
  },
  {
    slug: 'security-engineer',
    name: 'Security Engineer',
    keywords: ['Security Engineer', 'Cybersecurity', 'AppSec', 'DevSecOps', 'Pentester'],
    salaryRange: '10 - 40 LPA',
    description:
      'Security Engineer roles cover AppSec, DevSecOps, and penetration testing. Entry-level: 10-15 LPA. Mid-level: 15-25 LPA. Senior: 25-50 LPA. Skills: OWASP, security testing, Python, SIEM, threat modeling.',
    topSkills: ['OWASP', 'Python', 'Burp Suite', 'Threat Modeling', 'SIEM', 'Network Security'],
  },
  {
    slug: 'marketing-manager',
    name: 'Marketing Manager',
    keywords: ['Marketing Manager', 'Growth Manager', 'Digital Marketing', 'Performance Marketing'],
    salaryRange: '6 - 25 LPA',
    description:
      'Marketing Manager roles span growth, performance, content, and brand. Entry-level: 6-10 LPA. Mid-level: 10-18 LPA. Senior: 18-35 LPA. Skills: SEO, paid ads (Meta/Google), analytics, content strategy, lifecycle marketing.',
    topSkills: ['SEO', 'Google Ads', 'Meta Ads', 'Analytics', 'Content Strategy', 'Email Marketing'],
  },
]
