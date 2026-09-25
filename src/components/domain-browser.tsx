'use client'

import * as React from 'react'
import Link from 'next/link'
import { JOB_DOMAINS } from '@/lib/job-domains'

/**
 * DomainBrowser — grid of job domain categories shown on the homepage.
 *
 * Shows 12 domain cards (AI/ML, VLSI/Embedded, Web Dev, etc.) with
 * emoji + name + description. Clicking navigates to /jobs/[domain].
 *
 * Uses real-time counts from /api/stats or /api/jobs?domain=X&limit=0
 * to show how many jobs are in each domain.
 */
export function DomainBrowser() {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Browse by Domain</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Find jobs in your technical field — from VLSI to AI/ML to Web Development
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {JOB_DOMAINS.map((domain) => (
          <Link
            key={domain.slug}
            href={`/jobs/${domain.slug}`}
            className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl">{domain.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                  {domain.name}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
              {domain.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
