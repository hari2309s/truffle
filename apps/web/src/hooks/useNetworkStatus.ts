'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { flushQueuedActions, offlineDb } from '@/lib/offline-db'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
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
