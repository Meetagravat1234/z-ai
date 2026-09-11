'use client'

import * as React from 'react'
import { Download, FileText, FileType, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AdGateModal } from '@/components/ad-gate-modal'
import { generatePdfFromMarkdown, generateDocxFromMarkdown } from '@/lib/resume-export'

interface DownloadButtonsProps {
  /** The markdown text to export (from AI result) */
  markdown: string
  /** Base filename without extension (e.g. "resume" or "cover-letter") */
  baseFileName?: string
  /** Optional class name */
  className?: string
}

export function DownloadButtons({ markdown, baseFileName = 'resume', className }: DownloadButtonsProps) {
  const [downloading, setDownloading] = React.useState<'pdf' | 'docx' | null>(null)
  const [showAdGate, setShowAdGate] = React.useState(false)
  const [pendingFormat, setPendingFormat] = React.useState<'pdf' | 'docx' | null>(null)

  if (!markdown.trim()) return null

  async function handleDownload(format: 'pdf' | 'docx', adToken?: string) {
    setDownloading(format)
    try {
      // Step 1: Check quota + increment via track endpoint
      const url = adToken
        ? `/api/export/track?adToken=${encodeURIComponent(adToken)}`
        : '/api/export/track'
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      const d = await r.json().catch(() => ({}))

      if (!r.ok) {
        // If the API says "watch an ad", show the modal — don't throw
        if (d.requiresAd && !adToken) {
          setPendingFormat(format)
          setShowAdGate(true)
          setDownloading(null)
          return
        }
        throw new Error(d.error || 'Cannot download right now')
      }

      // Step 2: Generate the file client-side
      const fileName = `${baseFileName}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'docx'}`
      if (format === 'pdf') {
        await generatePdfFromMarkdown(markdown, fileName)
      } else {
        await generateDocxFromMarkdown(markdown, fileName)
      }

      // Step 3: Show success toast with remaining quota
      const usage = d
      if (usage?.remaining !== undefined) {
        toast.success(
          `Downloaded ${fileName} · ${usage.remaining} ${format === 'pdf' ? 'PDF' : 'DOCX'} downloads left this month`,
        )
      } else {
        toast.success(`Downloaded ${fileName}`)
      }
    } catch (e: any) {
      console.error('Download error:', e)
      toast.error(e.message || 'Download failed. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  async function handleAdWatched(token: string) {
    setShowAdGate(false)
    if (pendingFormat) {
      const fmt = pendingFormat
      setPendingFormat(null)
      await handleDownload(fmt, token)
    }
  }

  function handleAdGateClose() {
    setShowAdGate(false)
    setPendingFormat(null)
    setDownloading(null)
  }

  return (
    <>
      <div className={cn('flex flex-wrap gap-2', className)}>
        <button
          onClick={() => handleDownload('pdf')}
          disabled={!!downloading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors disabled:opacity-60"
        >
          {downloading === 'pdf' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {downloading === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
        </button>
        <button
          onClick={() => handleDownload('docx')}
          disabled={!!downloading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/10 transition-colors disabled:opacity-60"
        >
          {downloading === 'docx' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileType className="w-3.5 h-3.5" />
          )}
          {downloading === 'docx' ? 'Generating Word…' : 'Download Word'}
        </button>
      </div>
      <AdGateModal
        open={showAdGate}
        tool={pendingFormat === 'pdf' ? 'pdfDownloads' : 'docxDownloads'}
        toolLabel={pendingFormat === 'pdf' ? 'PDF Download' : 'Word Document Download'}
        onClose={handleAdGateClose}
        onAdWatched={handleAdWatched}
      />
    </>
  )
}
