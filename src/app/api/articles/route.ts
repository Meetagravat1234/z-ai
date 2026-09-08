import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (slug) {
      const article = await db.article.findUnique({ where: { slug } })
      if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ article })
    }

    const where: any = { published: true }
    if (category && category !== 'all') where.category = category

    const articles = await db.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ articles })
  } catch (e: any) {
    console.error('Articles API error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
