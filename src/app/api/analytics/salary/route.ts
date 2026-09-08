import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/analytics/salary
// Returns salary benchmarks aggregated from all jobs in the database
export async function GET() {
  try {
    // 1. Salary by role (extract role from title — first 2 words)
    const allJobs = await db.job.findMany({
      where: {
        AND: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
      },
      select: {
        title: true,
        salaryMin: true,
        salaryMax: true,
        location: true,
        category: true,
        experience: true,
        company: { select: { name: true } },
      },
    })

    // Helper: normalize role from title
    const normalizeRole = (title: string): string => {
      const lower = title.toLowerCase()
      // Map common patterns to canonical roles
      if (/senior.*software.*engineer|sde.?ii|software engineer ii/.test(lower)) return 'Senior Software Engineer'
      if (/software engineer|sde|developer/.test(lower)) return 'Software Engineer'
      if (/frontend|front.?end|react|ui developer/.test(lower)) return 'Frontend Engineer'
      if (/backend|back.?end|api|server/.test(lower)) return 'Backend Engineer'
      if (/full.?stack/.test(lower)) return 'Full Stack Engineer'
      if (/data scientist|ml engineer|machine learning/.test(lower)) return 'ML/Data Engineer'
      if (/devops|sre|site reliability|platform engineer/.test(lower)) return 'DevOps/SRE'
      if (/product manager|pm/.test(lower)) return 'Product Manager'
      if (/designer|ux|ui/.test(lower)) return 'Designer'
      if (/qa|test|automation/.test(lower)) return 'QA Engineer'
      if (/architect/.test(lower)) return 'Architect'
      if (/intern/.test(lower)) return 'Intern'
      if (/manager|lead|head/.test(lower)) return 'Engineering Manager'
      return 'Other'
    }

    // Helper: extract primary city from location
    const extractCity = (location: string): string => {
      const cities = ['Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune', 'Noida', 'Gurugram', 'Gurgaon', 'Delhi', 'Kolkata', 'Remote', 'India']
      for (const c of cities) {
        if (location.toLowerCase().includes(c.toLowerCase())) {
          return c === 'Bangalore' ? 'Bengaluru' : c === 'Gurgaon' ? 'Gurugram' : c
        }
      }
      return 'Other'
    }

    // Helper: normalize experience bucket
    const normalizeExperience = (exp: string): string => {
      if (/^0 year|0 year|fresher|entry/i.test(exp)) return '0 (Fresher)'
      if (/0-2|1 year|2 year/i.test(exp)) return '0-2 years'
      if (/1-3|2-4|3 year/i.test(exp)) return '1-4 years'
      if (/3-5|4-6|5 year/i.test(exp)) return '3-6 years'
      if (/5-8|6-8|7 year/i.test(exp)) return '5-8 years'
      if (/8|9|10|senior|staff|principal/i.test(exp)) return '8+ years'
      return 'Not specified'
    }

    // Helper: convert stored salary (LPA * 10) to LPA number
    const toLpa = (n: number) => n / 10

    // 1. By role
    const byRoleMap = new Map<string, { count: number; min: number; max: number; avg: number; total: number }>()
    // 2. By company
    const byCompanyMap = new Map<string, { count: number; min: number; max: number; avg: number; total: number }>()
    // 3. By city
    const byCityMap = new Map<string, { count: number; min: number; max: number; avg: number; total: number }>()
    // 4. By experience
    const byExpMap = new Map<string, { count: number; min: number; max: number; avg: number; total: number }>()
    // 5. Salary distribution buckets
    const buckets = ['0-5', '5-10', '10-15', '15-25', '25-40', '40-60', '60+']
    const distribution = new Map<string, number>(buckets.map((b) => [b, 0]))

    const getOrCreate = (map: Map<any, any>, key: string) => {
      if (!map.has(key)) map.set(key, { count: 0, min: Infinity, max: 0, avg: 0, total: 0 })
      return map.get(key)
    }

    for (const job of allJobs) {
      const min = toLpa(job.salaryMin!)
      const max = toLpa(job.salaryMax!)
      const avg = (min + max) / 2
      const mid = (min + max) / 2

      // By role
      const role = normalizeRole(job.title)
      const r = getOrCreate(byRoleMap, role)
      r.count++
      r.min = Math.min(r.min, min)
      r.max = Math.max(r.max, max)
      r.total += avg

      // By company
      const c = getOrCreate(byCompanyMap, job.company.name)
      c.count++
      c.min = Math.min(c.min, min)
      c.max = Math.max(c.max, max)
      c.total += avg

      // By city
      const city = extractCity(job.location)
      const ct = getOrCreate(byCityMap, city)
      ct.count++
      ct.min = Math.min(ct.min, min)
      ct.max = Math.max(ct.max, max)
      ct.total += avg

      // By experience
      const exp = normalizeExperience(job.experience)
      const e = getOrCreate(byExpMap, exp)
      e.count++
      e.min = Math.min(e.min, min)
      e.max = Math.max(e.max, max)
      e.total += avg

      // Distribution bucket (by mid salary)
      if (mid < 5) distribution.set('0-5', distribution.get('0-5')! + 1)
      else if (mid < 10) distribution.set('5-10', distribution.get('5-10')! + 1)
      else if (mid < 15) distribution.set('10-15', distribution.get('10-15')! + 1)
      else if (mid < 25) distribution.set('15-25', distribution.get('15-25')! + 1)
      else if (mid < 40) distribution.set('25-40', distribution.get('25-40')! + 1)
      else if (mid < 60) distribution.set('40-60', distribution.get('40-60')! + 1)
      else distribution.set('60+', distribution.get('60+')! + 1)
    }

    const finalize = (map: Map<string, any>) =>
      Array.from(map.entries())
        .map(([key, v]) => ({ label: key, count: v.count, min: Math.round(v.min * 10) / 10, max: Math.round(v.max * 10) / 10, avg: Math.round((v.total / v.count) * 10) / 10 }))
        .sort((a, b) => b.avg - a.avg)

    const byRole = finalize(byRoleMap).filter((r) => r.label !== 'Other').slice(0, 10)
    const byCompany = finalize(byCompanyMap).slice(0, 12)
    const byCity = finalize(byCityMap).filter((c) => c.label !== 'Other').slice(0, 10)
    const byExperience = finalize(byExpMap)
    const distributionData = buckets.map((b) => ({ label: `${b} LPA`, count: distribution.get(b) || 0 }))

    // Overall stats
    const allSalaries = allJobs.map((j) => (toLpa(j.salaryMin!) + toLpa(j.salaryMax!)) / 2).sort((a, b) => a - b)
    const median = allSalaries.length > 0 ? allSalaries[Math.floor(allSalaries.length / 2)] : 0
    const p25 = allSalaries.length > 0 ? allSalaries[Math.floor(allSalaries.length * 0.25)] : 0
    const p75 = allSalaries.length > 0 ? allSalaries[Math.floor(allSalaries.length * 0.75)] : 0

    return NextResponse.json({
      totalJobsWithSalary: allJobs.length,
      median: Math.round(median * 10) / 10,
      p25: Math.round(p25 * 10) / 10,
      p75: Math.round(p75 * 10) / 10,
      overallMin: allSalaries[0] ? Math.round(allSalaries[0] * 10) / 10 : 0,
      overallMax: allSalaries[allSalaries.length - 1] ? Math.round(allSalaries[allSalaries.length - 1] * 10) / 10 : 0,
      byRole,
      byCompany,
      byCity,
      byExperience,
      distribution: distributionData,
    })
  } catch (e: any) {
    console.error('Salary analytics error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
