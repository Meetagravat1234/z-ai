'use client'

import * as React from 'react'
import { Upload, FileText, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ResumeUploadProps {
  onTextExtracted: (text: string) => void
  /** Current text value — so we can show "or paste below" context */
  currentText?: string
  /** Label for the upload area */
  label?: string
}

export function ResumeUpload({ onTextExtracted, currentText, label = 'Upload resume' }: ResumeUploadProps) {
  const [dragging, setDragging] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [error, setError] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError('')
    setFileName(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const r = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      })
      const d = await r.json()

      if (!r.ok) throw new Error(d.error || 'Upload failed')

      onTextExtracted(d.text)
      setFileName(d.fileName)
      toast.success(`Extracted ${d.charCount} chars from ${d.fileName}${d.truncated ? ' (truncated to 15k)' : ''}`)
    } catch (e: any) {
      setError(e.message)
      toast.error('File upload failed')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-muted/30',
          loading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleChange}
          className="hidden"
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Extracting text…</span>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium">{fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setFileName(null); onTextExtracted('') }}
              className="p-0.5 rounded-full hover:bg-muted"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <strong className="text-primary">{label}</strong> or drag & drop
            </span>
            <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
              PDF, DOC, DOCX, TXT (max 5MB)
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Divider with "or" */}
      {fileName && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Or edit extracted text below</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}
    </div>
  )
}
