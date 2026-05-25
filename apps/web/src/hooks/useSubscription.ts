'use client'

import { useQuery } from '@tanstack/react-query'

export type Plan = 'free' | 'pro'

export interface SubscriptionStatus {
  plan: Plan
  receiptScansUsed: number
  receiptScanLimit: number | null // null = unlimited (Pro)
}

export function useSubscription(userId: string) {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      const res = await fetch('/api/subscription/status')
      if (!res.ok) throw new Error('Failed to fetch subscription status')
      return res.json()
    },
    // Cache for 5 minutes — refreshed explicitly after checkout success
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}
