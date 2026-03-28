import type { Transaction } from '@truffle/types'

type PipelineFunction = (
  text: string,
  options: { pooling: string; normalize: boolean }
) => Promise<{ data: Float32Array }>

// Lazy singleton — loads once, caches the model
let embedderPromise: Promise<PipelineFunction> | null = null

async function getEmbedder(): Promise<PipelineFunction> {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      // Dynamic import so the ~25MB model loads on first use and is then cached
      const { pipeline } = await import('@xenova/transformers')
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as Promise<PipelineFunction>
    })()
  }
  return embedderPromise
}

export async function embedText(text: string): Promise<number[]> {
  const embedder = await getEmbedder()
  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
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
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
