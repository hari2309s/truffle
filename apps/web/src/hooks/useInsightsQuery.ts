import { useQuery } from '@tanstack/react-query'
import type { Anomaly, SpendTrend, TransactionCategory } from '@truffle/types'

function mapAnomaly(row: Record<string, unknown>): Anomaly {
  return {
    id: row.id as string,
    transactionId: (row.transaction_id ?? row.transactionId) as string,
    type: row.type as Anomaly['type'],
    severity: row.severity as Anomaly['severity'],
    description: row.description as string,
    detectedAt: (row.detected_at ?? row.detectedAt) as string,
  }
}

function mapTrend(row: Record<string, unknown>): SpendTrend {
  return {
    category: row.category as TransactionCategory,
    currentSpend: Number(row.currentSpend),
    averageSpend: Number(row.averageSpend),
    changePct: Number(row.changePct),
    absoluteDelta: Number(row.absoluteDelta),
  }
}

export interface InsightsData {
  anomalies: Anomaly[]
  trends: SpendTrend[]
}

/** Canonical query for the ['insights', userId, month] cache key. */
export function useInsightsQuery(userId: string, month?: string) {
  return useQuery({
    queryKey: ['insights', userId, month ?? 'current'],
    staleTime: 2 * 60 * 1000, // 2 minutes — avoid redundant fetches on tab switches
    queryFn: async (): Promise<InsightsData> => {
      const url = month ? `/api/insights?month=${month}` : '/api/insights'
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch insights')
      const json = await res.json()
      return {
        anomalies: ((json.anomalies ?? []) as Record<string, unknown>[]).map(mapAnomaly),
        trends: ((json.trends ?? []) as Record<string, unknown>[]).map(mapTrend),
      }
    },
  })
}
