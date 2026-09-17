import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upgrade to Pro — ₹299/month | Hirebase',
  description: 'Upgrade to Hirebase Pro for ₹299/month or ₹2,499/year. Get 10x AI tool usage, unlimited saved jobs, application tracker, and daily email job alerts. One-time payment via Razorpay.',
  alternates: { canonical: 'https://www.hirebase.in/upgrade' },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children
}
