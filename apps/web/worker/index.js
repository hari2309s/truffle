// Custom service worker code — merged by next-pwa into the generated Workbox SW

const DB_NAME = 'truffle-offline'
const DB_VERSION = 3
const SYNC_TAG = 'truffle-sync-queue'

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('category', 'category', { unique: false })
      }
      if (!db.objectStoreNames.contains('queuedActions')) {
        db.createObjectStore('queuedActions', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('pendingChatMessages')) {
        const s = db.createObjectStore('pendingChatMessages', {
          keyPath: 'id',
          autoIncrement: true,
        })
        s.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('goals')) {
        const s = db.createObjectStore('goals', { keyPath: 'id' })
        s.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('habitsWithStats')) {
        const s = db.createObjectStore('habitsWithStats', { keyPath: 'id' })
        s.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('anomalies')) {
        const s = db.createObjectStore('anomalies', { keyPath: 'id' })
        s.createIndex('userId', 'userId', { unique: false })
      }
    }
  })
}

async function flushQueuedActions() {
  let db
  try {
    db = await openOfflineDb()
  } catch {
    return
  }

  const actions = await new Promise((resolve) => {
    const tx = db.transaction('queuedActions', 'readonly')
    const req = tx.objectStore('queuedActions').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve([])
  })

  for (const action of actions) {
    try {
      let res = null

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
        const { userId, goalId } = action.payload
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
        const deleteTx = db.transaction('queuedActions', 'readwrite')
        deleteTx.objectStore('queuedActions').delete(action.id)
      }
    } catch {
      // Network still unavailable — leave in queue for next sync
    }
  }

  // Notify open clients to refresh their queries
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE' }))
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueuedActions())
  }
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'REGISTER_SYNC') {
    self.registration.sync.register(SYNC_TAG).catch(() => {})
  }
})
