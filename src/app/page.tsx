'use client'

import * as React from 'react'
import { useNav } from '@/lib/nav-store'
import { Sidebar, TopNav, BottomNav } from '@/components/layout/sidebar'
import { CommandPalette } from '@/components/command/command-palette'
import { HomeView } from '@/components/views/home-view'
import { JobsView } from '@/components/views/jobs-view'
import { JobDetailView } from '@/components/views/job-detail-view'
import { CompanyDetailView } from '@/components/views/company-detail-view'
import { CompaniesView } from '@/components/views/companies-view'
import { InsightsView } from '@/components/views/insights-view'
import { DiscoverView } from '@/components/views/discover-view'
import { GroundTruthView } from '@/components/views/ground-truth-view'
import { AboutView } from '@/components/views/about-view'
import { PricingView } from '@/components/views/pricing-view'
import { SavedJobsView } from '@/components/views/saved-jobs-view'
import { TrackerView } from '@/components/views/tracker-view'
import { SyncStatusView } from '@/components/views/sync-status-view'
import { AIResumeOptimizer } from '@/components/views/ai-resume-view'
import { AICoverLetter } from '@/components/views/ai-cover-letter-view'
import { AIMockInterview } from '@/components/views/ai-mock-interview-view'
import { AISalaryPredictor } from '@/components/views/ai-salary-view'

export default function Home() {
  const { view } = useNav()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 px-4 lg:px-6 py-6 pb-24 lg:pb-6">
            <div className="max-w-7xl mx-auto">
              <ViewRouter view={view} />
            </div>
          </main>
        </div>
      </div>

      <Footer />
      <BottomNav />
      <CommandPalette />
    </div>
  )
}

function ViewRouter({ view }: { view: string }) {
  switch (view) {
    case 'home':
      return <HomeView />
    case 'discover':
      return <DiscoverView />
    case 'all-jobs':
      return <JobsView />
    case 'job-detail':
      return <JobDetailView />
    case 'companies':
      return <CompaniesView />
    case 'company-detail':
      return <CompanyDetailView />
    case 'insights':
      return <InsightsView />
    case 'ground-truth':
      return <GroundTruthView />
    case 'freshers':
      return <JobsView fixedCategory="fresher" fixedTitle="Fresher Jobs" />
    case 'internships':
      return <JobsView fixedCategory="internship" fixedTitle="Internships" />
    case 'walk-in':
      return <JobsView fixedCategory="walk-in" fixedTitle="Walk-in Jobs" />
    case 'hidden':
      return <JobsView fixedCategory="hidden" fixedTitle="Hidden Jobs" />
    case 'saved':
      return <SavedJobsView />
    case 'ai-resume':
      return <AIResumeOptimizer />
    case 'ai-cover-letter':
      return <AICoverLetter />
    case 'ai-mock-interview':
      return <AIMockInterview />
    case 'ai-salary':
      return <AISalaryPredictor />
    case 'tracker':
      return <TrackerView />
    case 'about':
      return <AboutView />
    case 'pricing':
      return <PricingView />
    case 'sync-status':
      return <SyncStatusView />
    default:
      return <HomeView />
  }
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
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="font-extrabold">CareerNest</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Career intelligence platform for verified jobs, AI tools, and editorial guidance.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Find Jobs</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => go('all-jobs')} className="hover:text-primary text-muted-foreground">All Jobs</button></li>
              <li><button onClick={() => go('freshers')} className="hover:text-primary text-muted-foreground">Freshers</button></li>
              <li><button onClick={() => go('internships')} className="hover:text-primary text-muted-foreground">Internships</button></li>
              <li><button onClick={() => go('hidden')} className="hover:text-primary text-muted-foreground">Hidden Jobs</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">AI Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => go('ai-resume')} className="hover:text-primary text-muted-foreground">Resume Optimizer</button></li>
              <li><button onClick={() => go('ai-cover-letter')} className="hover:text-primary text-muted-foreground">Cover Letter</button></li>
              <li><button onClick={() => go('ai-mock-interview')} className="hover:text-primary text-muted-foreground">Mock Interview</button></li>
              <li><button onClick={() => go('ai-salary')} className="hover:text-primary text-muted-foreground">Salary Predictor</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => go('about')} className="hover:text-primary text-muted-foreground">About</button></li>
              <li><button onClick={() => go('ground-truth')} className="hover:text-primary text-muted-foreground">Ground Truth</button></li>
              <li><button onClick={() => go('pricing')} className="hover:text-primary text-muted-foreground">Pricing</button></li>
              <li><button onClick={() => go('tracker')} className="hover:text-primary text-muted-foreground">Tracker</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CareerNest. Built for Indian job seekers.</p>
          <p>Contact: contact@careernest.org</p>
        </div>
      </div>
    </footer>
  )
}
