import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  // Use JWT strategy (works without a database session adapter)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) {
          throw new Error('No account found with that email. Did you sign up?')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Incorrect password. Please try again.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
        }
      },
    }),
  ],
  callbacks: {
    // Include user.id in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    // Include user.id in the session
    async session({ session, token }) {
      if (session.user && token.id) {
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    // We use a custom in-app auth view instead of separate pages,
    // but NextAuth still needs a signIn page defined for some flows.
    signIn: '/?view=auth',
    error: '/?view=auth&error=true',
  },
}
