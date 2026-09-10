'use client'

import * as React from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number // ms
  className?: string
}

export function AnimatedNumber({ value, duration = 1500, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  const [hasStarted, setHasStarted] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true)
          const startTime = Date.now()
          const startValue = 0
          const endValue = value

          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // Ease-out cubic for natural deceleration
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = Math.round(startValue + (endValue - startValue) * eased)
            setDisplayValue(current)

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration, hasStarted])

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  )
}
