// Job Aggregator Mini-Service (v2)
// - Cron every 30 minutes (per user request: "auto update every half an hour")
// - Triggers PARALLEL multi-source sync for maximum throughput (7+ sources at once)
// - Each cycle: ~30-60 new jobs added with AI enrichment
// - Plus: runs an initial boost sync on startup
//
// Port 3001 (internal). Caddy forwards /?XTransformPort=3001 to this service.

import cron from 'node-cron'
import http from 'http'
import { setTimeout as sleep } from 'timers/promises'

const PORT = 3001
const NEXT_API = 'http://localhost:3000'

console.log(`[job-aggregator] Service starting on port ${PORT}`)
console.log(`[job-aggregator] Cron: every 30 minutes (parallel multi-source sync)`)

let lastSync: any = null
let isRunning = false
let syncCount = 0

async function runParallelSync(forced?: { source: string; param?: string }) {
  if (isRunning) {
    console.log('[job-aggregator] Sync already in progress, skipping')
    return { ok: false, error: 'Sync already in progress' }
  }
  isRunning = true
  syncCount++
  const start = Date.now()
  const url = forced
    ? `${NEXT_API}/api/sync/parallel?source=${forced.source}${forced.param ? `&param=${encodeURIComponent(forced.param)}` : ''}`
    : `${NEXT_API}/api/sync/parallel`

  console.log(`[job-aggregator] #${syncCount} Triggering PARALLEL sync: ${url}`)
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(300_000) }) // 5 min max per parallel cycle
    const d = await r.json()
    lastSync = {
      runNumber: syncCount,
      ts: new Date().toISOString(),
      durationMs: Date.now() - start,
      result: d,
    }
    console.log(`[job-aggregator] #${syncCount} Done in ${lastSync.durationMs}ms:`, {
      ok: d.ok,
      mode: d.mode,
      sourcesRun: d.sourcesRun,
      totalJobsFound: d.totalJobsFound,
      totalJobsAdded: d.totalJobsAdded,
      totalJobsSkipped: d.totalJobsSkipped,
      totalEnriched: d.totalEnriched,
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

// Schedule: every 30 minutes (per user request)
cron.schedule('*/30 * * * *', async () => {
  console.log(`[job-aggregator] [${new Date().toISOString()}] Cron tick — starting parallel sync`)
  await runParallelSync()
})

// Run an initial sync 15 seconds after startup (so Next.js is up)
;(async () => {
  await sleep(15_000)
  console.log('[job-aggregator] Running initial parallel sync on startup')
  await runParallelSync()
})()

// Tiny HTTP server for /status + /trigger (manual sync)
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.url === '/status') {
    res.end(JSON.stringify({
      service: 'job-aggregator-v2',
      port: PORT,
      isRunning,
      syncCount,
      lastSync,
      cronExpression: '*/30 * * * *',
      mode: 'parallel-multi-source',
      nextSyncAt: new Date(Date.now() + (30 * 60 * 1000 - (Date.now() % (30 * 60 * 1000)))).toISOString(),
    }, null, 2))
    return
  }

  if (req.url?.startsWith('/trigger')) {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const source = url.searchParams.get('source')
    const param = url.searchParams.get('param')
    const result = await runParallelSync(source ? { source, param: param || undefined } : undefined)
    res.end(JSON.stringify(result, null, 2))
    return
  }

  res.end(JSON.stringify({
    service: 'job-aggregator-v2',
    endpoints: ['/status', '/trigger', '/trigger?source=web-search', '/trigger?source=career-page'],
    schedule: 'every 30 minutes',
    mode: 'parallel multi-source (7+ sources per cycle)',
  }))
})

server.listen(PORT, () => {
  console.log(`[job-aggregator] HTTP status server listening on :${PORT}`)
})
