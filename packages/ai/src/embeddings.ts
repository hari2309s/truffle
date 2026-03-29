import type { Transaction } from '@truffle/types'

// Uses Gemini text-embedding-004 API — works in any serverless environment
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini embed error: ${err}`)
  }

  const json = await res.json()
  return json.embedding.values as number[]
}

export async function embedTransaction(transaction: Transaction): Promise<number[]> {
  const text = [
    transaction.description,
    transaction.category.replace(/_/g, ' '),
    transaction.amount > 0 ? 'income' : 'expense',
    `€${Math.abs(transaction.amount).toFixed(2)}`,
    transaction.merchant ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return embedText(text)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must have the same length')
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0)
    normA += (a[i] ?? 0) * (a[i] ?? 0)
    normB += (b[i] ?? 0) * (b[i] ?? 0)
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
