import { db } from '@/lib/db'
import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Skill Tests — Test Your Knowledge | Hirebase',
  description:
    'Free online skill tests for C, Java, Python, SQL, Data Structures, Aptitude, and Web Development. Take full subject tests or topic-wise quizzes. Get instant scores with explanations.',
  alternates: { canonical: 'https://www.hirebase.in/skill-tests' },
}

const SUBJECT_META: Record<string, { name: string; icon: string; color: string; border: string; desc: string }> = {
  'c': { name: 'C Programming', icon: '🔧', color: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/30', desc: 'Operators, functions, pointers, memory management' },
  'java': { name: 'Java', icon: '☕', color: 'from-orange-500/10 to-amber-500/10', border: 'border-orange-500/30', desc: 'OOP, collections, exceptions, multithreading' },
  'python': { name: 'Python', icon: '🐍', color: 'from-emerald-500/10 to-yellow-500/10', border: 'border-emerald-500/30', desc: 'Data types, OOP, decorators, generators' },
  'sql': { name: 'SQL & Databases', icon: '🗄️', color: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/30', desc: 'Joins, aggregation, subqueries, indexing' },
  'data-structures': { name: 'Data Structures & Algorithms', icon: '📊', color: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-500/30', desc: 'Arrays, trees, graphs, sorting, complexity' },
  'aptitude': { name: 'Aptitude & Reasoning', icon: '🧮', color: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/30', desc: 'Quantitative, logical reasoning, verbal ability' },
  'web-development': { name: 'Web Development', icon: '🌐', color: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/30', desc: 'HTML, CSS, JavaScript, React, REST APIs' },
}

export default async function SkillTestsPage() {
  let tests: any[] = []
  try {
    tests = await db.skillTest.findMany({
      where: { isPublished: true },
      select: {
        id: true, title: true, slug: true, subject: true, topic: true,
        testType: true, description: true, difficulty: true,
        durationMin: true, passingScore: true,
        _count: { select: { questions: true } },
      },
      orderBy: [{ subject: 'asc' }, { testType: 'asc' }],
    })
  } catch (e) {
    console.error('Skill tests fetch failed:', e)
  }

  // Group by subject
  const bySubject: Record<string, any[]> = {}
  for (const t of tests) {
    if (!bySubject[t.subject]) bySubject[t.subject] = []
    bySubject[t.subject].push(t)
  }

  return (
    <SiteShell>
      <div className="max-w-5xl mx-auto pb-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Test Your <span className="gradient-text">Skills</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Take free online skill tests to assess your knowledge. Choose from 7 subjects, each with full tests and topic-wise quizzes. Get instant scores with detailed explanations.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-extrabold text-primary">7</div>
            <div className="text-xs text-muted-foreground">Subjects</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-extrabold text-primary">{tests.length}</div>
            <div className="text-xs text-muted-foreground">Tests</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-extrabold text-primary">
              {tests.reduce((sum, t) => sum + (t._count?.questions || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
        </div>

        {/* Subject cards */}
        <div className="space-y-8">
          {Object.entries(bySubject).map(([subject, subjectTests]) => {
            const meta = SUBJECT_META[subject] || { name: subject, icon: '📚', color: '', border: 'border-border', desc: '' }
            const fullTest = subjectTests.find(t => t.testType === 'full')
            const topicTests = subjectTests.filter(t => t.testType === 'topic')

            return (
              <div key={subject} className={`rounded-3xl border-2 ${meta.border} bg-gradient-to-br ${meta.color} p-5 sm:p-6`}>
                {/* Subject header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center text-2xl shrink-0">
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{meta.name}</h2>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  </div>
                </div>

                {/* Full test */}
                {fullTest && (
                  <Link
                    href={`/skill-tests/${fullTest.id}`}
                    className="block rounded-2xl bg-background/80 backdrop-blur border border-border p-4 mb-3 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Full Test
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {fullTest._count.questions} Qs · {fullTest.durationMin} min
                          </span>
                        </div>
                        <h3 className="font-bold text-sm mt-1">{fullTest.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{fullTest.description}</p>
                      </div>
                      <div className="text-primary font-bold text-lg shrink-0 ml-2">→</div>
                    </div>
                  </Link>
                )}

                {/* Topic-wise tests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topicTests.map(t => (
                    <Link
                      key={t.id}
                      href={`/skill-tests/${t.id}`}
                      className="block rounded-xl bg-background/80 backdrop-blur border border-border p-3 hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          Topic
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {t._count.questions} Qs · {t.durationMin}m
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs leading-snug">{t.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SiteShell>
  )
}
