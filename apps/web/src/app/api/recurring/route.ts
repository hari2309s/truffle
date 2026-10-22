import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { requireUser } from '@/lib/supabase-server'
import { fetchRecurringOverrides, isMissingSchema, RECURRING_MIGRATION_NEEDED } from '@/lib/server-db'
import { RECURRING_GROUPS, type RecurringOverride } from '@/lib/recurring'

const CHOICES: RecurringOverride[] = [...RECURRING_GROUPS, 'none']

/** GET → { overrides: { [itemKey]: group | 'none' }, available } */
export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    return NextResponse.json(await fetchRecurringOverrides(createServerClient(), user.id))
  } catch (error) {
    console.error('GET recurring error:', error)
    return NextResponse.json({ error: 'Failed to load recurring settings' }, { status: 500 })
  }
}

/** PUT { key, choice } — choice is a group, 'none' (not recurring), or null to undo. */
export async function PUT(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse

    const { key, choice } = ((await request.json().catch(() => null)) ?? {}) as {
      key?: unknown
      choice?: unknown
    }
    if (typeof key !== 'string' || key.length === 0 || key.length > 300) {
      return NextResponse.json({ error: 'key must be a string up to 300 characters' }, { status: 400 })
    }
    if (choice !== null && !CHOICES.includes(choice as RecurringOverride)) {
      return NextResponse.json({ error: `choice must be one of ${CHOICES.join(', ')} or null` }, { status: 400 })
    }

    const db = createServerClient()
    const { error } =
      choice === null
        ? await db.from('recurring_overrides').delete().eq('user_id', user.id).eq('item_key', key)
        : await db.from('recurring_overrides').upsert(
            { user_id: user.id, item_key: key, choice, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,item_key' }
          )
    if (error && isMissingSchema(error)) return NextResponse.json(RECURRING_MIGRATION_NEEDED, { status: 503 })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PUT recurring error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
