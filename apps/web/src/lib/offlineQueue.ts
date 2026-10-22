/**
 * Entries logged with no connection wait here (this device only, one queue
 * per user) and are posted to /api/transactions when the connection comes
 * back. Sign-out clears every queue, so nothing can post to another account.
 */
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
 * Posts the user's queue in one request. Network errors, 5xx and 401 keep
 * the entries for the next try; any other 4xx drops the batch.
 */
export function flushQueue(userId: string): Promise<FlushResult> {
  if (flushing) return flushing
  flushing = (async () => {
    const items = readQueue(userId)
    if (items.length === 0) return { saved: 0, dropped: 0 }
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: items }),
      })
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 401)) {
        // Keep anything queued while the request was in flight.
        writeQueue(userId, readQueue(userId).slice(items.length))
        return res.ok ? { saved: items.length, dropped: 0 } : { saved: 0, dropped: items.length }
      }
      return { saved: 0, dropped: 0 }
    } catch {
      return { saved: 0, dropped: 0 }
    } finally {
      flushing = null
    }
  })()
  return flushing
}
