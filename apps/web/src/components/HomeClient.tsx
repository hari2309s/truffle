'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dashboard } from './Dashboard'
import { AuthPage } from './AuthPage'
import { OnboardingPage } from './OnboardingPage'

type AppState = 'loading' | 'unauthenticated' | 'onboarding' | 'dashboard'

export function HomeClient() {
  const [state, setState] = useState<AppState>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [name, setName] = useState<string>('')
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  const resolveState = (
    session: { user: { id: string; user_metadata: Record<string, unknown> } } | null
  ) => {
    if (!session) {
      setState('unauthenticated')
      setUserId(null)
      setName('')
      return
    }
    setUserId(session.user.id)
    const userName = (session.user.user_metadata?.name as string) ?? ''
    setName(userName)
    setState(userName ? 'dashboard' : 'onboarding')
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

  if (state === 'loading')
    return (
      <div className="min-h-dvh bg-truffle-bg flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-truffle-amber animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  if (state === 'unauthenticated')
    return (
      <AuthPage
        error={
          authError === 'auth_failed'
            ? 'Sign-in link expired or already used. Please request a new one.'
            : null
        }
      />
    )
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
  if (state === 'dashboard' && userId) return <Dashboard userId={userId} name={name} />
  return null
}
