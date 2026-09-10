'use client'

import * as React from 'react'

interface AnimatedNumberProps {
  value: number
  className?: string
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {value > 0 ? value : '…'}
    </span>
  )
}
