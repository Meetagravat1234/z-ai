// Job Aggregator Mini-Service
// Runs node-cron every 5 minutes, hits the Next.js /api/sync endpoint
// to trigger a job-source sync (one source per cycle, round-robin).
//
// Port 3001 (internal). Caddy forwards /?XTransformPort=3001 to this service.

import cron from 'node-cron'
import http from 'http'
import { setTimeout as sleep } from 'timers/promises'

const PORT = 3001
const NEXT_API = 'http://localhost:3000'

console.log(`[job-aggregator] Service starting on port ${PORT}`)

// In-memory state — last sync result (for the /status endpoint)
let lastSync: any = null
let isRunning = false
let syncCount = 0

async function runSync(forced?: { source: string; param?: string }) {
  if (isRunning) {
    console.log('[job-aggregator] Sync already in progress, skipping')
    return { ok: false, error: 'Sync already in progress' }
  }
  isRunning = true
  syncCount++
  const start = Date.now()
  const url = forced
    ? `${NEXT_API}/api/sync?source=${forced.source}${forced.param ? `&param=${encodeURIComponent(forced.param)}` : ''}`
    : `${NEXT_API}/api/sync`

  console.log(`[job-aggregator] #${syncCount} Triggering sync: ${url}`)
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(180_000) }) // 3 min max per sync
    const d = await r.json()
    lastSync = {
      runNumber: syncCount,
      ts: new Date().toISOString(),
      durationMs: Date.now() - start,
      result: d,
    }
    console.log(`[job-aggregator] #${syncCount} Done in ${lastSync.durationMs}ms:`, {
      ok: d.ok,
      source: d.source,
      param: d.param,
      jobsFound: d.jobsFound,
      jobsAdded: d.jobsAdded,
      jobsSkipped: d.jobsSkipped,
      enriched: d.enriched,
      error: d.error,
    })
    return d
  } catch (e: any) {
    lastSync = {
      runNumber: syncCount,
      ts: new Date().toISOString(),
      durationMs: Date.now() - start,
      error: e.message,
    }
    console.error(`[job-aggregator] #${syncCount} Failed:`, e.message)
    return { ok: false, error: e.message }
  } finally {
    isRunning = false
  }
}

// Schedule: every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await runSync()
})

// Run an initial sync 10 seconds after startup (so Next.js is up)
;(async () => {
  await sleep(10_000)
  console.log('[job-aggregator] Running initial sync on startup')
  await runSync()
})()

// Tiny HTTP server for /status + /trigger (manual sync)
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.url === '/status') {
    res.end(JSON.stringify({
      service: 'job-aggregator',
      port: PORT,
      isRunning,
      syncCount,
      lastSync,
      cronExpression: '*/5 * * * *',
      nextSyncAt: new Date(Date.now() + (5 * 60 * 1000 - (Date.now() % (5 * 60 * 1000)))).toISOString(),
    }, null, 2))
    return
  }

  if (req.url?.startsWith('/trigger')) {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const source = url.searchParams.get('source')
    const param = url.searchParams.get('param')
    const result = await runSync(source ? { source, param: param || undefined } : undefined)
    res.end(JSON.stringify(result, null, 2))
    return
  }

  res.end(JSON.stringify({
    service: 'job-aggregator',
    endpoints: ['/status', '/trigger?source=greenhouse&param=google'],
  }))
})

server.listen(PORT, () => {
  console.log(`[job-aggregator] HTTP status server listening on :${PORT}`)
})
