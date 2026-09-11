'use client'

import * as React from 'react'
import Link from 'next/link'
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
import { SalaryDashboardView } from '@/components/views/salary-dashboard-view'
import { QuestionBankView } from '@/components/views/question-bank-view'
import { SkillGapView } from '@/components/views/skill-gap-view'
import { CompareJobsView } from '@/components/views/compare-jobs-view'
import { ATSScoreView } from '@/components/views/ats-score-view'
import { AuthView } from '@/components/views/auth-view'
import { ProfileView } from '@/components/views/profile-view'
import { AlertsView } from '@/components/views/alerts-view'
import { AdminDashboardView } from '@/components/views/admin-dashboard-view'
import { AIResumeOptimizer } from '@/components/views/ai-resume-view'
import { AICoverLetter } from '@/components/views/ai-cover-letter-view'
import { AIMockInterview } from '@/components/views/ai-mock-interview-view'
import { AISalaryPredictor } from '@/components/views/ai-salary-view'

import type { HomeInitialData } from '@/lib/home-types'

export default function HomeShell({ initialData }: { initialData: HomeInitialData }) {
  const { view } = useNav()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 px-4 lg:px-6 py-6 pb-24 lg:pb-6">
            <div className="max-w-7xl mx-auto">
              <ViewRouter view={view} initialData={initialData} />
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

function ViewRouter({ view, initialData }: { view: string; initialData?: HomeInitialData }) {
  switch (view) {
    case 'home':
      return <HomeView initialData={initialData} />
    case 'discover':
      return <DiscoverView />
    case 'all-jobs':
      // Pass SSR-fetched jobs so the page renders instantly (no 2-3s loading spinner)
      return (
        <JobsView
          initialJobs={initialData?.initialAllJobs}
          initialTotal={initialData?.initialAllJobsTotal}
        />
      )
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
      return (
        <JobsView
          fixedCategory="fresher"
          fixedTitle="Fresher Jobs"
          initialJobs={initialData?.initialFresherJobs}
          initialTotal={initialData?.initialFresherJobsTotal}
        />
      )
    case 'internships':
      return (
        <JobsView
          fixedCategory="internship"
          fixedTitle="Internships"
          initialJobs={initialData?.initialInternshipJobs}
          initialTotal={initialData?.initialInternshipJobsTotal}
        />
      )
    case 'walk-in':
      return (
        <JobsView
          fixedCategory="walk-in"
          fixedTitle="Walk-in Jobs"
          initialJobs={initialData?.initialWalkInJobs}
          initialTotal={initialData?.initialWalkInJobsTotal}
        />
      )
    case 'hidden':
      return (
        <JobsView
          fixedCategory="hidden"
          fixedTitle="Hidden Jobs"
          initialJobs={initialData?.initialHiddenJobs}
          initialTotal={initialData?.initialHiddenJobsTotal}
        />
      )
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
    case 'salary-dashboard':
      return <SalaryDashboardView />
    case 'question-bank':
      return <QuestionBankView />
    case 'skill-gap':
      return <SkillGapView />
    case 'compare-jobs':
      return <CompareJobsView />
    case 'ats-score':
      return <ATSScoreView />
    case 'auth':
      return <AuthView />
    case 'profile':
      return <ProfileView />
    case 'alerts':
      return <AlertsView />
    case 'admin':
      return <AdminDashboardView />
    default:
      return <HomeView />
  }
}

function Footer() {
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
              <li><Link href="/tracker" className="hover:text-primary text-muted-foreground">Tracker</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Hirebase. Built for Indian job seekers.</p>
          <p>Contact: contact@hirebase.in</p>
        </div>
      </div>
    </footer>
  )
}
