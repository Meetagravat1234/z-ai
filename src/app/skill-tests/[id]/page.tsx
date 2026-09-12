import { db } from '@/lib/db'
import { SkillTestClient } from '@/components/views/skill-test-view'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const test = await db.skillTest.findUnique({
      where: { id },
      select: { title: true, description: true, subject: true },
    })
    if (!test) return { title: 'Test not found | Hirebase' }
    return {
      title: `${test.title} | Hirebase`,
      description: test.description,
      alternates: { canonical: `https://www.hirebase.in/skill-tests/${id}` },
    }
  } catch {
    return { title: 'Skill Test | Hirebase' }
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <SkillTestClient testId={id} />
}
