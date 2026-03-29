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
        deadline: deadline ?? null,
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
    const { data, error } = await db
      .from('savings_goals')
      .update({ saved_amount: savedAmount })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ goal: data })
  } catch (error) {
    console.error('PATCH goals error:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
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
