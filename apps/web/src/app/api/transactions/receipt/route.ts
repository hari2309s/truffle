import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { isMissingSchema, MIGRATION_NEEDED } from '@/lib/server-db'
import { requireUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const BUCKET = 'receipts'
const MAX_BYTES = 10 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
const SIGNED_URL_SECONDS = 300

type Db = ReturnType<typeof createServerClient>

/** The entry, if it belongs to this user. Null (with a response) otherwise. */
async function ownedTransaction(db: Db, userId: string, transactionId: string | null) {
  if (!transactionId) {
    return { tx: null, response: NextResponse.json({ error: 'transactionId required' }, { status: 400 }) }
  }
  const { data, error } = await db
    .from('transactions')
    .select('id, receipt_path')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error && isMissingSchema(error)) {
    return { tx: null, response: NextResponse.json(MIGRATION_NEEDED, { status: 503 }) }
  }
  if (error) throw error
  if (!data) {
    return { tx: null, response: NextResponse.json({ error: 'Transaction not found' }, { status: 404 }) }
  }
  return { tx: data as { id: string; receipt_path: string | null }, response: null }
}

/** POST multipart { transactionId, file } — attach (or replace) a receipt. */
export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse

    const form = await request.formData()
    const file = form.get('file')
    const db = createServerClient()
    const { tx, response } = await ownedTransaction(db, user.id, form.get('transactionId') as string | null)
    if (response) return response

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 })
    }
    const ext = EXTENSIONS[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Receipts must be JPEG, PNG, WEBP or PDF' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is too large — maximum size is 10 MB.' }, { status: 400 })
    }

    const path = `${user.id}/${tx!.id}.${ext}`
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true })
    if (uploadError) throw uploadError

    const { error: updateError } = await db
      .from('transactions')
      .update({ receipt_path: path })
      .eq('id', tx!.id)
      .eq('user_id', user.id)
    if (updateError) {
      // Only undo a genuinely new file — a same-path upload overwrote the
      // file the row already points to, so removing it would orphan the row.
      if (path !== tx!.receipt_path) await db.storage.from(BUCKET).remove([path])
      throw updateError
    }

    // The row now points at the new file; drop the old one if its path differs.
    if (tx!.receipt_path && tx!.receipt_path !== path) {
      const { error: removeError } = await db.storage.from(BUCKET).remove([tx!.receipt_path])
      if (removeError) console.error('Old receipt cleanup failed (non-fatal):', removeError)
    }
    return NextResponse.json({ ok: true, receiptPath: path })
  } catch (error) {
    console.error('POST receipt error:', error)
    return NextResponse.json({ error: 'Failed to attach receipt' }, { status: 500 })
  }
}

/** GET ?transactionId — a short-lived link to view the attached receipt. */
export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse

    const db = createServerClient()
    const { tx, response } = await ownedTransaction(
      db,
      user.id,
      request.nextUrl.searchParams.get('transactionId')
    )
    if (response) return response
    if (!tx!.receipt_path) return NextResponse.json({ error: 'No receipt attached' }, { status: 404 })

    const { data, error } = await db.storage
      .from(BUCKET)
      .createSignedUrl(tx!.receipt_path, SIGNED_URL_SECONDS)
    if (error) throw error
    return NextResponse.json({
      url: data.signedUrl,
      isPdf: tx!.receipt_path.endsWith('.pdf'),
    })
  } catch (error) {
    console.error('GET receipt error:', error)
    return NextResponse.json({ error: 'Failed to load receipt' }, { status: 500 })
  }
}

/** DELETE ?transactionId — remove the attached receipt (the entry stays). */
export async function DELETE(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse

    const db = createServerClient()
    const { tx, response } = await ownedTransaction(
      db,
      user.id,
      request.nextUrl.searchParams.get('transactionId')
    )
    if (response) return response
    if (tx!.receipt_path) {
      const { error } = await db.storage.from(BUCKET).remove([tx!.receipt_path])
      if (error) throw error
    }
    const { error: updateError } = await db
      .from('transactions')
      .update({ receipt_path: null })
      .eq('id', tx!.id)
      .eq('user_id', user.id)
    if (updateError) throw updateError
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE receipt error:', error)
    return NextResponse.json({ error: 'Failed to remove receipt' }, { status: 500 })
  }
}
