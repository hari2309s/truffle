'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks navigator.onLine state and fires an optional callback when the
 * browser comes back online. Always initialises to `true` (optimistic) so
 * the SSR-rendered HTML and the first client render match, preventing a
 * hydration mismatch. The real value is synced after mount.
 */
export function useIsOnline(onOnline?: () => void): boolean {
  // Always start as true to match SSR and avoid hydration mismatch.
  // The real value is synced after mount via the effect below.
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      onOnline?.()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onOnline])

  return isOnline
}
