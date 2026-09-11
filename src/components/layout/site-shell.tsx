'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sidebar, TopNav, BottomNav } from '@/components/layout/sidebar'
import { CommandPalette } from '@/components/command/command-palette'
import { useNav } from '@/lib/nav-store'

/**
 * A layout shell for SEO-friendly static routes (/jobs/[slug], /companies/[slug], etc.).
 * Wraps the page content with the same Sidebar + TopNav + BottomNav + Footer
 * the SPA-style home page uses, so navigation feels consistent.
 *
 * Unlike HomeShell, this doesn't render a view-router — the page content
 * is whatever the route's Server Component passes as children.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const { go } = useNav()
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 px-4 lg:px-6 py-6 pb-24 lg:pb-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
      <Footer />
      <BottomNav />
      <CommandPalette />
    </div>
  )
}

function Footer() {
  const { go } = useNav()
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <span className="font-extrabold">Hirebase</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Career intelligence platform for verified jobs, AI tools, and editorial guidance.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Find Jobs</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-primary text-muted-foreground">All Jobs</Link></li>
              <li><Link href="/jobs/fresher" className="hover:text-primary text-muted-foreground">Freshers</Link></li>
              <li><Link href="/jobs/internship" className="hover:text-primary text-muted-foreground">Internships</Link></li>
              <li><Link href="/jobs/hidden" className="hover:text-primary text-muted-foreground">Hidden Jobs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">AI Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ai-tools/resume-optimizer" className="hover:text-primary text-muted-foreground">Resume Optimizer</Link></li>
              <li><Link href="/ai-tools/cover-letter" className="hover:text-primary text-muted-foreground">Cover Letter</Link></li>
              <li><Link href="/ai-tools/mock-interview" className="hover:text-primary text-muted-foreground">Mock Interview</Link></li>
              <li><Link href="/ai-tools/salary-predictor" className="hover:text-primary text-muted-foreground">Salary Predictor</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary text-muted-foreground">About</Link></li>
              <li><Link href="/ground-truth" className="hover:text-primary text-muted-foreground">Ground Truth</Link></li>
              <li><Link href="/pricing" className="hover:text-primary text-muted-foreground">Pricing</Link></li>
              <li><Link href="/upgrade" className="hover:text-primary text-muted-foreground">Upgrade to Pro</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Hirebase. Built for Indian job seekers.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="hover:text-primary">Contact</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <Link href="/disclaimer" className="hover:text-primary">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
