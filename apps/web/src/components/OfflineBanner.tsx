'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useNetworkStatus()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 text-center py-2 px-4 text-xs font-medium transition-colors ${
        isOnline
          ? 'bg-truffle-amber/20 text-truffle-amber'
          : 'bg-truffle-surface text-truffle-muted'
      }`}
    >
      {!isOnline && 'Offline — changes will sync when reconnected'}
      {isOnline && isSyncing && 'Syncing…'}
      {isOnline &&
        !isSyncing &&
        pendingCount > 0 &&
        `${pendingCount} pending change${pendingCount > 1 ? 's' : ''} — tap to sync`}
    </div>
  )
}
