import { NextRequest, NextResponse } from 'next/server'
import { langfuse } from '@truffle/ai'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { traceId, score } = await request.json()
    if (!traceId || (score !== 1 && score !== -1)) {
      return NextResponse.json({ error: 'traceId and score (1 or -1) required' }, { status: 400 })
    }
    await langfuse.score({
      traceId,
      name: 'user-feedback',
      value: score,
      dataType: 'NUMERIC',
      comment: score === 1 ? 'thumbs_up' : 'thumbs_down',
    })
    await langfuse.flushAsync()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 })
  }
}
