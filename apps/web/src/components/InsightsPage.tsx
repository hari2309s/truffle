'use client'

import { useQuery } from '@tanstack/react-query'
import type { Anomaly } from '@truffle/types'
import { detectSubscriptions } from '@/lib/subscriptions'
import { SavingsGoals } from './SavingsGoals'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

interface InsightsPageProps {
  userId: string
}

interface Forecast {
  currentBalance: number
  projectedEndOfMonth: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
}

function computeForecast(
  transactions: { amount: number | string; date: string }[]
): Forecast | null {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const txs = transactions.filter((t) => String(t.date).startsWith(currentMonth))
  if (txs.length === 0) return null

  const totalIncome = txs
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = txs
    .filter((t) => Number(t.amount) < 0)
    .reduce((s, t) => s + Number(t.amount), 0)
  const balance = txs.reduce((s, t) => s + Number(t.amount), 0)

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()
  const daysRemaining = daysInMonth - daysElapsed
  const dailySpendRate = daysElapsed > 0 && totalExpenses < 0 ? totalExpenses / daysElapsed : 0
  const projectedEndOfMonth = balance + dailySpendRate * daysRemaining

  const monthName = today.toLocaleString('default', { month: 'long' })
  const count = txs.length

  return {
    currentBalance: balance,
    projectedEndOfMonth,
    confidence: count >= 10 ? 'high' : count >= 3 ? 'medium' : 'low',
    assumptions: [
      `Based on ${count} transaction${count !== 1 ? 's' : ''} in ${monthName}`,
      `Daily spend rate: €${Math.abs(dailySpendRate).toFixed(2)}`,
      `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
      `Income this month: €${totalIncome.toFixed(2)}`,
    ],
  }
}

export function InsightsPage({ userId }: InsightsPageProps) {
  // Shared transactions cache — same key as Dashboard/FinancialBrief
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
  })

  // Anomalies are server-computed — separate lightweight query
  const { data: anomalyData, isLoading: anomalyLoading } = useQuery({
    queryKey: ['anomalies', userId],
    queryFn: async () => {
      const res = await fetch(`/api/insights?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch anomalies')
      const json = await res.json()
      return (json.anomalies ?? []) as Anomaly[]
    },
  })

  const forecast = txData?.transactions ? computeForecast(txData.transactions) : null
  const anomalies = anomalyData ?? []
  const subscriptions = txData?.transactions ? detectSubscriptions(txData.transactions) : []
  const isLoading = txLoading

  return (
    <div className="h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto">
      <TopBar title="Insights" subtitle="" />

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
        {/* Forecast */}
        <section>
          <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide mb-3">
            Month Forecast
          </h2>
          {isLoading ? (
            <div className="card animate-pulse h-24" />
          ) : forecast ? (
            <ForecastCard forecast={forecast} />
          ) : (
            <div className="card border-dashed text-center text-truffle-muted text-sm py-6">
              Add transactions to see your forecast
            </div>
          )}
        </section>

        {/* Subscriptions */}
        {subscriptions.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide mb-3">
              Recurring Subscriptions
            </h2>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.key} className="card flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-truffle-text">{sub.displayName}</p>
                    <p className="text-xs text-truffle-muted">
                      Last charged{' '}
                      {new Date(sub.lastCharged).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' · '}detected {sub.monthsDetected} month
                      {sub.monthsDetected !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-truffle-red">
                    -€{sub.monthlyAmount.toFixed(2)}/mo
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Savings Goals */}
        <SavingsGoals userId={userId} />

        {/* Anomalies */}
        <section>
          <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide mb-3">
            Things to Review
          </h2>
          {anomalyLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="card animate-pulse h-16" />
              ))}
            </div>
          ) : anomalies.length ? (
            <div className="space-y-2">
              {anomalies.map((a) => (
                <AnomalyCard key={a.id} anomaly={a} />
              ))}
            </div>
          ) : (
            <div className="card border-dashed text-center text-truffle-muted text-sm py-6">
              No unusual activity detected
            </div>
          )}
        </section>
      </main>

      <BottomNav active="insights" />
    </div>
  )
}

function ForecastCard({ forecast }: { forecast: Forecast }) {
  const isPositive = forecast.projectedEndOfMonth >= 0
  const progress = Math.min(
    100,
    Math.max(
      0,
      forecast.projectedEndOfMonth > 0 && forecast.currentBalance > 0
        ? (forecast.currentBalance / forecast.projectedEndOfMonth) * 100
        : 0
    )
  )

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-truffle-muted mb-1">Projected end of month</p>
          <p
            className={`text-2xl font-bold ${isPositive ? 'text-truffle-green' : 'text-truffle-red'}`}
          >
            €{forecast.projectedEndOfMonth.toFixed(0)}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
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

      <div className="h-2 bg-truffle-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-truffle-green' : 'bg-truffle-red'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-1">
        {forecast.assumptions.map((assumption, i) => (
          <li key={i} className="text-xs text-truffle-muted flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-truffle-muted inline-block flex-shrink-0" />
            {assumption}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const severityColors = {
    high: 'text-truffle-red bg-truffle-red/10',
    medium: 'text-truffle-amber bg-truffle-amber/10',
    low: 'text-truffle-muted bg-truffle-muted/10',
  }

  const typeEmoji = {
    unusual_amount: '⚠️',
    forgotten_subscription: '🔄',
    category_spike: '📈',
    new_merchant: '🆕',
  }

  return (
    <div className="card flex gap-3">
      <span className="text-xl flex-shrink-0">{typeEmoji[anomaly.type] ?? '⚠️'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-truffle-text">{anomaly.description}</p>
        <span
          className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${severityColors[anomaly.severity]}`}
        >
          {anomaly.severity}
        </span>
      </div>
    </div>
  )
}
