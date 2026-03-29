'use client'

import { useQuery } from '@tanstack/react-query'
import { computeForecast } from '@/lib/forecast'

interface FinancialBriefProps {
  userId: string
}

export function FinancialBrief({ userId }: FinancialBriefProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
  })

  const forecast = data?.transactions ? computeForecast(data.transactions) : null

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-truffle-border rounded w-1/3 mb-3" />
        <div className="h-8 bg-truffle-border rounded w-1/2 mb-2" />
        <div className="h-3 bg-truffle-border rounded w-2/3" />
      </div>
    )
  }

  if (!forecast) {
    return (
      <div className="card border-dashed">
        <p className="text-sm text-truffle-muted text-center py-2">
          Add some transactions to see your financial brief
        </p>
      </div>
    )
  }

  const isPositive = forecast.projectedEndOfMonth > 0
  const balanceColor = isPositive ? 'text-truffle-green' : 'text-truffle-red'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide">
          End of Month
        </h2>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            forecast.confidence === 'high'
              ? 'bg-truffle-green/20 text-truffle-green'
              : forecast.confidence === 'medium'
                ? 'bg-truffle-amber/20 text-truffle-amber'
                : 'bg-truffle-muted/20 text-truffle-muted'
          }`}
        >
          {forecast.confidence} confidence
        </span>
      </div>

      <p className={`text-3xl font-bold mb-1 ${balanceColor}`}>
        €{forecast.projectedEndOfMonth.toFixed(0)}
      </p>
      <p className="text-sm text-truffle-text-secondary">projected balance</p>

      <div className="mt-4 pt-4 border-t border-truffle-border">
        <div className="flex justify-between text-sm">
          <span className="text-truffle-text-secondary">Current</span>
          <span className="text-truffle-text">€{forecast.currentBalance.toFixed(0)}</span>
        </div>
      </div>

      {forecast.assumptions.map((a, i) => (
        <p key={i} className="text-xs text-truffle-muted mt-2">
          {a}
        </p>
      ))}
    </div>
  )
}
