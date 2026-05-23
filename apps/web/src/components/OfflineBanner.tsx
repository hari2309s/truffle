'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useLanguage } from '@/contexts/LanguageContext'

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useNetworkStatus()
  const { t } = useLanguage()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`w-full text-center py-2 px-4 text-xs font-medium transition-colors flex-shrink-0 ${
        isOnline
          ? 'bg-truffle-amber/20 text-truffle-amber'
          : 'bg-truffle-surface text-truffle-muted'
      }`}
    >
      {!isOnline && t.offlineBanner.offline}
      {isOnline && isSyncing && t.offlineBanner.syncing}
      {isOnline && !isSyncing && pendingCount > 0 && t.offlineBanner.pendingChanges(pendingCount)}
    </div>
  )
}
