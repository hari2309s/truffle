'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { flushQueue, QUEUE_EVENT, readQueue } from '@/lib/offlineQueue'

/** Connection state + this user's queued-entry count; flushes on reconnect. */
export function useOfflineQueue(userId: string) {
  const queryClient = useQueryClient()
  const [online, setOnline] = useState(true)
  const [waiting, setWaiting] = useState(0)
  const [dropped, setDropped] = useState(0)

  const retry = useCallback(async () => {
    const result = await flushQueue(userId)
    if (result.dropped) setDropped((n) => n + result.dropped)
    if (result.saved > 0) await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
  }, [queryClient, userId])

  useEffect(() => {
    const sync = () => {
      setOnline(navigator.onLine)
      setWaiting(readQueue(userId).length)
    }
    const onOnline = () => {
      sync()
      void retry()
    }
    sync()
    if (navigator.onLine && readQueue(userId).length) void retry()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', sync)
    window.addEventListener(QUEUE_EVENT, sync)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', sync)
      window.removeEventListener(QUEUE_EVENT, sync)
    }
  }, [retry, userId])

  return { online, waiting, dropped, dismissDropped: () => setDropped(0), retry }
}
