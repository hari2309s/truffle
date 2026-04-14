import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { getCurrentPeriod, computeStreak } from '@/lib/habits'
import { sendHabitStreakNudge, sendHabitCheckInNudge } from '@/lib/proactive-nudge'

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

    // Send check-in reminders for habits not logged past the period midpoint
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // ISO: Mon=1 … Sun=7
    const dayOfMonth = today.getDate()
    for (const h of habitsWithStats) {
      if (h.currentPeriodLogged) continue
      const pastMidpoint = h.frequency === 'weekly' ? dayOfWeek >= 4 : dayOfMonth >= 15
      if (!pastMidpoint) continue
      try {
        await sendHabitCheckInNudge({
          userId,
          habitId: h.id,
          habitName: h.name,
          habitEmoji: h.emoji,
          frequency: h.frequency,
          amount: h.amount,
          period: getCurrentPeriod(h.frequency),
          lastStreak: h.streak,
        })
      } catch (e) {
        console.error(`Habit check-in nudge failed for "${h.name}":`, e)
      }
    }

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

    // Check if a streak milestone was reached
    const STREAK_MILESTONES = [3, 5, 7, 10, 15, 20, 30, 50, 100]
    try {
      const { data: allContribs } = await db
        .from('habit_contributions')
        .select('period')
        .eq('habit_id', habitId)
        .eq('user_id', userId)

      const { data: habit } = await db
        .from('savings_habits')
        .select('name, emoji, frequency')
        .eq('id', habitId)
        .single()

      if (habit && allContribs) {
        const frequency = habit.frequency as 'weekly' | 'monthly'
        const periods = allContribs.map((c) => c.period as string)
        const streak = computeStreak(frequency, periods)
        if (STREAK_MILESTONES.includes(streak)) {
          await sendHabitStreakNudge({
            userId,
            habitId,
            habitName: habit.name,
            habitEmoji: habit.emoji,
            streak,
          })
        }
      }
    } catch (e) {
      console.error(`Habit streak nudge failed for habit ${habitId}:`, e)
    }

    return NextResponse.json({ contribution: data })
  } catch (error) {
    console.error('PATCH habits error:', error)
    return NextResponse.json({ error: 'Failed to log contribution' }, { status: 500 })
  }
}
