'use client'

import { NoticeSlip } from '@/components/Tally'
import { ChatShell } from '@/components/ChatShell'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ChatShell>
      <NoticeSlip
        tone="negative"
        title="Chat unavailable"
        className="w-full text-left"
        actions={
          <button onClick={reset} className="key key-ink key-3 h-11 text-xs uppercase">
            Try again
          </button>
        }
      >
        {error.message || 'Something went wrong.'}
      </NoticeSlip>
    </ChatShell>
  )
}
