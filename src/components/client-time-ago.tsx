'use client'

import * as React from 'react'

/**
 * ClientTimeAgo — renders relative time without causing React hydration errors.
 *
 * Why this exists:
 * - The `timeAgo()` function uses `Date.now()` which differs between server
 *   render (T1) and client hydration (T2). If the difference crosses a
 *   minute/hour/day boundary, the rendered text changes → React error #418
 *   (hydration mismatch) → broken event listeners, flickering UI, and the
 *   navbar search bar stops working.
 * - This component renders a stable fallback during SSR (ISO date string)
 *   and only switches to relative time ("3h ago") AFTER hydration on the
 *   client. This guarantees the server HTML always matches the initial
 *   client render.
 *
 * Usage:
 *   <ClientTimeAgo date={job.postedAt} />
 *   (instead of {timeAgo(job.postedAt)})
 */

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2419200) return `${Math.floor(diff / 604800)}w ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDate(dateStr: string): string {
  // Stable format that doesn't depend on Date.now() — used for SSR
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function ClientTimeAgo({ date, className }: { date: string; className?: string }) {
  const [mounted, setMounted] = React.useState(false)
  const [display, setDisplay] = React.useState(() => formatDate(date))

  React.useEffect(() => {
    setMounted(true)
    setDisplay(timeAgo(date))
    // Update every 60 seconds so the relative time stays fresh
    const interval = setInterval(() => {
      setDisplay(timeAgo(date))
    }, 60000)
    return () => clearInterval(interval)
  }, [date])

  // During SSR and initial client render: show stable date string
  // After hydration: show relative time ("3h ago")
  return <span className={className} suppressHydrationWarning>{display}</span>
}
