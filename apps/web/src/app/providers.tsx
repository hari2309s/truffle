'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, Suspense } from 'react'
import { PostHogProvider } from './posthog-provider'
import { PostHogPageView } from './posthog-pageview'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { OfflineBanner } from '@/components/OfflineBanner'
import { CookieBanner } from '@/components/CookieBanner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            networkMode: 'always', // let queryFn handle offline fallback
          },
        },
      })
  )

  // Listen for SW sync-complete messages and refresh queries
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        queryClient.invalidateQueries()
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [queryClient])

  return (
    <PostHogProvider>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col h-dvh overflow-hidden">
            <OfflineBanner />
            {children}
          </div>
          <CookieBanner />
        </QueryClientProvider>
      </LanguageProvider>
    </PostHogProvider>
  )
}
