'use client'

import { create } from 'zustand'

export type ViewId =
  | 'home'
  | 'discover'
  | 'all-jobs'
  | 'companies'
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

interface NavState {
  view: ViewId
  jobFilter: { q?: string; category?: string; company?: string }
  setView: (view: ViewId) => void
  setJobFilter: (filter: { q?: string; category?: string; company?: string }) => void
  go: (view: ViewId, jobFilter?: { q?: string; category?: string; company?: string }) => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useNav = create<NavState>((set) => ({
  view: 'home',
  jobFilter: {},
  setView: (view) => set({ view }),
  setJobFilter: (jobFilter) => set({ jobFilter }),
  go: (view, jobFilter) =>
    set({ view, jobFilter: jobFilter || {}, sidebarOpen: false }),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
