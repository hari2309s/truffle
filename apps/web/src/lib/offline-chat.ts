import { offlineDb } from './offline-db'
import { formatCategory } from './categories'

function formatAmount(n: number): string {
  return `€${Math.abs(n).toFixed(0)}`
}

/**
 * Generates a warm, contextual offline fallback reply for Truffle.
 * Reads cached transactions from IndexedDB to personalize the response.
 */
export async function generateOfflineFallback(
  userId: string,
  userMessage: string
): Promise<string> {
  // Pull cached context
  const transactions = await offlineDb.transactions
    .where('userId')
    .equals(userId)
    .toArray()
    .catch(() => [])

  const expenses = transactions.filter((t) => t.amount < 0)
  const income = transactions.filter((t) => t.amount > 0)
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)

  // Top spending category
  const byCat: Record<string, number> = {}
  for (const t of expenses) {
    byCat[t.category] = (byCat[t.category] ?? 0) + Math.abs(t.amount)
  }
  const topCat = Object.entries(byCat).sort(([, a], [, b]) => b - a)[0]

  // Detect question intent loosely
  const msg = userMessage.toLowerCase()
  const isSpendingQ = /spend|spent|cost|much|expensive|budget/.test(msg)
  const isBalanceQ = /balance|afford|left|remaining|how.*doing/.test(msg)
  const isGoalQ = /goal|saving|save|house|holiday|trip/.test(msg)

  if (isSpendingQ && topCat) {
    return (
      `I'm offline right now, so I can't pull the full picture — but from what I have saved locally, ` +
      `your biggest spending recently was on ${formatCategory(topCat[0])} (${formatAmount(topCat[1])}). ` +
      `I've queued your question and will give you the complete answer once I'm back online.`
    )
  }

  if (isBalanceQ && totalIncome > 0 && totalExpenses > 0) {
    const net = totalIncome - totalExpenses
    const tone = net >= 0 ? 'looking comfortable' : 'a bit stretched'
    return (
      `No connection right now, but I can see your recent activity. ` +
      `Based on cached data, your balance is ${tone} — income ${formatAmount(totalIncome)}, ` +
      `outgoing ${formatAmount(totalExpenses)}. ` +
      `I've saved your question and will answer properly when we reconnect.`
    )
  }

  if (isGoalQ) {
    return (
      `I'm offline at the moment, so I can't check your goal progress in real time. ` +
      `Your question is saved and I'll pull the latest when we're back online. ` +
      `You're making progress — keep going.`
    )
  }

  // Generic fallbacks — cycle through a few warm tones
  const generics = [
    totalExpenses > 0
      ? `I'm currently offline and can't reach my full intelligence. I can see you've been active — around ${formatAmount(totalExpenses)} in recent spending. ` +
        `Your question is queued and I'll answer it properly once we reconnect.`
      : `I'm offline right now and can't give you a full answer. I've saved your message and will get back to you with a proper response as soon as we're connected again.`,

    `No internet connection at the moment, but I'm still here with you. ` +
      `I've noted your question and will send it to the full Truffle brain as soon as we're back online. Nothing is lost.`,

    `Offline mode activated. I can still see your recent saved data, but I need a connection for the deepest answers. ` +
      `I've queued this and will answer properly when we reconnect — usually just a few seconds once you're back online.`,
  ]

  return generics[userMessage.length % generics.length] ?? generics[0] ?? ''
}
