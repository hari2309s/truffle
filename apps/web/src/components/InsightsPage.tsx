'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { Anomaly } from '@truffle/types'
import { detectSubscriptions } from '@/lib/subscriptions'
import { SavingsGoals } from './SavingsGoals'

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
    <div className="min-h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-truffle-border">
        <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} />
        <h1 className="font-semibold text-truffle-text">Insights</h1>
      </header>

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

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t border-truffle-border bg-truffle-bg/95 backdrop-blur-sm">
        <div className="flex">
          <Link
            href="/"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
          >
            <HomeIcon />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link
            href="/chat"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
          >
            <ChatIcon />
            <span className="text-[10px]">Chat</span>
          </Link>
          <Link
            href="/insights"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-amber"
          >
            <InsightsIcon />
            <span className="text-[10px]">Insights</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223 15.522 15.522 0 003-.152z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InsightsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
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
