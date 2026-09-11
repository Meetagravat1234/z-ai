'use client'

import * as React from 'react'
import { Download, FileText, FileType, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAICallWithAdGate } from '@/lib/use-ai-call-with-ad-gate'
import { generatePdfFromMarkdown, generateDocxFromMarkdown } from '@/lib/resume-export'

interface DownloadButtonsProps {
  /** The markdown text to export (from AI result) */
  markdown: string
  /** Base filename without extension (e.g. "resume" or "cover-letter") */
  baseFileName?: string
  /** Optional class name */
  className?: string
}

/**
 * Two download buttons: PDF + Word (.docx).
 *
 * Both are client-side (no server round-trip for the file itself).
 * Before downloading, calls /api/export/track to:
 *   1. Check user has quota (1 free/month, 50/month for Pro)
 *   2. If not, show AdGate modal (same as AI tools)
 *   3. Increment usage counter
 *
 * The useAICallWithAdGate hook handles the 403 → modal → retry flow.
 * We just call the track endpoint with the same pattern.
 */
export function DownloadButtons({ markdown, baseFileName = 'resume', className }: DownloadButtonsProps) {
  const [downloading, setDownloading] = React.useState<'pdf' | 'docx' | null>(null)
  const { call, adGateModal } = useAICallWithAdGate()

  if (!markdown.trim()) return null

  async function handleDownload(format: 'pdf' | 'docx') {
    setDownloading(format)
    try {
      // Step 1: Check quota + increment (with ad-gate retry built in)
      const trackRes = await call('/api/export/track', {
        tool: format === 'pdf' ? 'pdfDownloads' : 'docxDownloads',
        toolLabel: format === 'pdf' ? 'PDF Download' : 'Word Document Download',
        body: { format },
      })

      if (!trackRes.ok) {
        throw new Error(trackRes.error || 'Cannot download right now')
      }

      // Step 2: Generate the file client-side
      const fileName = `${baseFileName}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'docx'}`
      if (format === 'pdf') {
        await generatePdfFromMarkdown(markdown, fileName)
      } else {
        await generateDocxFromMarkdown(markdown, fileName)
      }

      // Step 3: Show success toast with remaining quota
      const usage = trackRes.data
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
      {adGateModal}
    </>
  )
}
