import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import type { Forecast, MonthlySnapshot, SpendTrend } from '@truffle/types'
import { currentYearMonth } from '@/lib/date'
import { sendMonthlyReportNudge, sendSpendTrendNudge } from '@/lib/proactive-nudge'
import { spendByCategory } from '@/lib/budgets'
import { detectSpendTrends } from '@/lib/spend-trends'
import { CATEGORY_EMOJI } from '@/lib/categories'
import { requireUser } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id

    // Only fire the monthly report nudge in the first 3 days of the month to
    // avoid re-triggering on every page load for the rest of the month.
    const dayOfMonth = new Date().getDate()
    if (dayOfMonth <= 3) {
      after(() =>
        sendMonthlyReportNudge(userId).catch((e) =>
          console.warn('Monthly report nudge failed (non-fatal):', e)
        )
      )
    }

    const db = createServerClient()
    const monthParam = request.nextUrl.searchParams.get('month')
    const isValidMonth =
      monthParam &&
      /^\d{4}-\d{2}$/.test(monthParam) &&
      parseInt(monthParam.slice(5), 10) >= 1 &&
      parseInt(monthParam.slice(5), 10) <= 12 &&
      monthParam <= currentYearMonth()
    const currentMonth = isValidMonth ? monthParam : currentYearMonth()
    // Compute next month start using Date.UTC so arithmetic is timezone-independent
    const [ymYear, ymMonth] = currentMonth.split('-')
    const year = parseInt(ymYear!, 10)
    const month = parseInt(ymMonth!, 10) - 1 // 0-indexed
    const nextMonthDate = new Date(Date.UTC(year, month + 1, 1))
    const nextMonthStart = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01`

    // Anomalies — isolated so a missing table never breaks the forecast
    let anomalies: unknown[] = []
    try {
      const { data, error } = await db
        .from('anomalies')
        .select('id, transaction_id, type, severity, description, detected_at, dismissed')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('detected_at', { ascending: false })
        .limit(10)
      if (error) console.warn('Anomalies query error (non-fatal):', error.message)
      else anomalies = data ?? []
    } catch (e) {
      console.warn('Anomalies query threw (non-fatal):', e)
    }

    // Compute balance live from current-month transactions only
    const { data: txsRaw, error: txErr } = await db
      .from('transactions')
      .select('amount, category, date, currency')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', nextMonthStart)
      .order('date', { ascending: false })
      .limit(2000)

    if (txErr) {
      console.error('Transactions query error:', txErr.message)
      return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })
    }
    const truncated = (txsRaw?.length ?? 0) === 2000
    if (truncated) console.warn(`[insights] hit 2000-row cap for user ${userId.slice(0, 8)}…`)

    const txs = (txsRaw ?? []) as { amount: number | string; category: string; date: string; currency?: string }[]
    const transactionCount = txs.length

    const totalIncome = txs
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0)

    const totalExpenses = txs
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Number(t.amount), 0)

    const balance = txs.reduce((s, t) => s + Number(t.amount), 0)

    let forecast: Forecast | null = null
    if (transactionCount > 0) {
      const today = new Date()
      const isPastMonth = currentMonth !== currentYearMonth()
      const fmDaysInMonth = new Date(year, month + 1, 0).getDate()
      const fmDaysElapsed = isPastMonth ? fmDaysInMonth : today.getDate()
      const fmDaysRemaining = isPastMonth ? 0 : fmDaysInMonth - fmDaysElapsed

      const dailySpendRate = fmDaysElapsed > 0 ? totalExpenses / fmDaysElapsed : 0
      const projectedRemainingSpend = dailySpendRate * fmDaysRemaining
      const projectedEndOfMonth = balance + projectedRemainingSpend

      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' })

      forecast = {
        currentBalance: balance,
        projectedEndOfMonth,
        projectedSavings: Math.max(0, projectedEndOfMonth),
        confidence: transactionCount >= 10 ? 'high' : transactionCount >= 3 ? 'medium' : 'low',
        assumptions: [
          `Based on ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} in ${monthName}`,
          `Daily spend rate: €${Math.abs(dailySpendRate).toFixed(2)}`,
          `${fmDaysRemaining} day${fmDaysRemaining !== 1 ? 's' : ''} remaining`,
          `Income this month: €${totalIncome.toFixed(2)}`,
        ],
        generatedAt: new Date().toISOString(),
      }
    }

    // Spend trend detection: compare current month to 3-month rolling average
    let trends: SpendTrend[] = []
    try {
      const baselineMonths: string[] = []
      for (let i = 1; i <= 3; i++) {
        const d = new Date(year, month - i, 1)
        baselineMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      }

      const { data: snapRows } = await db
        .from('monthly_snapshots')
        .select('data')
        .eq('user_id', userId)
        .in('month', baselineMonths)

      const baselines = ((snapRows ?? []) as Record<string, unknown>[])
        .map((r) => r.data as unknown as MonthlySnapshot)
        .filter(Boolean)

      if (baselines.length >= 2) {
        const currentSpend = spendByCategory(
          txs as { amount: number; category: string; date: string }[],
          currentMonth
        )
        trends = detectSpendTrends(currentSpend, baselines)

        // Fire spend trend nudges on page load (fire-and-forget), but only for
        // the live month — nudges about past months are not actionable.
        const isLiveMonth = currentMonth === currentYearMonth()
        if (isLiveMonth && trends.length > 0) {
          const trendsCopy = trends.slice(0, 2)
          const currencyCode = txs[0]?.currency
          after(async () => {
            try {
              const now = new Date()
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              const daysRemaining = daysInMonth - now.getDate()

              const { data: goalsData } = await db
                .from('savings_goals')
                .select('name, emoji, target_amount, saved_amount')
                .eq('user_id', userId)

              const goals = (goalsData ?? []).map((g: Record<string, unknown>) => ({
                name: g.name as string,
                emoji: g.emoji as string,
                targetAmount: Number(g.target_amount),
                savedAmount: Number(g.saved_amount),
              }))

              await Promise.all(
                trendsCopy.map((trend) =>
                  sendSpendTrendNudge({
                    userId,
                    category: trend.category,
                    categoryEmoji:
                      CATEGORY_EMOJI[trend.category as keyof typeof CATEGORY_EMOJI] ?? '📦',
                    currentSpend: trend.currentSpend,
                    averageSpend: trend.averageSpend,
                    changePct: trend.changePct,
                    absoluteDelta: trend.absoluteDelta,
                    month: currentMonth,
                    daysRemaining,
                    currencyCode,
                    goals,
                  }).catch((e) => console.warn('Spend trend nudge failed (non-fatal):', e))
                )
              )
            } catch (e) {
              console.warn('Spend trend nudge after() failed:', e)
            }
          })
        }
      }
    } catch (e) {
      console.warn('Spend trend detection failed (non-fatal):', e)
    }

    return NextResponse.json(
      { anomalies, forecast, trends, truncated },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 })
  }
}

/**
 * Resolves a flagged charge ("It's mine"): marks the anomaly dismissed so it
 * leaves "To review". Ownership is enforced by the user_id match.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse

    const { anomalyId } = await request.json()
    if (typeof anomalyId !== 'string' || !anomalyId) {
      return NextResponse.json({ error: 'anomalyId required' }, { status: 400 })
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('anomalies')
      .update({ dismissed: true })
      .eq('id', anomalyId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Anomaly not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH insights error:', error)
    return NextResponse.json({ error: 'Failed to update anomaly' }, { status: 500 })
  }
}
