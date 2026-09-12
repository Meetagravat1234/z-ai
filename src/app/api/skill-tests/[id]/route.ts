import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'

// GET /api/skill-tests/[id] — get test details + questions (without correct answers)
// POST /api/skill-tests/[id]/submit — submit answers + get score

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const test = await db.skillTest.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            difficulty: true,
          },
        },
      },
    })

    if (!test || !test.isPublished) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Shuffle questions for variety
    const shuffled = [...test.questions].sort(() => Math.random() - 0.5)

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        slug: test.slug,
        subject: test.subject,
        topic: test.topic,
        testType: test.testType,
        description: test.description,
        difficulty: test.difficulty,
        durationMin: test.durationMin,
        passingScore: test.passingScore,
        totalQuestions: test.questions.length,
        questions: shuffled.map(q => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options),
          difficulty: q.difficulty,
        })),
      },
    })
  } catch (e: any) {
    console.error('Skill test fetch error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/skill-tests/[id]/submit
// Body: { answers: [{ questionId, selectedIdx }] }
// Returns: { score, correctCount, totalCount, passed, results: [{ questionId, selectedIdx, correctIdx, explanation, isCorrect }] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { answers } = await req.json()

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array required' }, { status: 400 })
    }

    const test = await db.skillTest.findUnique({
      where: { id },
      include: { questions: true },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Score the answers
    let correctCount = 0
    const results = []

    for (const answer of answers) {
      const question = test.questions.find(q => q.id === answer.questionId)
      if (!question) continue

      const isCorrect = answer.selectedIdx === question.correctIdx
      if (isCorrect) correctCount++

      results.push({
        questionId: question.id,
        question: question.question,
        options: JSON.parse(question.options),
        selectedIdx: answer.selectedIdx,
        correctIdx: question.correctIdx,
        explanation: question.explanation,
        isCorrect,
      })
    }

    const totalCount = test.questions.length
    const score = Math.round((correctCount / totalCount) * 100)
    const passed = score >= test.passingScore

    // Save attempt (if user is logged in)
    const user = await getCurrentUser(req)
    const attempt = await db.skillTestAttempt.create({
      data: {
        testId: id,
        userId: user?.id || null,
        score,
        correctCount,
        totalCount,
        timeTakenSec: 0, // client can send this
        answers: JSON.stringify(results.map(r => ({
          questionId: r.questionId,
          selectedIdx: r.selectedIdx,
          correct: r.isCorrect,
        }))),
        passed,
      },
    })

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      correctCount,
      totalCount,
      passed,
      passingScore: test.passingScore,
      results,
    })
  } catch (e: any) {
    console.error('Skill test submit error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
