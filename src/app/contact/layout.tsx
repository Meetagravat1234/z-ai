import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Hirebase',
  description: 'Get in touch with the Hirebase team. Report issues, suggest features, or ask questions about job listings, AI tools, or subscriptions.',
  alternates: { canonical: 'https://www.hirebase.in/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
