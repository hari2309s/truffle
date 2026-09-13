'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks the user's `prefers-reduced-motion` setting for framer-motion
 * infinite/looping animations (CSS keyframe animations are guarded via a
 * `@media (prefers-reduced-motion: reduce)` rule in globals.css instead —
 * this hook is only needed for JS-driven `animate`/`transition` props).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}
