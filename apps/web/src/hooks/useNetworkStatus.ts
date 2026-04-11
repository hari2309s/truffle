'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { flushQueuedActions, offlineDb } from '@/lib/offline-db'

export function useNetworkStatus() {
  // Always start as true (optimistic) to match the SSR-rendered HTML and
  // avoid a hydration mismatch. The real value is synced in the useEffect below.
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
    // Sync the real navigator.onLine value after mount (avoids SSR mismatch)
    setIsOnline(navigator.onLine)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      sync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sync])

  useEffect(() => {
    const refresh = () =>
      offlineDb.queuedActions
        .count()
        .then(setPendingCount)
        .catch(() => {})
    refresh()
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [])

  return { isOnline, isSyncing, pendingCount, sync }
}
