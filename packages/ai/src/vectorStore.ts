import { ChromaClient, Collection } from 'chromadb'
import type { Transaction } from '@truffle/types'
import { embedTransaction, embedText } from './embeddings'

const COLLECTION_NAME = 'truffle_transactions'

let clientInstance: ChromaClient | null = null
let collectionInstance: Collection | null = null

function getClient(): ChromaClient {
  if (!clientInstance) {
    clientInstance = new ChromaClient({
      path: process.env.CHROMA_URL ?? 'http://localhost:8000',
    })
  }
  return clientInstance
}

async function getCollection(): Promise<Collection> {
  if (!collectionInstance) {
    const client = getClient()
    collectionInstance = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 'hnsw:space': 'cosine' },
    })
  }
  return collectionInstance
}

export async function upsertTransaction(transaction: Transaction): Promise<void> {
  const collection = await getCollection()
  const embedding = transaction.embedding ?? (await embedTransaction(transaction))

  await collection.upsert({
    ids: [transaction.id],
    embeddings: [embedding],
    documents: [
      `${transaction.description} ${transaction.category} €${Math.abs(transaction.amount)} ${transaction.date}`,
    ],
    metadatas: [
      {
        userId: transaction.userId,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        isRecurring: String(transaction.isRecurring),
      },
    ],
  })
}

export async function queryTransactions(
  userId: string,
  query: string,
  nResults = 20
): Promise<Transaction[]> {
  const collection = await getCollection()
  const queryEmbedding = await embedText(query)

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    where: { userId },
  })

  if (!results.metadatas?.[0]) return []

  return results.metadatas[0].map((meta, i) => ({
    id: results.ids[0][i],
    userId: (meta?.userId as string) ?? userId,
    amount: Number(meta?.amount ?? 0),
    currency: 'EUR' as const,
    description: results.documents?.[0]?.[i] ?? '',
    category: (meta?.category as Transaction['category']) ?? 'other',
    date: (meta?.date as string) ?? '',
    isRecurring: meta?.isRecurring === 'true',
  }))
}

export async function deleteUserTransactions(userId: string): Promise<void> {
  const collection = await getCollection()
  await collection.delete({ where: { userId } })
}
