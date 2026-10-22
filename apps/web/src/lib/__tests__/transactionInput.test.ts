import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { MAX_BATCH, parseNewTransactions, parseTransactionEdit } from '../transactionInput'
import { dateOrder, toIsoDate } from '../csv'
import { enqueueTransaction, flushQueue, readQueue } from '../offlineQueue'

const row = (over: Record<string, unknown> = {}) => ({
  description: 'Lunch',
  amount: -12.5,
  currency: 'EUR',
  category: 'food_delivery',
  date: '2026-10-22',
  merchant: 'Pret',
  isRecurring: false,
  ...over,
})

describe('parseNewTransactions', () => {
  it('accepts what the app sends and tidies text', () => {
    const r = parseNewTransactions({ transactions: [row({ description: '  ', merchant: ' Pret ' })] })
    expect(r).toEqual({ ok: true, value: [{ ...row(), description: 'Pret', merchant: 'Pret' }] })
  })

  it('names the first bad row', () => {
    for (const bad of [
      { amount: '12' },
      { amount: NaN },
      { date: '20/10/2026' },
      { date: '2026-02-30' },
      { category: 'groceries' },
      { currency: 'JPY' },
      { merchant: 42 },
    ]) {
      const r = parseNewTransactions({ transactions: [row(), row(bad)] })
      expect(r.ok, JSON.stringify(bad)).toBe(false)
      expect(!r.ok && r.error).toMatch(/^transaction 2: /)
    }
  })

  it('rejects empty and oversized batches', () => {
    expect(parseNewTransactions({ transactions: [] }).ok).toBe(false)
    expect(parseNewTransactions(null).ok).toBe(false)
    expect(parseNewTransactions({ transactions: Array(MAX_BATCH + 1).fill(row()) }).ok).toBe(false)
  })
})

describe('parseTransactionEdit', () => {
  it('only touches fields that were sent', () => {
    expect(parseTransactionEdit({ transactionId: 'x', amount: -3 })).toEqual({ ok: true, value: { amount: -3 } })
  })

  it('clears the merchant with null or blank text', () => {
    expect(parseTransactionEdit({ merchant: null })).toEqual({ ok: true, value: { merchant: null } })
    expect(parseTransactionEdit({ merchant: ' ' })).toEqual({ ok: true, value: { merchant: null } })
  })

  it('rejects bad values and an emptied description', () => {
    expect(parseTransactionEdit({ date: 'yesterday' }).ok).toBe(false)
    expect(parseTransactionEdit({ description: '   ' }).ok).toBe(false)
  })
})

describe('CSV dates', () => {
  it('works out day-first vs month-first from the file', () => {
    expect(dateOrder(['01/02/2026', '20/10/2026'])).toBe('dmy')
    expect(dateOrder(['10/20/2026'])).toBe('mdy')
    expect(dateOrder(['01/02/2026'])).toBe('dmy')
  })

  it('reads the common bank formats', () => {
    expect(toIsoDate('2026-10-20 09:12:33', 'dmy')).toBe('2026-10-20')
    expect(toIsoDate('20/10/2026', 'dmy')).toBe('2026-10-20')
    expect(toIsoDate('20.10.26', 'dmy')).toBe('2026-10-20')
    expect(toIsoDate('10/20/2026', 'mdy')).toBe('2026-10-20')
    expect(toIsoDate('20 Oct 2026', 'dmy')).toBe('2026-10-20')
    expect(toIsoDate('31/02/2026', 'dmy')).toBeNull()
    expect(toIsoDate('pending', 'dmy')).toBeNull()
  })
})

describe('flushQueue', () => {
  const store = new Map<string, string>()
  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    })
    vi.stubGlobal('window', { dispatchEvent: () => true })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('on a 400, saves the good entries, drops the bad one and keeps ones that hit a server error', async () => {
    enqueueTransaction('u', row({ description: 'good' }) as never)
    enqueueTransaction('u', row({ description: 'bad' }) as never)
    enqueueTransaction('u', row({ description: 'flaky' }) as never)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { body: string }) => {
        const { transactions } = JSON.parse(init.body) as { transactions: { description: string }[] }
        if (transactions.length > 1) return { ok: false, status: 400 }
        const d = transactions[0]!.description
        return d === 'good' ? { ok: true, status: 200 } : { ok: false, status: d === 'bad' ? 400 : 503 }
      })
    )
    expect(await flushQueue('u')).toEqual({ saved: 1, dropped: 1 })
    expect(readQueue('u').map((t) => t.description)).toEqual(['flaky'])
  })

  it('drops entries the API would reject without sending them', async () => {
    enqueueTransaction('u', row({ description: 'ok' }) as never)
    enqueueTransaction('u', row({ category: 'groceries' }) as never)
    const fetch = vi.fn(async () => ({ ok: true, status: 200 }))
    vi.stubGlobal('fetch', fetch)
    expect(await flushQueue('u')).toEqual({ saved: 1, dropped: 1 })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(readQueue('u')).toEqual([])
  })

  it(`keeps flushing past ${MAX_BATCH} entries`, async () => {
    for (let i = 0; i < MAX_BATCH + 3; i++) enqueueTransaction('u', row() as never)
    const fetch = vi.fn(async () => ({ ok: true, status: 200 }))
    vi.stubGlobal('fetch', fetch)
    expect(await flushQueue('u')).toEqual({ saved: MAX_BATCH + 3, dropped: 0 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
