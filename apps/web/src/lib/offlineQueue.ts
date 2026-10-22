/**
 * Entries logged with no connection wait here (this device only, one queue
 * per user) and are posted to /api/transactions when the connection comes
 * back. Sign-out clears every queue, so nothing can post to another account.
 */
import { MAX_BATCH, parseNewTransaction } from './transactionInput'

const PREFIX = 'truffle_offline_queue'
export const QUEUE_EVENT = 'truffle-queue-change'

export interface QueuedTransaction {
  description: string
  amount: number
  currency: string
  category: string
  date: string
  merchant?: string | null
  isRecurring: boolean
}

const keyFor = (userId: string) => `${PREFIX}:${userId}`

export function readQueue(userId: string): QueuedTransaction[] {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    return raw ? (JSON.parse(raw) as QueuedTransaction[]) : []
  } catch {
    return []
  }
}

function writeQueue(userId: string, items: QueuedTransaction[]) {
  try {
    if (items.length) localStorage.setItem(keyFor(userId), JSON.stringify(items))
    else localStorage.removeItem(keyFor(userId))
  } catch {
    // storage blocked — nothing more we can do offline
  }
  window.dispatchEvent(new Event(QUEUE_EVENT))
}

export function enqueueTransaction(userId: string, tx: QueuedTransaction) {
  writeQueue(userId, [...readQueue(userId), tx])
}

/** Drops every user's queue — called on sign-out. */
export function clearOfflineQueues() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    // storage blocked — nothing stored either
  }
}

/** True when a failed request looks like "no connection" rather than a server error. */
export function isOfflineError(err: unknown): boolean {
  return (typeof navigator !== 'undefined' && !navigator.onLine) || err instanceof TypeError
}

export interface FlushResult {
  saved: number
  /** Entries the server refused (bad data) — removed so they can't block the queue. */
  dropped: number
}

let flushing: Promise<FlushResult> | null = null

/**
 * Posts the user's queue, MAX_BATCH entries at a time, until it's empty or a
 * request fails. Entries the API would reject are dropped up front (checked
 * with the API's own validator), so one bad entry can't sink a batch.
 * Network errors, 5xx and 401 keep entries for the next try. An unexpected
 * 400 falls back to one request per entry so only the bad ones are dropped;
 * any other 4xx drops the batch.
 */
export function flushQueue(userId: string): Promise<FlushResult> {
  if (flushing) return flushing
  flushing = (async () => {
    const total = { saved: 0, dropped: 0 }
    try {
      for (;;) {
        const step = await flushBatch(userId)
        total.saved += step.saved
        total.dropped += step.dropped
        if (!step.done || readQueue(userId).length === 0) return total
      }
    } finally {
      flushing = null
    }
  })()
  return flushing
}

const post = (batch: QueuedTransaction[]) =>
  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: batch }),
  })

/** One batch. `done`: the batch left the queue (saved or dropped), so the next may follow. */
async function flushBatch(userId: string): Promise<FlushResult & { done: boolean }> {
  const items = readQueue(userId).slice(0, MAX_BATCH)
  if (items.length === 0) return { saved: 0, dropped: 0, done: false }
  // `keep`: entries that stay queued for the next try.
  const settle = (saved: number, dropped: number, keep: QueuedTransaction[] = []) => {
    // Anything queued while the requests were in flight stays too.
    writeQueue(userId, [...keep, ...readQueue(userId).slice(items.length)])
    return { saved, dropped, done: keep.length === 0 }
  }
  const valid = items.filter((item) => parseNewTransaction(item).ok)
  const invalid = items.length - valid.length
  if (valid.length === 0) return settle(0, invalid)
  try {
    const res = await post(valid)
    if (res.ok) return settle(valid.length, invalid)
    if (res.status === 400) {
      let saved = 0
      let dropped = invalid
      const keep: QueuedTransaction[] = []
      for (const item of valid) {
        const one = await post([item]).catch(() => null)
        if (one?.ok) saved++
        else if (one?.status === 400) dropped++
        else keep.push(item) // network / server trouble — try again later
      }
      return settle(saved, dropped, keep)
    }
    if (res.status > 400 && res.status < 500 && res.status !== 401) return settle(0, items.length)
    return { saved: 0, dropped: 0, done: false }
  } catch {
    return { saved: 0, dropped: 0, done: false }
  }
}
