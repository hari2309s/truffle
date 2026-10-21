'use client'

import { NoticeSlip } from '@/components/Tally'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-dvh w-full max-w-lg mx-auto bg-truffle-bg flex flex-col justify-center px-4">
      <NoticeSlip
        tone="negative"
        title="Something went wrong"
        actions={
          <button onClick={reset} className="key key-ink key-3 h-11 text-xs uppercase">
            Try again
          </button>
        }
      >
        {error.message || 'An unexpected error occurred.'}
      </NoticeSlip>
    </div>
  )
}
