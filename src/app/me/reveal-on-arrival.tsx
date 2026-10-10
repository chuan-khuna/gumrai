'use client'

import { useEffect, useRef } from 'react'

// Brings its content into view once, when the page arrives with it: a message about binding
// Discord, shown in the sign-in section after the round trip to Discord lands on the top of
// /me. Smooth only when motion is welcome.
export function RevealOnArrival({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' })
  }, [])
  return <div ref={ref}>{children}</div>
}
