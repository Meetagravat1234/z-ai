import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// POST /api/auth/register
// Body: { email, password, name? }
// Creates a new user account with hashed password
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists. Try logging in.' }, { status: 409 })
    }

    // Hash the password (10 rounds is the bcrypt default; ~80ms per hash)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        password: hashedPassword,
        role: 'candidate',
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (e: any) {
    console.error('Register error:', e)
    return NextResponse.json({ error: e.message || 'Failed to create account' }, { status: 500 })
  }
}
