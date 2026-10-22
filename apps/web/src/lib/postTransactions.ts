import { MAX_BATCH } from './transactionInput'

/** Thrown when a chunk fails; `saved` rows from earlier chunks are already in. */
export class PartialImportError extends Error {
  constructor(public saved: number) {
    super('Import failed')
  }
}

/**
 * POSTs rows to /api/transactions in chunks the API accepts, one after the
 * other. Resolves with the number saved, or throws PartialImportError.
 */
export async function postTransactions(rows: unknown[]): Promise<number> {
  let saved = 0
  for (let i = 0; i < rows.length; i += MAX_BATCH) {
    const chunk = rows.slice(i, i + MAX_BATCH)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: chunk }),
    }).catch(() => null)
    if (!res?.ok) throw new PartialImportError(saved)
    saved += chunk.length
  }
  return saved
}
