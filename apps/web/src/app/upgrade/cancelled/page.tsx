'use client'

import Link from 'next/link'

export default function UpgradeCancelledPage() {
  return (
    <div className="min-h-dvh bg-truffle-bg flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-sm">
        <span className="text-4xl">👋</span>
        <h1 className="text-xl font-bold text-truffle-text">No worries</h1>
        <p className="text-truffle-text-secondary text-sm">
          You can upgrade to Pro anytime from the app settings.
        </p>
        <Link
          href="/chat"
          className="inline-block mt-2 px-6 py-3 rounded-xl bg-truffle-amber text-truffle-bg font-bold text-sm active:scale-95 transition-all"
        >
          Back to Truffle
        </Link>
      </div>
    </div>
  )
}
