'use client'

import * as React from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number // ms
  className?: string
}

export function AnimatedNumber({ value, duration = 1200, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(value > 0 ? value : 0)
  const prevValueRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // If value is 0 (data not loaded), show a pulsing dots indicator
    if (value <= 0) {
      setDisplayValue(0)
      return
    }

    // Cancel any ongoing animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    const startValue = prevValueRef.current
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)
      setDisplayValue(current)
      prevValueRef.current = current

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
        setDisplayValue(endValue)
      }
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue > 0 ? displayValue : '…'}
    </span>
  )
}
