import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import type { Forecast, MonthlySnapshot } from '@truffle/types'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const db = createServerClient()
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Get anomalies
    const { data: anomalies } = await db
      .from('anomalies')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .order('detected_at', { ascending: false })
      .limit(10)

    // Get monthly snapshot for forecast
    const { data: snapshotRow } = await db
      .from('monthly_snapshots')
      .select('data')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single()

    const snapshot = snapshotRow?.data as MonthlySnapshot | null

    let forecast: Forecast | null = null
    if (snapshot) {
      const today = new Date()
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const daysElapsed = today.getDate()
      const daysRemaining = daysInMonth - daysElapsed

      const dailySpendRate = daysElapsed > 0 ? snapshot.totalExpenses / daysElapsed : 0
      const projectedRemainingSpend = dailySpendRate * daysRemaining
      const projectedEndOfMonth = snapshot.balance + projectedRemainingSpend

      forecast = {
        currentBalance: snapshot.balance,
        projectedEndOfMonth,
        projectedSavings: Math.max(0, projectedEndOfMonth),
        confidence: daysElapsed > 10 ? 'high' : daysElapsed > 5 ? 'medium' : 'low',
        assumptions: [
          `Based on ${daysElapsed} days of data`,
          `Daily spend rate: €${Math.abs(dailySpendRate).toFixed(2)}`,
          `${daysRemaining} days remaining in month`,
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
