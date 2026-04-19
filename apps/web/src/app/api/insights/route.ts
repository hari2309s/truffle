import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import type { Forecast } from '@truffle/types'
import { currentYearMonth } from '@/lib/date'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const db = createServerClient()
    const currentMonth = currentYearMonth()

    // Anomalies — isolated so a missing table never breaks the forecast
    let anomalies: unknown[] = []
    try {
      const { data, error } = await db
        .from('anomalies')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(10)
      if (error) console.warn('Anomalies query error (non-fatal):', error.message)
      else anomalies = data ?? []
    } catch (e) {
      console.warn('Anomalies query threw (non-fatal):', e)
    }

    // Compute balance live — fetch all and filter in JS to avoid date type issues
    const { data: txsRaw, error: txErr } = await db
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(500)

    if (txErr) console.error('Transactions query error:', txErr.message)

    const allTxs = (txsRaw ?? []) as { amount: number | string; category: string; date: string }[]

    // Filter to current month regardless of how the date is stored
    const txs = allTxs.filter((t) => String(t.date).startsWith(currentMonth))
    const transactionCount = txs.length

    console.log(`[insights] userId=${userId} month=${currentMonth} txCount=${transactionCount}`)

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
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const daysElapsed = today.getDate()
      const daysRemaining = daysInMonth - daysElapsed

      const dailySpendRate = daysElapsed > 0 ? totalExpenses / daysElapsed : 0
      const projectedRemainingSpend = dailySpendRate * daysRemaining
      const projectedEndOfMonth = balance + projectedRemainingSpend

      const monthName = today.toLocaleString('default', { month: 'long' })

      forecast = {
        currentBalance: balance,
        projectedEndOfMonth,
        projectedSavings: Math.max(0, projectedEndOfMonth),
        confidence: transactionCount >= 10 ? 'high' : transactionCount >= 3 ? 'medium' : 'low',
        assumptions: [
          `Based on ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} in ${monthName}`,
          `Daily spend rate: €${Math.abs(dailySpendRate).toFixed(2)}`,
          `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
          `Income this month: €${totalIncome.toFixed(2)}`,
        ],
        generatedAt: new Date().toISOString(),
      }
    }

    return NextResponse.json(
      { anomalies, forecast },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 })
  }
}
