import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const DEMO_USER_EMAIL = 'demo@hirebase.in'

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    let user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      user = await db.user.create({
        data: { email: session.user.email, name: session.user.name || null, role: 'candidate' },
      })
    }
    return user
  }
  let demo = await db.user.findUnique({ where: { email: DEMO_USER_EMAIL } })
  if (!demo) {
    demo = await db.user.create({
      data: { email: DEMO_USER_EMAIL, name: 'Demo User', role: 'candidate' },
    })
  }
  return demo
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    const apps = await db.application.findMany({
      where: { userId: user.id },
      include: { job: { include: { company: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ applications: apps, isDemo: user.email === DEMO_USER_EMAIL })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await getCurrentUser()
    const app = await db.application.create({
      data: {
        userId: user.id,
        jobId: body.jobId || null,
        company: body.company,
        role: body.role,
        location: body.location || null,
        salary: body.salary || null,
        status: body.status || 'wishlist',
        url: body.url || null,
        notes: body.notes || null,
      },
      include: { job: { include: { company: true } } },
    })
    return NextResponse.json({ application: app, isDemo: user.email === DEMO_USER_EMAIL })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes } = await req.json()
    const user = await getCurrentUser()
    const updated = await db.application.update({
      where: { id, userId: user.id },
      data: { status, notes },
      include: { job: { include: { company: true } } },
    })
    return NextResponse.json({ application: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const user = await getCurrentUser()
    await db.application.delete({ where: { id, userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
