import Dexie, { type Table } from 'dexie'
import type { Transaction, SavingsGoal, HabitWithStats, Anomaly } from '@truffle/types'

export interface QueuedAction {
  id?: number
  type:
    | 'add_transaction'
    | 'create_goal'
    | 'fund_goal'
    | 'delete_goal'
    | 'create_habit'
    | 'log_habit_contribution'
  payload: unknown
  createdAt: number
}

export interface PendingChatMessage {
  id?: number
  userId: string
  content: string
  createdAt: number
}

// Anomaly doesn't carry userId from the server — we add it for local querying
export interface StoredAnomaly extends Anomaly {
  userId: string
}

class TruffleOfflineDB extends Dexie {
  transactions!: Table<Transaction>
  queuedActions!: Table<QueuedAction>
  pendingChatMessages!: Table<PendingChatMessage>
  goals!: Table<SavingsGoal>
  habitsWithStats!: Table<HabitWithStats>
  anomalies!: Table<StoredAnomaly>

  constructor() {
    super('truffle-offline')
    this.version(1).stores({
      transactions: 'id, userId, date, category',
      queuedActions: '++id, type, createdAt',
    })
    this.version(2).stores({
      transactions: 'id, userId, date, category',
      queuedActions: '++id, type, createdAt',
      pendingChatMessages: '++id, userId, createdAt',
    })
    this.version(3).stores({
      transactions: 'id, userId, date, category',
      queuedActions: '++id, type, createdAt',
      pendingChatMessages: '++id, userId, createdAt',
      goals: 'id, userId',
      habitsWithStats: 'id, userId',
      anomalies: 'id, userId',
    })
  }
}

export const offlineDb = new TruffleOfflineDB()

/** Maps a raw Supabase row (snake_case) or already-mapped object to a Transaction. */
export function mapTransactionRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    amount: Number(row.amount),
    currency: row.currency as Transaction['currency'],
    description: row.description as string,
    category: row.category as Transaction['category'],
    merchant: row.merchant as string,
    date: row.date as string,
    isRecurring: (row.is_recurring ?? row.isRecurring) as boolean,
  }
}

/** Registers the Background Sync tag so the SW can replay queued actions when connectivity returns. No-ops in browsers that don't support Background Sync. */
export async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return
  try {
    const reg = await navigator.serviceWorker.ready
    await (
      reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }
    ).sync.register('truffle-sync-queue')
  } catch {
    // Silently ignore — client-side online-event flush is the fallback
  }
}

export async function flushQueuedActions(): Promise<number> {
  const actions = await offlineDb.queuedActions.orderBy('createdAt').toArray()
  if (actions.length === 0) return 0

  let flushed = 0
  for (const action of actions) {
    try {
      let res: Response | null = null

      if (action.type === 'add_transaction') {
        res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        })
      } else if (action.type === 'create_goal') {
        res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        })
      } else if (action.type === 'fund_goal') {
        res = await fetch('/api/goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        })
      } else if (action.type === 'delete_goal') {
        const { userId, goalId } = action.payload as { userId: string; goalId: string }
        res = await fetch(`/api/goals?userId=${userId}&goalId=${goalId}`, { method: 'DELETE' })
      } else if (action.type === 'create_habit') {
        res = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        })
      } else if (action.type === 'log_habit_contribution') {
        res = await fetch('/api/habits', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        })
      }

      if (res?.ok) {
        await offlineDb.queuedActions.delete(action.id!)
        flushed++
      }
    } catch {
      // Network still unavailable — leave in queue
    }
  }
  return flushed
}
