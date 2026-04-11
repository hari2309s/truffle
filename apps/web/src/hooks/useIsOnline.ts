'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks navigator.onLine state and fires an optional callback when the
 * browser comes back online. SSR-safe: defaults to `true` on the server.
 */
export function useIsOnline(onOnline?: () => void): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

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
