'use client'

import * as React from 'react'
import { SiteShell } from '@/components/layout/site-shell'
import { toast } from 'sonner'
import { Loader2, Mail, Send, MessageSquare, Bug, Flag, Briefcase } from 'lucide-react'

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto pb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact Hirebase</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Have a question, feedback, or found a problem? We typically respond within 1 business day.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <a
            href="mailto:contact@hirebase.in"
            className="rounded-2xl border border-border bg-card p-5 card-lift"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-sm">General Inquiries</h3>
            <p className="text-xs text-muted-foreground mt-1">contact@hirebase.in</p>
          </a>
          <a
            href="mailto:privacy@hirebase.in"
            className="rounded-2xl border border-border bg-card p-5 card-lift"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
              <Flag className="w-5 h-5 text-violet-500" />
            </div>
            <h3 className="font-bold text-sm">Report a Listing</h3>
            <p className="text-xs text-muted-foreground mt-1">Report fraudulent jobs</p>
          </a>
          <a
            href="mailto:privacy@hirebase.in"
            className="rounded-2xl border border-border bg-card p-5 card-lift"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
              <Bug className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="font-bold text-sm">Report a Bug</h3>
            <p className="text-xs text-muted-foreground mt-1">Site issues, broken links</p>
          </a>
        </div>

        <ContactForm />
      </div>
    </SiteShell>
  )
}

function ContactForm() {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [subject, setSubject] = React.useState('General Inquiry')
  const [message, setMessage] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in your name, email, and message.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    setSubmitting(true)
    try {
      // Use mailto: as fallback (no email API set up yet — this is the AdSense-required contact method)
      const mailtoUrl = `mailto:contact@hirebase.in?subject=${encodeURIComponent(`[${subject}] ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`)}`
      window.location.href = mailtoUrl
      toast.success('Opening your email client…')
    } catch (e) {
      toast.error('Something went wrong. Please email contact@hirebase.in directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Send us a message</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
          Subject
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option>General Inquiry</option>
          <option>Report a Fraudulent Job Listing</option>
          <option>Report a Bug or Site Issue</option>
          <option>Feature Request</option>
          <option>Privacy / Data Request</option>
          <option>Recruiter / Business Inquiry</option>
          <option>Subscription / Billing Question</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your question or issue in detail…"
          rows={6}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-y"
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-muted-foreground max-w-md">
          By submitting this form, you agree to be contacted by Hirebase at the email address provided. We do not share your information with third parties.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
