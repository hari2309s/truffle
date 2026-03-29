'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dashboard } from './Dashboard'
import { AuthPage } from './AuthPage'
import { OnboardingPage } from './OnboardingPage'

type AppState = 'loading' | 'unauthenticated' | 'onboarding' | 'dashboard'

export function HomeClient() {
  const [state, setState] = useState<AppState>('loading')
  const [userId, setUserId] = useState<string | null>(null)

  const resolveState = (
    session: { user: { id: string; user_metadata: Record<string, unknown> } } | null
  ) => {
    if (!session) {
      setState('unauthenticated')
      setUserId(null)
      return
    }
    setUserId(session.user.id)
    const hasName = Boolean(session.user.user_metadata?.name)
    setState(hasName ? 'dashboard' : 'onboarding')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveState(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      resolveState(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (state === 'loading') return null
  if (state === 'unauthenticated') return <AuthPage />
  if (state === 'onboarding' && userId) {
    return (
      <OnboardingPage
        onComplete={async () => {
          // Re-fetch session so user_metadata is fresh
          const {
            data: { session },
          } = await supabase.auth.getSession()
          resolveState(session)
        }}
      />
    )
  }
  if (state === 'dashboard' && userId) return <Dashboard userId={userId} />
  return null
}
