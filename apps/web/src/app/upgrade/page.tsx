'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoadingDots } from '@/components/PageMotion'

/**
 * Entry point for the Pro upgrade flow (linked from the landing page).
 * Checks auth — if not logged in, redirects to auth with ?next=/upgrade.
 * If logged in, immediately triggers the Stripe Checkout redirect.
 */
export default function UpgradePage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/?next=/upgrade`)
        return
      }

      try {
        const res = await fetch('/api/stripe/checkout', { method: 'POST' })
        const json = await res.json()
        if (json.url) {
          window.location.href = json.url
        } else {
          router.replace('/chat')
        }
      } catch {
        router.replace('/chat')
      }
    }
    run()
  }, [router])

  return (
    <div className="min-h-dvh bg-truffle-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingDots />
        <p className="text-sm text-truffle-text-secondary">Opening checkout…</p>
      </div>
    </div>
  )
}
