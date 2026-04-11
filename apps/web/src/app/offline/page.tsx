'use client'

export default function OfflinePage() {
  return (
    <div className="h-dvh bg-truffle-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-truffle-surface flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-truffle-muted"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-truffle-text mb-2">You&apos;re offline</h1>
      <p className="text-sm text-truffle-muted max-w-xs">
        No internet connection detected. Check your connection and try again.
      </p>

      <button onClick={() => window.location.reload()} className="mt-8 btn-primary">
        Try again
      </button>
    </div>
  )
}
