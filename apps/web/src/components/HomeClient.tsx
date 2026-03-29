'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dashboard } from './Dashboard'
import { AuthPage } from './AuthPage'

export function HomeClient() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (userId === undefined) return null
  if (!userId) return <AuthPage />
  return <Dashboard userId={userId} />
}
