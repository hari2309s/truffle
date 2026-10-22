import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import type { SavingsGoal } from '@truffle/types'
import { isMissingSchema, recomputeSnapshot } from '@/lib/server-db'
import { sendGoalMilestoneNudge, sendGoalAtRiskNudge } from '@/lib/proactive-nudge'
import { requireUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id

    const db = createServerClient()
    const { data, error } = await db
      .from('savings_goals')
      .select('id, user_id, name, target_amount, saved_amount, deadline, emoji, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Check for at-risk goals (deadline within 30 days, not yet complete)
    const today = new Date()
    for (const row of data ?? []) {
      if (!row.deadline) continue
      const deadline = new Date(row.deadline)
      const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
      if (daysRemaining <= 0 || daysRemaining > 30) continue
      const remaining = Number(row.target_amount) - Number(row.saved_amount)
      if (remaining <= 0) continue

      const goal: SavingsGoal = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        targetAmount: Number(row.target_amount),
        savedAmount: Number(row.saved_amount),
        deadline: row.deadline,
        emoji: row.emoji,
        createdAt: row.created_at,
      }
      void sendGoalAtRiskNudge({
        userId,
        goal,
        daysRemaining,
        projectedShortfall: remaining,
      }).catch((e) => console.error(`Goal at-risk nudge failed for "${goal.name}":`, e))
    }

    return NextResponse.json(
      { goals: data },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('GET goals error:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id

    const { name, targetAmount, deadline, emoji } = await request.json()
    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json(
        { error: 'name must be a non-empty string under 200 characters' },
        { status: 400 }
      )
    }
    if (!targetAmount) {
      return NextResponse.json({ error: 'targetAmount required' }, { status: 400 })
    }
    if (
      typeof targetAmount !== 'number' ||
      targetAmount <= 0 ||
      !isFinite(targetAmount) ||
      targetAmount > 1_000_000_000
    ) {
      return NextResponse.json(
        { error: 'targetAmount must be a positive finite number up to 1,000,000,000' },
        { status: 400 }
      )
    }
    const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    if (deadline && (typeof deadline !== 'string' || !ISO_DATE_RE.test(deadline))) {
      return NextResponse.json(
        { error: 'deadline must be an ISO date (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
    if (emoji !== undefined && (typeof emoji !== 'string' || emoji.length > 20)) {
      return NextResponse.json(
        { error: 'emoji must be a string under 20 characters' },
        { status: 400 }
      )
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
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id

    const body = await request.json()
    if (body?.action === 'edit') return await editGoal(userId, body)
    if (body?.action === 'withdraw') return await withdrawFromGoal(userId, body)

    const { goalId, savedAmount, currency = 'EUR' } = body
    if (typeof goalId !== 'string' || !goalId || savedAmount === undefined) {
      return NextResponse.json({ error: 'goalId and savedAmount required' }, { status: 400 })
    }
    if (
      typeof savedAmount !== 'number' ||
      savedAmount < 0 ||
      !isFinite(savedAmount) ||
      savedAmount > 1_000_000_000
    ) {
      return NextResponse.json(
        { error: 'savedAmount must be a non-negative finite number up to 1,000,000,000' },
        { status: 400 }
      )
    }
    const VALID_CURRENCIES = ['EUR', 'GBP', 'USD'] as const
    type ValidCurrency = (typeof VALID_CURRENCIES)[number]
    if (!VALID_CURRENCIES.includes(currency as ValidCurrency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    const db = createServerClient()

    // Fetch current goal to compute deposit delta, milestone detection, and goal name
    const { data: currentGoal, error: fetchError } = await db
      .from('savings_goals')
      .select('id, user_id, name, saved_amount, target_amount, deadline, emoji, created_at')
      .eq('id', goalId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!currentGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const currentSaved = Number(currentGoal.saved_amount ?? 0)
    const targetAmount = Number(currentGoal.target_amount)
    if (Math.round(savedAmount * 100) < Math.round(currentSaved * 100)) {
      return NextResponse.json(
        { error: 'savedAmount cannot be less than the current saved amount' },
        { status: 400 }
      )
    }
    if (Math.round(savedAmount * 100) > Math.round(targetAmount * 100)) {
      return NextResponse.json(
        { error: 'savedAmount cannot exceed the goal target amount' },
        { status: 400 }
      )
    }

    const depositAmount = savedAmount - currentSaved
    if (Math.round(depositAmount * 100) === 0) {
      return NextResponse.json({ goal: currentGoal })
    }

    // Update the goal's saved amount using optimistic lock on the current value
    // to prevent a race condition where two concurrent requests both read the
    // same saved_amount and produce diverging totals.
    const { data, error } = await db
      .from('savings_goals')
      .update({ saved_amount: savedAmount })
      .eq('id', goalId)
      .eq('user_id', userId)
      .eq('saved_amount', currentSaved)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json(
        { error: 'Concurrent update detected, please retry' },
        { status: 409 }
      )
    }

    // Insert a transaction to deduct the deposit from balance
    if (depositAmount > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const { error: txError } = await insertGoalTransaction(db, {
        id: crypto.randomUUID(),
        user_id: userId,
        amount: -depositAmount,
        currency,
        description: `Saved to: ${currentGoal.name}`,
        category: 'savings',
        merchant: currentGoal.name,
        date: today,
        is_recurring: false,
        embedding: null,
        goal_id: goalId,
      })

      if (txError) {
        const { data: rollbackData, error: rollbackError } = await db
          .from('savings_goals')
          .update({ saved_amount: currentSaved })
          .eq('id', goalId)
          .eq('user_id', userId)
          .eq('saved_amount', savedAmount)
          .select('id')
          .maybeSingle()
        if (rollbackError || !rollbackData) {
          console.error(
            'Critical: goal rollback failed (concurrent update or DB error):',
            rollbackError
          )
          return NextResponse.json(
            { error: 'Data inconsistency — please contact support', code: 'ROLLBACK_FAILED' },
            { status: 500 }
          )
        }
        throw txError
      }

      // Recompute monthly snapshot so balance reflects the deduction (non-fatal)
      try {
        await recomputeSnapshot(userId, db)
      } catch (e) {
        console.error('Snapshot recompute failed (non-fatal):', e)
      }
    }

    // Fire proactive nudge if a milestone was crossed
    if (data) {
      if (targetAmount > 0) {
        const prevPct = (Number(currentGoal.saved_amount) / targetAmount) * 100
        const newPct = (savedAmount / targetAmount) * 100
        const MILESTONES = [25, 50, 75, 100] as const
        const crossed = MILESTONES.find((m) => prevPct < m && newPct >= m)
        if (crossed) {
          const goal: SavingsGoal = {
            id: data.id as string,
            userId: data.user_id as string,
            name: data.name as string,
            targetAmount: Number(data.target_amount),
            savedAmount: Number(data.saved_amount),
            deadline: data.deadline as string | undefined,
            emoji: data.emoji as string,
            createdAt: data.created_at as string,
          }
          void sendGoalMilestoneNudge({ userId, goal, milestone: crossed, snapshot: null }).catch(
            (e) => console.error(`Goal milestone nudge failed (${crossed}% of "${goal.name}"):`, e)
          )
        }
      }
    }

    return NextResponse.json({ goal: data })
  } catch (error) {
    console.error('PATCH goals error:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id

    const goalId = request.nextUrl.searchParams.get('goalId')
    if (!goalId) {
      return NextResponse.json({ error: 'goalId required' }, { status: 400 })
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

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const VALID_CURRENCIES = ['EUR', 'GBP', 'USD']

/** PATCH { action: 'edit', goalId, name?, targetAmount?, deadline?, emoji? } */
async function editGoal(userId: string, body: Record<string, unknown>) {
  const { goalId, name, targetAmount, deadline, emoji } = body
  if (typeof goalId !== 'string' || !goalId) {
    return NextResponse.json({ error: 'goalId required' }, { status: 400 })
  }
  const update: Record<string, unknown> = {}
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.length > 200) {
      return NextResponse.json(
        { error: 'name must be a non-empty string under 200 characters' },
        { status: 400 }
      )
    }
    update.name = name.trim()
  }
  if (targetAmount !== undefined) {
    if (
      typeof targetAmount !== 'number' ||
      targetAmount <= 0 ||
      !isFinite(targetAmount) ||
      targetAmount > 1_000_000_000
    ) {
      return NextResponse.json(
        { error: 'targetAmount must be a positive finite number up to 1,000,000,000' },
        { status: 400 }
      )
    }
    update.target_amount = targetAmount
  }
  if (deadline !== undefined) {
    if (deadline !== null && (typeof deadline !== 'string' || !ISO_DATE_RE.test(deadline))) {
      return NextResponse.json(
        { error: 'deadline must be an ISO date (YYYY-MM-DD) or null' },
        { status: 400 }
      )
    }
    update.deadline = deadline
  }
  if (emoji !== undefined) {
    if (typeof emoji !== 'string' || !emoji || emoji.length > 20) {
      return NextResponse.json(
        { error: 'emoji must be a string under 20 characters' },
        { status: 400 }
      )
    }
    update.emoji = emoji
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const db = createServerClient()
  const { data: current, error: fetchError } = await db
    .from('savings_goals')
    .select('name, saved_amount')
    .eq('id', goalId)
    .eq('user_id', userId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!current) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  if (
    update.target_amount !== undefined &&
    Number(update.target_amount) < Number(current.saved_amount ?? 0)
  ) {
    return NextResponse.json(
      { error: 'targetAmount cannot be below the amount already saved' },
      { status: 400 }
    )
  }

  let query = db.from('savings_goals').update(update).eq('id', goalId).eq('user_id', userId)
  // Guard against a deposit landing between the check above and this write.
  if (update.target_amount !== undefined) {
    query = query.lte('saved_amount', Number(update.target_amount))
  }
  const { data, error } = await query.select().maybeSingle()
  if (error) throw error
  if (!data) {
    return NextResponse.json(
      { error: 'The goal changed while saving — please retry' },
      { status: 409 }
    )
  }

  // Deposits/withdrawals are recorded as savings transactions under the goal's
  // name; carry them over so the goal's history survives a rename.
  if (update.name !== undefined && update.name !== current.name) {
    const oldName = String(current.name)
    const newName = String(update.name)
    const { error: renameError } = await db
      .from('transactions')
      .update({ merchant: newName })
      .eq('user_id', userId)
      .eq('category', 'savings')
      .eq('merchant', oldName)
    if (renameError) console.error('Goal rename: relabelling deposits failed (non-fatal):', renameError)
    for (const prefix of ['Saved to: ', 'Withdrawn from: ']) {
      const { error: descError } = await db
        .from('transactions')
        .update({ description: `${prefix}${newName}` })
        .eq('user_id', userId)
        .eq('category', 'savings')
        .eq('description', `${prefix}${oldName}`)
      if (descError) console.error('Goal rename: relabelling descriptions failed (non-fatal):', descError)
    }
  }

  return NextResponse.json({ goal: data })
}

/**
 * PATCH { action: 'withdraw', goalId, amount, currency? } — takes money back
 * out of a goal and records it as income so the balance stays honest.
 */
async function withdrawFromGoal(userId: string, body: Record<string, unknown>) {
  const { goalId, amount, currency = 'EUR' } = body
  if (typeof goalId !== 'string' || !goalId) {
    return NextResponse.json({ error: 'goalId required' }, { status: 400 })
  }
  if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount) || amount > 1_000_000_000) {
    return NextResponse.json(
      { error: 'amount must be a positive finite number' },
      { status: 400 }
    )
  }
  if (typeof currency !== 'string' || !VALID_CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
  }

  const db = createServerClient()
  const { data: goal, error: fetchError } = await db
    .from('savings_goals')
    .select('id, name, saved_amount')
    .eq('id', goalId)
    .eq('user_id', userId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const currentSaved = Number(goal.saved_amount ?? 0)
  if (Math.round(amount * 100) > Math.round(currentSaved * 100)) {
    return NextResponse.json(
      { error: 'Cannot withdraw more than has been saved' },
      { status: 400 }
    )
  }
  const nextSaved = Math.round((currentSaved - amount) * 100) / 100

  // Optimistic lock on the current value, as for deposits.
  const { data, error } = await db
    .from('savings_goals')
    .update({ saved_amount: nextSaved })
    .eq('id', goalId)
    .eq('user_id', userId)
    .eq('saved_amount', currentSaved)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) {
    return NextResponse.json({ error: 'Concurrent update detected, please retry' }, { status: 409 })
  }

  const { error: txError } = await insertGoalTransaction(db, {
    id: crypto.randomUUID(),
    user_id: userId,
    amount,
    currency,
    description: `Withdrawn from: ${goal.name}`,
    category: 'savings',
    merchant: goal.name,
    date: new Date().toISOString().slice(0, 10),
    is_recurring: false,
    embedding: null,
    goal_id: goalId,
  })
  if (txError) {
    const { data: rollbackData, error: rollbackError } = await db
      .from('savings_goals')
      .update({ saved_amount: currentSaved })
      .eq('id', goalId)
      .eq('user_id', userId)
      .eq('saved_amount', nextSaved)
      .select('id')
      .maybeSingle()
    if (rollbackError || !rollbackData) {
      console.error('Critical: goal withdraw rollback failed:', rollbackError)
      return NextResponse.json(
        { error: 'Data inconsistency — please contact support', code: 'ROLLBACK_FAILED' },
        { status: 500 }
      )
    }
    throw txError
  }

  try {
    await recomputeSnapshot(userId, db)
  } catch (e) {
    console.error('Snapshot recompute failed (non-fatal):', e)
  }
  return NextResponse.json({ goal: data })
}

/**
 * Inserts a goal deposit/withdrawal linked by goal_id; before the migration
 * adds that column, falls back to the unlinked row (matched by name).
 */
async function insertGoalTransaction(
  db: ReturnType<typeof createServerClient>,
  row: Record<string, unknown>
) {
  const result = await db.from('transactions').insert(row)
  if (result.error && isMissingSchema(result.error)) {
    const { goal_id: _goalId, ...withoutGoal } = row
    return db.from('transactions').insert(withoutGoal)
  }
  return result
}
