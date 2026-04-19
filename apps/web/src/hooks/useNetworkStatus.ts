'use client'

import { useEffect, useState, useCallback } from 'react'
import { liveQuery } from 'dexie'
import { useQueryClient } from '@tanstack/react-query'
import { flushQueuedActions, offlineDb } from '@/lib/offline-db'

/**
 * Tracks online/offline state, pending queued-action count, and sync status.
 * Accepts an optional onOnline callback fired in addition to the default
 * queue flush — use this when a consumer needs its own reconnect logic
 * (e.g. useFinancialChat flushing pending chat messages).
 *
 * Always initialises isOnline to true to match SSR output and avoid a
 * hydration mismatch. The real value is synced after mount.
 */
export function useNetworkStatus(onOnline?: () => void) {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const queryClient = useQueryClient()

  const sync = useCallback(async () => {
    setIsSyncing(true)
    try {
      const flushed = await flushQueuedActions()
      if (flushed > 0) {
        queryClient.invalidateQueries()
      }
    } finally {
      setIsSyncing(false)
    }
  }, [queryClient])

  useEffect(() => {
    setIsOnline(navigator.onLine)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      sync()
      onOnline?.()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sync, onOnline])

  useEffect(() => {
    const subscription = liveQuery(() => offlineDb.queuedActions.count()).subscribe({
      next: (count) => setPendingCount(count),
      error: () => {},
    })
    return () => subscription.unsubscribe()
  }, [])

  return { isOnline, isSyncing, pendingCount, sync }
}
