'use client'

import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { useLanguage } from '@/contexts/LanguageContext'

/** "◌ Offline · 2 slips waiting · Retry" — shown while offline or while entries wait. */
export function OfflineBar({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const { online, waiting, dropped, dismissDropped, retry } = useOfflineQueue(userId)

  if (dropped > 0) {
    return (
      <div
        role="alert"
        className="mx-4 mt-2.5 py-2.5 px-3.5 bg-truffle-neg-soft text-truffle-negative flex justify-between items-center gap-3 text-xs font-bold uppercase flex-shrink-0"
      >
        <span>■ {t.offline.dropped(dropped)}</span>
        <button type="button" onClick={dismissDropped} className="min-h-8 px-1 uppercase">
          {t.offline.dismiss}
        </button>
      </div>
    )
  }
  if (online && waiting === 0) return null

  return (
    <div
      role="status"
      className="mx-4 mt-2.5 py-2.5 px-3.5 bg-truffle-text text-truffle-bg flex justify-between items-center text-xs font-bold uppercase flex-shrink-0"
    >
      <span>
        ◌ {online ? t.offline.waiting(waiting) : t.offline.offline}
        {!online && waiting > 0 && ` · ${t.offline.slips(waiting)}`}
      </span>
      {waiting > 0 && (
        <button type="button" onClick={() => void retry()} className="min-h-8 px-1 uppercase">
          {t.offline.retry}
        </button>
      )}
    </div>
  )
}
