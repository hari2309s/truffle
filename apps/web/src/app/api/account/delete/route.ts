import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const db = createServerClient()

    // Delete the auth user — all tables cascade via ON DELETE CASCADE
    const { error } = await db.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Account delete error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
