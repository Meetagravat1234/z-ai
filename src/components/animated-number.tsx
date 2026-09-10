'use client'

import * as React from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number // ms for the real animation once value arrives
  className?: string
}

export function AnimatedNumber({ value, duration = 2000, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  const animationRef = React.useRef<number | null>(null)
  const lastValueRef = React.useRef(0)

  React.useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const startValue = lastValueRef.current // Start from wherever we left off
    const endValue = value

    // If value is 0 (not loaded yet), do a slow fake increment to show "life"
    if (endValue === 0) {
      let fakeValue = 0
      const fakeAnimate = () => {
        fakeValue += 1
        // Don't go past ~80% of what we expect (so it never overshoots)
        if (fakeValue <= 250) {
          setDisplayValue(fakeValue)
          animationRef.current = requestAnimationFrame(() => {
            setTimeout(fakeAnimate, 80) // Slow increment: ~12/sec
          })
        }
      }
      fakeAnimate()
      return
    }

    // Real animation: smoothly animate from current to target
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)
      setDisplayValue(current)
      lastValueRef.current = current

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [value, duration])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue}
    </span>
  )
}
