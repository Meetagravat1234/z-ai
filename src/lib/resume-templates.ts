/**
 * Resume Templates Configuration
 *
 * 10 professionally designed resume templates, each with:
 *   - Visual identity (emoji, colors, name, description)
 *   - Layout type (1-column, 2-column, compact)
 *   - AI prompt modifier (tells AI how to format content for this template)
 *   - CSS class name (applied to the rendered resume)
 *
 * Pro-only feature. Free users see the templates but can't use them
 * (ProUpsellModal appears when they try).
 *
 * The current resume-optimize logic is PRESERVED as the default fallback.
 * When no template is selected, the original Markdown flow runs unchanged.
 */

export interface ResumeTemplate {
  slug: string
  name: string
  description: string
  emoji: string
  /** Gradient colors for the preview card (CSS gradient string) */
  previewGradient: string
  /** Best-use category for marketing/filtering */
  category: 'tech' | 'creative' | 'executive' | 'academic' | 'compact' | 'ats'
  /** Layout type — affects CSS class applied to rendered resume */
  layout: 'single-column' | 'two-column' | 'compact' | 'ats-plain'
  /** Accent color (hex) — used for headings, borders, bullets */
  accentColor: string
  /** Font family for the resume body */
  fontFamily: string
  /** Additional instructions injected into the AI prompt */
  aiPromptModifier: string
  /** Sort order (lower = appears first) */
  sortOrder: number
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    slug: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean single-column, sans-serif. Best for software engineers.',
    emoji: '📄',
    previewGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    category: 'tech',
    layout: 'single-column',
    accentColor: '#6366f1',
    fontFamily: "'Inter', system-ui, sans-serif",
    aiPromptModifier: `Format as a clean single-column resume. Use ## H2 headings for sections. Use bullet points with - for experience. Keep generous whitespace. No tables, no columns. Plain professional Markdown only.`,
    sortOrder: 1,
  },
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
    aiPromptModifier: `Format as a two-column resume. Main column: Professional Summary, Experience, Education. Sidebar (right): Core Skills (as comma-separated list), Tools, Certifications. Use ## H2 for main sections and ### H3 for sidebar sections. Keep skills section SHORT (max 15 items).`,
    sortOrder: 2,
  },
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
    aiPromptModifier: `Format as a traditional executive resume. Use serif tone. Sections: Professional Summary, Core Competencies, Professional Experience, Education, Awards & Recognition. Use formal language. Each experience entry: Title | Company | Location | Dates. Bullet points start with strong action verbs (Spearheaded, Orchestrated, Architected).`,
    sortOrder: 3,
  },
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
    aiPromptModifier: `Format as a creative resume with personality. Use ## H2 headings. Add a "## Highlights" section near top with 3-4 key achievements as bullet points. Sections: Highlights, About Me, Experience, Skills, Projects, Education. Use engaging language. Skills as comma-separated list. Mention 1-2 personal projects if space allows.`,
    sortOrder: 4,
  },
  {
    slug: 'compact-professional',
    name: 'Compact Professional',
    description: 'Dense layout, fits 1 page easily. Best for freshers & entry-level.',
    emoji: '📦',
    previewGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    category: 'compact',
    layout: 'compact',
    accentColor: '#3b82f6',
    fontFamily: "'Inter', system-ui, sans-serif",
    aiPromptModifier: `Format as a COMPACT resume that fits on 1 page. Be concise. Use ## H2 headings but keep section intros SHORT (1 sentence max). Bullet points should be 1 line each, max 4 bullets per job. Sections: Summary, Skills, Experience, Education, Projects. Skip certifications if not present. Use comma-separated skills list (max 12).`,
    sortOrder: 5,
  },
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
    aiPromptModifier: `Format as an academic CV. Use numbered sections (1. Education, 2. Research Experience, 3. Publications, 4. Skills, 5. Awards). List publications in citation format: Author, A. (Year). Title. Venue. Include Research Interests section. Use formal academic tone. List education in reverse chronological order with GPA if > 8.0.`,
    sortOrder: 6,
  },
  {
    slug: 'startup-friendly',
    name: 'Startup Friendly',
    description: 'Casual-modern, emoji-friendly. Best for startup applicants.',
    emoji: '🚀',
    previewGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    category: 'creative',
    layout: 'two-column',
    accentColor: '#ec4899',
    fontFamily: "'Inter', system-ui, sans-serif",
    aiPromptModifier: `Format as a modern startup-friendly resume. Use ## H2 headings. Add a "## About Me" section (2-3 sentences, conversational tone). Sections: About Me, What I Do, Experience, Side Projects, Skills, Education. Skills with simple emoji prefixes (💻 Languages:, 🛠 Tools:, 🎨 Design:). Mention 1-2 side projects. Tone: confident but humble.`,
    sortOrder: 7,
  },
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
    aiPromptModifier: `Format as a conservative corporate resume. Formal language, no contractions. Sections: Professional Profile, Key Skills, Professional Experience, Academic Qualifications, Certifications. Use bullet points starting with action verbs. Each experience entry: Job Title, Company, Location, Dates. Mention quantified achievements (₹ amounts, %, numbers).`,
    sortOrder: 8,
  },
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
    aiPromptModifier: `Format as ATS-MAXIMUM resume. Plain Markdown, no fancy formatting. Use ## H2 headings only. Mirror the EXACT keywords from the job description (e.g. if JD says "Python 3", write "Python 3" not just "Python"). Include a "## Core Competencies" section with comma-separated keywords from JD. Each experience bullet should contain at least 1 keyword from the JD. No tables, no columns, no images, no special characters. Maximum keyword density without keyword stuffing.`,
    sortOrder: 9,
  },
  {
    slug: 'hybrid-modern',
    name: 'Hybrid Modern',
    description: 'Two-column but ATS-friendly. Best for most roles.',
    emoji: '🔄',
    previewGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    category: 'tech',
    layout: 'two-column',
    accentColor: '#06b6d4',
    fontFamily: "'Inter', system-ui, sans-serif",
    aiPromptModifier: `Format as a hybrid resume (two-column but ATS-readable). Main column (left): Professional Summary, Experience, Education. Sidebar (right): Core Skills (comma-separated), Tools, Languages, Certifications. Use ## H2 for main sections. Keep sidebar SHORT (max 20 items total). Use standard bullet points. Avoid tables and images.`,
    sortOrder: 10,
  },
]

/**
 * Get a template by slug. Returns undefined if not found.
 */
export function getTemplate(slug: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.slug === slug)
}

/**
 * Get the default template (used when user doesn't pick one).
 * Falls back to 'modern-minimalist' (sortOrder: 1).
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
