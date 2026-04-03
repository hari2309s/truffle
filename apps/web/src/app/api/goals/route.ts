import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const db = createServerClient()
    const { data, error } = await db
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ goals: data })
  } catch (error) {
    console.error('GET goals error:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, targetAmount, deadline, emoji } = await request.json()
    if (!userId || !name || !targetAmount) {
      return NextResponse.json({ error: 'userId, name, targetAmount required' }, { status: 400 })
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('savings_goals')
      .insert({
        user_id: userId,
        name,
        target_amount: targetAmount,
        saved_amount: 0,
        deadline: deadline || null,
        emoji: emoji ?? '🎯',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ goal: data })
  } catch (error) {
    console.error('POST goals error:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, goalId, savedAmount } = await request.json()
    if (!userId || !goalId || savedAmount === undefined) {
      return NextResponse.json({ error: 'userId, goalId, savedAmount required' }, { status: 400 })
    }

    const db = createServerClient()

    // Fetch current goal to compute deposit delta and get goal name
    const { data: currentGoal, error: fetchError } = await db
      .from('savings_goals')
      .select('name, saved_amount')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const depositAmount = savedAmount - Number(currentGoal.saved_amount ?? 0)

    // Update the goal's saved amount
    const { data, error } = await db
      .from('savings_goals')
      .update({ saved_amount: savedAmount })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Insert a transaction to deduct the deposit from balance
    if (depositAmount > 0) {
      const today = new Date().toISOString().slice(0, 10)
      await db.from('transactions').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        amount: -depositAmount,
        currency: 'EUR',
        description: `Saved to: ${currentGoal.name}`,
        category: 'savings',
        merchant: currentGoal.name,
        date: today,
        is_recurring: false,
        embedding: null,
      })

      // Recompute monthly snapshot so balance reflects the deduction
      await recomputeSnapshot(userId, db)
    }

    return NextResponse.json({ goal: data })
  } catch (error) {
    console.error('PATCH goals error:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

async function recomputeSnapshot(userId: string, db: ReturnType<typeof createServerClient>) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const startDate = `${currentMonth}-01`

  const { data: txs } = await db
    .from('transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .gte('date', startDate)

  if (!txs) return

  const rows = txs as { amount: number | string; category: string }[]

  const snapshot = {
    month: currentMonth,
    totalIncome: rows.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
    totalExpenses: rows
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Number(t.amount), 0),
    byCategory: {} as Record<string, number>,
    savingsRate: 0,
    balance: rows.reduce((s, t) => s + Number(t.amount), 0),
    transactionCount: rows.length,
  }

  for (const tx of rows) {
    snapshot.byCategory[tx.category] = (snapshot.byCategory[tx.category] ?? 0) + Number(tx.amount)
  }

  if (snapshot.totalIncome > 0) {
    snapshot.savingsRate = Math.max(
      0,
      (snapshot.totalIncome + snapshot.totalExpenses) / snapshot.totalIncome
    )
  }

  await db
    .from('monthly_snapshots')
    .upsert(
      { user_id: userId, month: currentMonth, data: snapshot },
      { onConflict: 'user_id,month' }
    )
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const goalId = request.nextUrl.searchParams.get('goalId')
    if (!userId || !goalId) {
      return NextResponse.json({ error: 'userId and goalId required' }, { status: 400 })
    }

    const db = createServerClient()
    const { error } = await db.from('savings_goals').delete().eq('id', goalId).eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE goals error:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
