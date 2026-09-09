'use client'

import { create } from 'zustand'

export type ViewId =
  | 'home'
  | 'discover'
  | 'all-jobs'
  | 'job-detail'
  | 'companies'
  | 'company-detail'
  | 'insights'
  | 'ground-truth'
  | 'freshers'
  | 'internships'
  | 'walk-in'
  | 'hidden'
  | 'saved'
  | 'ai-resume'
  | 'ai-cover-letter'
  | 'ai-mock-interview'
  | 'ai-salary'
  | 'tracker'
  | 'about'
  | 'pricing'
  | 'sync-status'
  | 'salary-dashboard'
  | 'question-bank'
  | 'skill-gap'
  | 'compare-jobs'
  | 'ats-score'
  | 'auth'
  | 'profile'
  | 'alerts'

interface NavState {
  view: ViewId
  jobFilter: { q?: string; category?: string; company?: string }
  selectedJobId: string | null
  selectedCompanySlug: string | null
  setView: (view: ViewId) => void
  setJobFilter: (filter: { q?: string; category?: string; company?: string }) => void
  go: (view: ViewId, jobFilter?: { q?: string; category?: string; company?: string }) => void
  openJob: (jobId: string) => void
  openCompany: (slug: string) => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useNav = create<NavState>((set) => ({
  view: 'home',
  jobFilter: {},
  selectedJobId: null,
  selectedCompanySlug: null,
  setView: (view) => set({ view }),
  setJobFilter: (jobFilter) => set({ jobFilter }),
  go: (view, jobFilter) =>
    set({ view, jobFilter: jobFilter || {}, sidebarOpen: false }),
  openJob: (jobId) =>
    set({ view: 'job-detail', selectedJobId: jobId, sidebarOpen: false }),
  openCompany: (slug) =>
    set({ view: 'company-detail', selectedCompanySlug: slug, sidebarOpen: false }),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
