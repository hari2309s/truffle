'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

export default function UpgradeSuccessPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Invalidate the cached subscription status so the UI immediately reflects Pro
    queryClient.invalidateQueries({ queryKey: ['subscription'] })

    const timer = setTimeout(() => {
      router.replace('/chat')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router, queryClient])

  return (
    <div className="min-h-dvh bg-truffle-bg flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-sm">
        <span className="text-5xl">🎉</span>
        <h1 className="text-2xl font-black text-truffle-text">Welcome to Pro!</h1>
        <p className="text-truffle-text-secondary text-sm">
          You now have unlimited AI chat, voice transcription, receipt scanning, and AI insights.
        </p>
        <p className="text-xs text-truffle-muted">Redirecting you to the app…</p>
      </div>
    </div>
  )
}
