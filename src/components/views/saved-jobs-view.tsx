'use client'

import * as React from 'react'
import { Loader2, Bookmark, Trash2 } from 'lucide-react'
import { JobCard, type Job } from '@/components/jobs/job-card'
import { toast } from 'sonner'

export function SavedJobsView() {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/save')
      .then((r) => r.json())
      .then((d) => setJobs((d.saved || []).map((s: any) => s.job).filter(Boolean)))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  async function remove(id: string) {
    await fetch(`/api/save?jobId=${id}`, { method: 'DELETE' })
    toast.success('Removed')
    load()
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Saved Jobs</h1>
        <p className="text-muted-foreground mt-2">
          Jobs you've bookmarked for later. Click any card to view, or remove with the trash icon.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Bookmark className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No saved jobs yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Save jobs from any list by clicking the bookmark icon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="relative">
              <JobCard job={job} />
              <button
                onClick={() => remove(job.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-card border border-border hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                aria-label="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
