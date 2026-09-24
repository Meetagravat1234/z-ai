import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== Testing AI with a LONG resume (simulating real user) ===')
  const { chatComplete } = await import('/home/z/my-project/src/lib/multi-ai.ts')

  const longResume = `John Doe
Software Engineer with 5+ years experience
Email: john@example.com

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience designing and building scalable web applications. Expert in Python, JavaScript, React, Node.js, and AWS. Proven track record of delivering high-quality software on time.

EXPERIENCE
Senior Software Engineer at Google (2022-Present)
- Led the development of a microservices-based payment processing system handling 1M+ transactions per day
- Built a real-time analytics dashboard using React, Node.js, and AWS Lambda
- Mentored 3 junior engineers and conducted 50+ code reviews
- Reduced API response time by 40% through caching and query optimization

Software Engineer at Microsoft (2020-2022)
- Developed RESTful APIs using Python (Django) and Node.js (Express)
- Built responsive frontends with React, TypeScript, and Tailwind CSS
- Collaborated with product managers to define feature requirements

Junior Developer at StartupXYZ (2019-2020)
- Built and maintained company website using React and Next.js
- Implemented authentication system using JWT and bcrypt

EDUCATION
B.Tech in Computer Science, Indian Institute of Technology Delhi (2015-2019)
- GPA: 8.5/10
- Relevant coursework: Data Structures, Algorithms, Operating Systems, Databases

SKILLS
Languages: Python, JavaScript, TypeScript, Java, C++
Frontend: React, Next.js, Vue.js, Angular, Tailwind CSS
Backend: Node.js, Express, Django, Flask, FastAPI
Databases: PostgreSQL, MongoDB, MySQL, Redis
Cloud: AWS (EC2, S3, Lambda, RDS), Google Cloud, Docker, Kubernetes
Tools: Git, GitHub Actions, Jenkins, JIRA`

  const longJD = `Software Engineer at Google
Location: Bangalore, India

We are hiring Software Engineers to join our Cloud team. You will work on building scalable distributed systems that serve billions of users.

Requirements:
- 3+ years of experience in software development
- Strong proficiency in Python, Java, or Go
- Experience with distributed systems and microservices
- Knowledge of AWS, GCP, or Azure
- Excellent problem-solving skills
- Bachelor's degree in Computer Science or equivalent

Preferred:
- Experience with Kubernetes and Docker
- Knowledge of databases (PostgreSQL, MySQL)
- Understanding of CI/CD pipelines
- Open source contributions

What you'll do:
- Design and implement scalable backend services
- Build reliable distributed systems
- Optimize performance and reliability
- Mentor junior engineers
- Participate in code reviews and design discussions

We offer competitive salary, equity, health insurance, and the opportunity to work with world-class engineers.`

  const start = Date.now()
  try {
    const result = await chatComplete([
      {
        role: 'system',
        content: "You are an expert ATS resume optimizer. Given a candidate's current resume and a target job description, produce a tailored, ATS-friendly resume in Markdown. Start with the person's name as # H1 heading. Include sections: ## Professional Summary, ## Core Skills, ## Professional Experience, ## Education. Output ONLY the resume — no commentary, no metadata. Keep it 1-2 pages. Use bullet points with action verbs. Quantify achievements."
      },
      { role: 'user', content: 'MY CURRENT RESUME:\n' + longResume + '\n\n---\n\nTARGET JOB DESCRIPTION:\n' + longJD + '\n\n---\n\nProduce the tailored ATS-optimized resume in Markdown.' }
    ])
    console.log('  ✅ AI call succeeded in', Date.now() - start, 'ms')
    console.log('  Response length:', result?.length || 0, 'chars')
    if (!result || result.length < 100) {
      console.log('  ⚠️  Response too short')
    }
    console.log('  First 200 chars:', result?.slice(0, 200))
  } catch (e: any) {
    console.log('  ❌ AI call FAILED in', Date.now() - start, 'ms')
    console.log('  Error:', e.message?.slice(0, 200))
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
