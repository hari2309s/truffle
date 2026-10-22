import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { requireUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse

    const db = createServerClient()

    // Attached receipts live in storage, outside the cascade — remove them
    // first. Only a missing bucket means "nothing to remove"; any other error
    // aborts so the account isn't deleted with its files left behind.
    const bucket = db.storage.from('receipts')
    for (let round = 0; round < 50; round++) {
      const { data: files, error: listError } = await bucket.list(user.id, { limit: 100 })
      if (listError && /bucket not found/i.test(listError.message)) break
      if (listError) throw listError
      if (!files?.length) break
      const { error: removeError } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`))
      if (removeError) throw removeError
    }

    // Delete the auth user — all tables cascade via ON DELETE CASCADE
    const { error } = await db.auth.admin.deleteUser(user.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Account delete error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
