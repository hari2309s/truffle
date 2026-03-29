import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import type { Forecast } from '@truffle/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const db = createServerClient()
    const currentMonth = new Date().toISOString().slice(0, 7)
    const startOfMonth = `${currentMonth}-01`

    // Get anomalies
    const { data: anomalies } = await db
      .from('anomalies')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .order('detected_at', { ascending: false })
      .limit(10)

    // Compute balance live from this month's transactions — never trust stale snapshot
    const { data: txsRaw } = await db
      .from('transactions')
      .select('amount, category')
      .eq('user_id', userId)
      .gte('date', startOfMonth)

    const txs = (txsRaw ?? []) as { amount: number | string; category: string }[]
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

    return NextResponse.json({
      anomalies: anomalies ?? [],
      forecast,
    })
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 })
  }
}
