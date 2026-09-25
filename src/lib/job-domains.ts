/**
 * Job Domain Categories — classifies jobs by technical domain.
 *
 * Research basis: Analyzed 1,275 jobs in the DB. Top skills are:
 *   JavaScript, Python, Java, React, SQL, CSS, HTML, Flutter, Docker, etc.
 *   Job titles: iOS Developer, Android Developer, Python Developer, ML Intern, etc.
 *
 * Each domain has keyword matching rules — a job's title + skills are checked
 * against these keywords. First match wins (order matters — more specific
 * domains like VLSI/Embedded are checked before general ones like Software).
 *
 * Domains are SEO-friendly slugs for /jobs/[domain] pages.
 */

export interface JobDomain {
  slug: string           // URL slug: 'ai-ml', 'vlsi-embedded'
  name: string           // Display name: 'AI & Machine Learning'
  emoji: string          // Visual icon for cards
  description: string    // 1-line description for category page
  keywords: string[]     // Keywords to match against title + skills (lowercase)
  color: string          // Accent color for cards/headers
}

// Order matters — more specific domains checked FIRST
export const JOB_DOMAINS: JobDomain[] = [
  {
    slug: 'vlsi-embedded',
    name: 'VLSI & Embedded Systems',
    emoji: '🔧',
    description: 'Embedded firmware, VLSI design, ARM, ESP32, FPGA, IoT hardware',
    keywords: ['embedded', 'vlsi', 'firmware', 'arm', 'esp32', 'fpga', 'microcontroller', 'rtos', 'iot', 'hardware', 'verilog', 'vhdl', 'lpc', 'stm32', 'avr', 'arduino', 'raspberry pi', 'sensor', 'adc', 'gpio', 'uart', 'spi', 'i2c', 'can bus'],
    color: '#0f766e',
  },
  {
    slug: 'ai-ml',
    name: 'AI & Machine Learning',
    emoji: '🤖',
    description: 'Machine learning, deep learning, NLP, computer vision, AI research',
    keywords: ['machine learning', 'ml', 'deep learning', 'neural network', 'tensorflow', 'pytorch', 'nlp', 'natural language', 'computer vision', 'ai', 'artificial intelligence', 'data science', 'llm', 'gpt', 'transformer', 'model training', 'mlops', 'hugging face', 'langchain', 'rag'],
    color: '#7c3aed',
  },
  {
    slug: 'data-science',
    name: 'Data Science & Analytics',
    emoji: '📊',
    description: 'Data analysis, business intelligence, SQL, Tableau, Power BI',
    keywords: ['data analyst', 'data science', 'data engineer', 'business intelligence', 'bi ', 'tableau', 'power bi', 'sql', 'etl', 'data warehouse', 'pandas', 'numpy', 'statistics', 'analytics', 'big data', 'spark', 'hadoop', 'kafka', 'airflow'],
    color: '#3b82f6',
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    emoji: '🌐',
    description: 'Frontend, backend, full-stack — React, Node.js, Python, Java',
    keywords: ['web developer', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack', 'react', 'angular', 'vue', 'next.js', 'node', 'express', 'django', 'flask', 'php', 'laravel', 'wordpress', 'html', 'css', 'javascript', 'typescript', 'web development'],
    color: '#10b981',
  },
  {
    slug: 'mobile-development',
    name: 'Mobile Development',
    emoji: '📱',
    description: 'iOS, Android, Flutter, React Native, cross-platform apps',
    keywords: ['ios', 'android', 'flutter', 'react native', 'kotlin', 'swift', 'mobile', 'dart', 'xcode', 'mobile development', 'cross-platform'],
    color: '#f59e0b',
  },
  {
    slug: 'devops-cloud',
    name: 'DevOps & Cloud',
    emoji: '☁️',
    description: 'AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Terraform',
    keywords: ['devops', 'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'ci/cd', 'ci cd', 'ansible', 'prometheus', 'grafana', 'site reliability', 'sre', 'cloud engineer', 'infrastructure'],
    color: '#06b6d4',
  },
  {
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    emoji: '🔒',
    description: 'Security engineering, penetration testing, SOC, compliance',
    keywords: ['security', 'cybersecurity', 'penetration', 'pentest', 'soc', 'siem', 'compliance', 'iso 27001', 'cissp', 'ethical hacking', 'vulnerability', 'encryption', 'firewall'],
    color: '#dc2626',
  },
  {
    slug: 'qa-testing',
    name: 'QA & Testing',
    emoji: '✅',
    description: 'Software testing, automation, Selenium, QA engineering',
    keywords: ['qa', 'quality', 'testing', 'test engineer', 'selenium', 'cypress', 'automation', 'test automation', 'manual testing', 'quality assurance', 'software testing'],
    color: '#8b5cf6',
  },
  {
    slug: 'ui-ux-design',
    name: 'UI/UX Design',
    emoji: '🎨',
    description: 'Product design, UX research, Figma, design systems',
    keywords: ['ui', 'ux', 'designer', 'figma', 'user experience', 'user interface', 'product design', 'design system', 'wireframe', 'prototype', 'graphic design'],
    color: '#ec4899',
  },
  {
    slug: 'product-management',
    name: 'Product Management',
    emoji: '🎯',
    description: 'Product manager, program manager, product strategy',
    keywords: ['product manager', 'product management', 'program manager', 'product owner', 'scrum', 'agile coach', 'product strategy', 'roadmap'],
    color: '#6366f1',
  },
  {
    slug: 'software-engineering',
    name: 'Software Engineering',
    emoji: '💻',
    description: 'General software development — Java, Python, C++, Go, system design',
    keywords: ['software engineer', 'software developer', 'sde', 'developer', 'engineer', 'java', 'python', 'c++', 'golang', 'rust', 'software development', 'backend developer', 'programmer'],
    color: '#3b82f6',
  },
]

/**
 * Classify a job into a domain based on its title + skills.
 * Returns the domain slug, or 'other' if no match.
 *
 * Used by:
 *   - Job sync pipeline (assigns domain to new jobs)
 *   - Bulk fetch (assigns domain to AI-extracted jobs)
 *   - Backfill script (assigns domain to existing jobs)
 */
export function classifyJobDomain(title: string, skills: string): string {
  const text = (title + ' ' + skills).toLowerCase()

  for (const domain of JOB_DOMAINS) {
    for (const keyword of domain.keywords) {
      if (text.includes(keyword)) {
        return domain.slug
      }
    }
  }

  return 'other'
}

/**
 * Get a domain by slug. Returns undefined if not found.
 */
export function getDomain(slug: string): JobDomain | undefined {
  return JOB_DOMAINS.find((d) => d.slug === slug)
}

/**
 * Check if a slug is a valid domain.
 */
export function isValidDomain(slug: string): boolean {
  return JOB_DOMAINS.some((d) => d.slug === slug) || slug === 'other'
}

/**
 * Get domain display info for 'other' category.
 */
export const OTHER_DOMAIN: JobDomain = {
  slug: 'other',
  name: 'Other Roles',
  emoji: '💼',
  description: 'Operations, HR, finance, marketing, and other roles',
  keywords: [],
  color: '#64748b',
}
