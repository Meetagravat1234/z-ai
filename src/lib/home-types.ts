// Shared type for SSR-provided initial home data.
// Kept separate from home-shell.tsx so home-view.tsx can import it
// without creating a circular dependency (server page → home-shell → home-view → home-shell).
export interface HomeInitialData {
  initialJobs: any[]          // 6 jobs for the home page hero "Featured jobs" section
  initialCompanies: any[]     // 8 companies for "Top companies hiring" section
  initialArticles: any[]      // 3 latest articles for "Career insights" section
  stats: { jobs: number; companies: number }
  // Jobs for the All Jobs / Fresher / Internship views — pre-fetched on SSR
  // so they show instantly when the user clicks those sidebar items.
  // Without this, every view switch triggers a 2-3s loading spinner.
  initialAllJobs?: any[]      // 60 most recent India-only jobs (for "All Jobs" view)
  initialAllJobsTotal?: number
  initialFresherJobs?: any[]  // first 60 fresher jobs
  initialFresherJobsTotal?: number
  initialInternshipJobs?: any[]
  initialInternshipJobsTotal?: number
  initialWalkInJobs?: any[]
  initialWalkInJobsTotal?: number
  initialHiddenJobs?: any[]
  initialHiddenJobsTotal?: number
}

