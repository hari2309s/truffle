import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { getCurrentPeriod, computeStreak } from '@/lib/habits'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const db = createServerClient()

    const { data: habits, error } = await db
      .from('savings_habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!habits || habits.length === 0) {
      return NextResponse.json({ habits: [] })
    }

    // Fetch all contributions for these habits
    const habitIds = habits.map((h) => h.id)
    const { data: contributions } = await db
      .from('habit_contributions')
      .select('habit_id, period, amount')
      .in('habit_id', habitIds)
      .eq('user_id', userId)

    const contribMap: Record<string, string[]> = {}
    const totalMap: Record<string, number> = {}
    for (const c of contributions ?? []) {
      if (!contribMap[c.habit_id]) contribMap[c.habit_id] = []
      contribMap[c.habit_id]!.push(c.period)
      totalMap[c.habit_id] = (totalMap[c.habit_id] ?? 0) + Number(c.amount)
    }

    const habitsWithStats = habits.map((h) => {
      const frequency = h.frequency as 'weekly' | 'monthly'
      const periods = contribMap[h.id] ?? []
      const currentPeriod = getCurrentPeriod(frequency)
      return {
        id: h.id,
        userId: h.user_id,
        name: h.name,
        amount: Number(h.amount),
        frequency,
        emoji: h.emoji,
        isActive: h.is_active,
        createdAt: h.created_at,
        streak: computeStreak(frequency, periods),
        currentPeriodLogged: periods.includes(currentPeriod),
        totalSaved: totalMap[h.id] ?? 0,
      }
    })

    return NextResponse.json({ habits: habitsWithStats })
  } catch (error) {
    console.error('GET habits error:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, amount, frequency, emoji } = await request.json()
    if (!userId || !name || !amount || !frequency) {
      return NextResponse.json(
        { error: 'userId, name, amount, frequency required' },
        { status: 400 }
      )
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('savings_habits')
      .insert({
        user_id: userId,
        name,
        amount,
        frequency,
        emoji: emoji ?? '💰',
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ habit: data })
  } catch (error) {
    console.error('POST habits error:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, habitId, period, amount } = await request.json()
    if (!userId || !habitId || !period || amount === undefined) {
      return NextResponse.json(
        { error: 'userId, habitId, period, amount required' },
        { status: 400 }
      )
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('habit_contributions')
      .upsert(
        { habit_id: habitId, user_id: userId, period, amount },
        { onConflict: 'habit_id,period' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ contribution: data })
  } catch (error) {
    console.error('PATCH habits error:', error)
    return NextResponse.json({ error: 'Failed to log contribution' }, { status: 500 })
  }
}
