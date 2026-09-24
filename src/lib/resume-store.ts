/**
 * Resume Store — shares uploaded resume text across all AI tool pages.
 *
 * Problem this solves:
 *   User uploads resume on Resume Optimizer → switches to ATS Score Checker
 *   → resume text is lost → user must re-upload.
 *
 * Solution: persist resume text to localStorage + an in-memory store.
 * All AI tools read from this store on mount, so switching pages
 * preserves the uploaded resume.
 *
 * Usage:
 *   // In any AI tool component:
 *   const { resumeText, setResumeText } = useResumeStore()
 *
 *   // On upload:
 *   setResumeText(extractedText)
 *
 *   // On mount: resumeText is already populated from localStorage
 */

import * as React from 'react'

const STORAGE_KEY = 'hirebase.resumeText'
const STORAGE_TIMESTAMP_KEY = 'hirebase.resumeTimestamp'

// Max age: 1 hour — after that, force re-upload for security
const MAX_AGE_MS = 60 * 60 * 1000

// In-memory cache — survives across page navigations within the same SPA session
let memoryCache: string | null = null
let memoryTimestamp: number | null = null

function loadFromStorage(): string | null {
  if (typeof window === 'undefined') return null

  // Check memory cache first (faster)
  if (memoryCache !== null && memoryTimestamp !== null) {
    const age = Date.now() - memoryTimestamp
    if (age < MAX_AGE_MS) return memoryCache
  }

  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY)
    if (stored && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10)
      if (age < MAX_AGE_MS) {
        memoryCache = stored
        memoryTimestamp = parseInt(timestamp, 10)
        return stored
      }
      // Expired — clear
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
    }
  } catch {
    // localStorage not available
  }
  return null
}

function saveToStorage(text: string) {
  memoryCache = text
  memoryTimestamp = Date.now()
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, text)
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, String(memoryTimestamp))
  } catch {
    // localStorage full or not available
  }
}

function clearStorage() {
  memoryCache = null
  memoryTimestamp = null
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
  } catch {}
}

// React hook for components to use
export function useResumeStore() {
  const [resumeText, setResumeTextState] = React.useState<string | null>(null)

  // Load on mount
  React.useEffect(() => {
    setResumeTextState(loadFromStorage())
  }, [])

  const setResumeText = React.useCallback((text: string) => {
    if (text) {
      saveToStorage(text)
      setResumeTextState(text)
    } else {
      clearStorage()
      setResumeTextState(null)
    }
  }, [])

  const clearResume = React.useCallback(() => {
    clearStorage()
    setResumeTextState(null)
  }, [])

  return { resumeText, setResumeText, clearResume }
}
