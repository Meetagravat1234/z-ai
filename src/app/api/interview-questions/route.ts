import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/interview-questions?role=software+engineer&company=google&type=behavioral
// Returns a curated list of interview questions for the role/company/type
// POST /api/interview-questions { question, role?, context? }
// Returns an AI-generated model answer

export const SAMPLE_QUESTIONS = [
  // === BEHAVIORAL ===
  { id: 'b1', type: 'behavioral', question: 'Tell me about yourself.', role: 'general', difficulty: 'easy', tags: 'introduction' },
  { id: 'b2', type: 'behavioral', question: 'Why do you want to work at this company?', role: 'general', difficulty: 'easy', tags: 'motivation' },
  { id: 'b3', type: 'behavioral', question: 'Describe a challenging project you worked on. What was your role and how did you overcome the challenges?', role: 'general', difficulty: 'medium', tags: 'experience,problem-solving' },
  { id: 'b4', type: 'behavioral', question: 'Tell me about a time you had a conflict with a coworker. How did you resolve it?', role: 'general', difficulty: 'medium', tags: 'teamwork,conflict' },
  { id: 'b5', type: 'behavioral', question: 'What is your greatest weakness?', role: 'general', difficulty: 'easy', tags: 'self-awareness' },
  { id: 'b6', type: 'behavioral', question: 'Describe a time you failed. What did you learn?', role: 'general', difficulty: 'medium', tags: 'failure,learning' },
  { id: 'b7', type: 'behavioral', question: 'Tell me about a time you had to make a decision with incomplete information.', role: 'general', difficulty: 'hard', tags: 'decision-making' },
  { id: 'b8', type: 'behavioral', question: 'How do you handle tight deadlines and pressure?', role: 'general', difficulty: 'medium', tags: 'stress-management' },
  { id: 'b9', type: 'behavioral', question: 'Describe a situation where you had to persuade someone to see things your way.', role: 'general', difficulty: 'medium', tags: 'influence,communication' },
  { id: 'b10', type: 'behavioral', question: 'Tell me about a time you went above and beyond what was required.', role: 'general', difficulty: 'medium', tags: 'initiative' },
  // === SOFTWARE ENGINEER — TECHNICAL ===
  { id: 't1', type: 'technical', question: 'Explain the difference between SQL and NoSQL databases. When would you use each?', role: 'software-engineer', difficulty: 'medium', tags: 'databases' },
  { id: 't2', type: 'technical', question: 'What is the CAP theorem? How does it affect distributed system design?', role: 'software-engineer', difficulty: 'hard', tags: 'distributed-systems' },
  { id: 't3', type: 'technical', question: 'How would you design a URL shortener like bit.ly? Walk through the system design.', role: 'software-engineer', difficulty: 'hard', tags: 'system-design' },
  { id: 't4', type: 'technical', question: 'Explain how garbage collection works in your primary language.', role: 'software-engineer', difficulty: 'medium', tags: 'memory,language' },
  { id: 't5', type: 'technical', question: 'What is the difference between processes and threads? When would you use each?', role: 'software-engineer', difficulty: 'medium', tags: 'os,concurrency' },
  { id: 't6', type: 'technical', question: 'How does HTTPS work? Explain the TLS handshake.', role: 'software-engineer', difficulty: 'hard', tags: 'networking,security' },
  { id: 't7', type: 'technical', question: 'What is event-driven architecture? Give an example.', role: 'software-engineer', difficulty: 'medium', tags: 'architecture' },
  { id: 't8', type: 'technical', question: 'Explain the difference between optimistic and pessimistic locking.', role: 'software-engineer', difficulty: 'hard', tags: 'databases,concurrency' },
  { id: 't9', type: 'technical', question: 'How would you implement a rate limiter? What are the trade-offs?', role: 'software-engineer', difficulty: 'hard', tags: 'system-design' },
  { id: 't10', type: 'technical', question: 'What is the difference between REST and GraphQL? When would you choose each?', role: 'software-engineer', difficulty: 'medium', tags: 'api' },
  // === FRONTEND ===
  { id: 'f1', type: 'technical', question: 'Explain the React component lifecycle. What hooks do you use and when?', role: 'frontend', difficulty: 'medium', tags: 'react' },
  { id: 'f2', type: 'technical', question: 'What is the difference between controlled and uncontrolled components in React?', role: 'frontend', difficulty: 'medium', tags: 'react' },
  { id: 'f3', type: 'technical', question: 'How does the browser rendering pipeline work? From HTML to pixels.', role: 'frontend', difficulty: 'hard', tags: 'browser,performance' },
  { id: 'f4', type: 'technical', question: 'What is the difference between debouncing and throttling? When would you use each?', role: 'frontend', difficulty: 'medium', tags: 'performance' },
  { id: 'f5', type: 'technical', question: 'Explain CSS specificity. How is it calculated?', role: 'frontend', difficulty: 'easy', tags: 'css' },
  { id: 'f6', type: 'technical', question: 'What is the virtual DOM? How does React use it for performance?', role: 'frontend', difficulty: 'medium', tags: 'react,performance' },
  { id: 'f7', type: 'technical', question: 'How would you optimize a slow-loading web page? List techniques.', role: 'frontend', difficulty: 'hard', tags: 'performance' },
  // === DATA / ML ===
  { id: 'd1', type: 'technical', question: 'Explain the bias-variance tradeoff.', role: 'data-scientist', difficulty: 'medium', tags: 'ml' },
  { id: 'd2', type: 'technical', question: 'What is the difference between supervised and unsupervised learning?', role: 'data-scientist', difficulty: 'easy', tags: 'ml' },
  { id: 'd3', type: 'technical', question: 'How would you handle an imbalanced dataset?', role: 'data-scientist', difficulty: 'medium', tags: 'ml,data' },
  { id: 'd4', type: 'technical', question: 'Explain how gradient descent works.', role: 'data-scientist', difficulty: 'hard', tags: 'ml,optimization' },
  { id: 'd5', type: 'technical', question: 'What is cross-validation? Why is it important?', role: 'data-scientist', difficulty: 'medium', tags: 'ml,evaluation' },
  // === DEVOPS ===
  { id: 'o1', type: 'technical', question: 'What is the difference between Docker and Kubernetes?', role: 'devops', difficulty: 'medium', tags: 'containers,orchestration' },
  { id: 'o2', type: 'technical', question: 'Explain the CI/CD pipeline. What are the stages?', role: 'devops', difficulty: 'medium', tags: 'ci-cd' },
  { id: 'o3', type: 'technical', question: 'What is blue-green deployment? How does it differ from canary?', role: 'devops', difficulty: 'hard', tags: 'deployment' },
  { id: 'o4', type: 'technical', question: 'How would you monitor a microservices architecture?', role: 'devops', difficulty: 'hard', tags: 'monitoring,microservices' },
  // === PRODUCT MANAGER ===
  { id: 'p1', type: 'product', question: 'How would you prioritize features for a product roadmap?', role: 'product-manager', difficulty: 'medium', tags: 'prioritization' },
  { id: 'p2', type: 'product', question: 'A key metric drops 20% overnight. Walk me through your investigation.', role: 'product-manager', difficulty: 'hard', tags: 'analytics' },
  { id: 'p3', type: 'product', question: 'How would you design a feature to improve user engagement?', role: 'product-manager', difficulty: 'medium', tags: 'product-design' },
  { id: 'p4', type: 'product', question: 'Tell me about a product you love. Why? How would you improve it?', role: 'product-manager', difficulty: 'medium', tags: 'product-sense' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || 'all'
  const type = searchParams.get('type') || 'all'
  const difficulty = searchParams.get('difficulty') || 'all'

  let filtered = SAMPLE_QUESTIONS
  if (role !== 'all') {
    filtered = filtered.filter((q) => q.role === role || q.role === 'general')
  }
  if (type !== 'all') {
    filtered = filtered.filter((q) => q.type === type)
  }
  if (difficulty !== 'all') {
    filtered = filtered.filter((q) => q.difficulty === difficulty)
  }

  return NextResponse.json({ questions: filtered, total: filtered.length })
}

export async function POST(req: NextRequest) {
  try {
    const { question, role, context } = await req.json()
    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert technical interviewer and mentor. Given an interview question, provide a model answer that would impress a hiring panel.

Output your answer as Markdown with these sections:
## What they're really asking
<1-2 sentences on what the interviewer is evaluating>

## Model answer
<the actual answer — 2-4 paragraphs for behavioral, or a structured technical answer with code examples if applicable>

## Key points to hit
- <bullet 1>
- <bullet 2>
- <bullet 3>

## Common mistakes
- <what candidates often get wrong>

## Follow-up questions to expect
- <related question 1>
- <related question 2>

Tone: confident, specific, and practical. Use the STAR method for behavioral questions. For technical questions, be precise and demonstrate depth.`,
        },
        {
          role: 'user',
          content: `INTERVIEW QUESTION: ${question}${role ? `\nROLE: ${role}` : ''}${context ? `\nADDITIONAL CONTEXT: ${context}` : ''}

Provide a model answer.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    return NextResponse.json({ result: completion.choices[0]?.message?.content || '' })
  } catch (e: any) {
    console.error('AI interview answer error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
