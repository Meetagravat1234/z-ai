// Shared type for SSR-provided initial home data.
// Kept separate from home-shell.tsx so home-view.tsx can import it
// without creating a circular dependency (server page → home-shell → home-view → home-shell).
export interface HomeInitialData {
  initialJobs: any[]
  initialCompanies: any[]
  initialArticles: any[]
  stats: { jobs: number; companies: number }
}
