'use client'

import * as React from 'react'

interface AnimatedNumberProps {
  value: number
  storageKey?: string // localStorage key for caching
  fallback?: number // hardcoded fallback if no cache
  className?: string
}

export function AnimatedNumber({ value, storageKey = '', fallback = 0, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState<number | null>(null)

  React.useEffect(() => {
    // Step 1: Show cached value or fallback IMMEDIATELY (no waiting)
    if (storageKey && typeof window !== 'undefined') {
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        setDisplayValue(parseInt(cached, 10))
      } else {
        setDisplayValue(fallback)
      }
    } else {
      setDisplayValue(fallback)
    }

    // Step 2: When real value arrives, update + cache it
    if (value > 0) {
      setDisplayValue(value)
      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(value))
      }
    }
  }, [value, storageKey, fallback])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue !== null ? displayValue : fallback}
    </span>
  )
}
