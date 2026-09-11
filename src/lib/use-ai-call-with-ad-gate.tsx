'use client'

import * as React from 'react'
import { AdGateModal } from '@/components/ad-gate-modal'

/**
 * Hook that wraps an AI tool API call with ad-gate retry logic.
 *
 * Usage:
 *   const { call, loading, adGateState } = useAICallWithAdGate()
 *   const result = await call('/api/ai/resume-optimize', {
 *     tool: 'resumeOptimizations',
 *     toolLabel: 'AI Resume Optimizer',
 *     body: { resume, jobDescription: jd },
 *   })
 *
 * Flow:
 *   1. First call attempts the API without adToken
 *   2. If 403 with requiresAd: true → opens AdGateModal
 *   3. User watches ad → token issued → modal closes → API retried with ?adToken=xxx
 *   4. Returns final result
 *
 * Caller doesn't need to manage modal state or retry logic.
 */

interface AdGateState {
  open: boolean
  tool: string
  toolLabel: string
}

interface CallOptions {
  tool: string  // 'resumeOptimizations' | 'atsChecks' | etc.
  toolLabel: string  // 'AI Resume Optimizer' | etc.
  body: any  // JSON body for the POST request
}

interface CallResult {
  ok: boolean
  data?: any
  error?: string
}

export function useAICallWithAdGate() {
  const [adGateState, setAdGateState] = React.useState<AdGateState>({
    open: false,
    tool: '',
    toolLabel: '',
  })
  const [loading, setLoading] = React.useState(false)
  const pendingCallRef = React.useRef<{ url: string; options: CallOptions; resolve: (r: CallResult) => void; reject: (e: any) => void } | null>(null)

  const call = React.useCallback(async (url: string, options: CallOptions): Promise<CallResult> => {
    setLoading(true)
    try {
      // First attempt — no adToken
      const firstResult = await doFetch(url, options.body)
      if (firstResult.ok || !firstResult.requiresAd) {
        return firstResult
      }

      // Got 403 with requiresAd: true — show AdGate modal + wait for token
      return new Promise<CallResult>((resolve, reject) => {
        pendingCallRef.current = { url, options, resolve, reject }
        setAdGateState({
          open: true,
          tool: options.tool,
          toolLabel: options.toolLabel,
        })
      })
    } catch (e: any) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdWatched = React.useCallback(async (token: string) => {
    const pending = pendingCallRef.current
    if (!pending) return
    pendingCallRef.current = null
    setAdGateState({ open: false, tool: '', toolLabel: '' })
    setLoading(true)
    try {
      const result = await doFetch(`${pending.url}?adToken=${encodeURIComponent(token)}`, pending.options.body)
      pending.resolve(result)
    } catch (e: any) {
      pending.reject(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdGateClose = React.useCallback(() => {
    const pending = pendingCallRef.current
    pendingCallRef.current = null
    setAdGateState({ open: false, tool: '', toolLabel: '' })
    if (pending) {
      pending.resolve({ ok: false, error: 'Ad watch cancelled. Try again or upgrade to Pro.' })
    }
  }, [])

  // Render the AdGateModal — caller should include this in their JSX
  const adGateModal = (
    <AdGateModal
      open={adGateState.open}
      tool={adGateState.tool}
      toolLabel={adGateState.toolLabel}
      onClose={handleAdGateClose}
      onAdWatched={handleAdWatched}
    />
  )

  return { call, loading, adGateModal }
}

async function doFetch(url: string, body: any): Promise<CallResult & { requiresAd?: boolean }> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    return {
      ok: false,
      error: data.error || 'Request failed',
      requiresAd: data.requiresAd,
    }
  }
  return { ok: true, data }
}
