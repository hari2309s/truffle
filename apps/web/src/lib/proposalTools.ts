import { tool } from 'ai'
import { z } from 'zod'
import { TRANSACTION_CATEGORIES } from '@truffle/types'
import {
  signedForCategory,
  toAmount,
  toCategory,
  toDeadline,
  toEmoji,
  toFrequency,
  toText,
  toTransactionDate,
} from './toolArgs'

const MAX_GOAL = 1_000_000_000 // the goals API's cap
const MAX_HABIT = 1_000_000 // the habits API's cap
const MAX_ENTRY = 1_000_000_000

const cents = (n: number) => Math.round(n * 100) / 100
const amountIn = z.union([z.number(), z.string()])

/**
 * The chat's three proposal tools. Each schema accepts what models actually
 * send (strings for numbers, null for optional fields, near-miss categories)
 * and hands the card a clean value — the SDK passes the parsed result on, so
 * the card, the save and the replayed history all see the same thing. Only an
 * amount that can't be read, or a missing habit frequency, rejects the call.
 *
 * `today` is the user's local date (YYYY-MM-DD).
 */
export function proposalTools(today: string) {
  const exampleDeadline = `${Number(today.slice(0, 4)) + 1}-06-30`

  return {
    proposeGoal: tool({
      description: `Propose a savings goal card for the user to confirm. STRICT RULES: (1) NEVER call on the turn the user first names a goal — always ask for the price first in plain text. (2) Only call when the user's CURRENT message contains a specific numeric amount for THIS goal. A number from a previous turn does not count. (3) Never guess, infer, or reuse amounts from other goals in the conversation. (4) After getting the amount, ask for a target deadline before calling this tool — e.g. 'When would you like to reach this goal?' If the user explicitly says they have no deadline or don't know, you may omit it.`,
      inputSchema: z
        .object({
          name: z.string().nullish().describe('Short goal name, e.g. "Holiday in Greece"'),
          targetAmount: amountIn.describe(
            'Target amount stated by the user, as a plain number (e.g. 2000). Do not guess.'
          ),
          deadline: z
            .string()
            .nullish()
            .describe(
              `Optional target date after today (${today}), in YYYY-MM-DD format (e.g. "${exampleDeadline}"). Omit if the user gave no deadline.`
            ),
          emoji: z.string().nullish().describe('A single relevant emoji'),
          pitch: z
            .string()
            .nullish()
            .describe('One warm sentence explaining why this goal is achievable based on their finances'),
        })
        .transform((v, ctx) => {
          const targetAmount = toAmount(v.targetAmount)
          if (!(targetAmount > 0 && targetAmount <= MAX_GOAL)) {
            ctx.addIssue({
              code: 'custom',
              path: ['targetAmount'],
              message: 'targetAmount must be a positive number — ask the user for an amount first',
            })
            return z.NEVER
          }
          return {
            name: toText(v.name, 200, 'Savings goal'),
            targetAmount: cents(targetAmount),
            deadline: toDeadline(v.deadline, today),
            emoji: toEmoji(v.emoji, '🎯'),
            pitch: toText(v.pitch, 300),
          }
        }),
    }),

    proposeTransaction: tool({
      description:
        'Show a ONE-TIME transaction confirmation card. ONLY call this when the user explicitly states they have already made a real, past purchase or received real income — e.g. "I just bought", "I paid", "I received". DO NOT call this for hypothetical questions ("I might buy", "should I get"), jokes, future plans, impossible scenarios, or anything the user has not actually done. For hypotheticals, give advice or an affordability check in plain text instead. DO NOT use this for recurring saving habits — use proposeHabit for those. Use negative amounts for expenses, positive for income.',
      inputSchema: z
        .object({
          description: z.string().nullish().describe('Short description, e.g. "Coffee at Costa"'),
          amount: amountIn.describe(
            'Transaction amount as a plain number. Negative for expenses (e.g. -4.50), positive for income (e.g. 1500).'
          ),
          category: z
            .string()
            .describe(`The most appropriate category, one of: ${TRANSACTION_CATEGORIES.join(', ')}.`),
          merchant: z.string().nullish().describe('Optional merchant or payee name.'),
          date: z
            .string()
            .nullish()
            .describe(`Transaction date in YYYY-MM-DD format, not after today. Default to today: ${today}`),
        })
        .transform((v, ctx) => {
          const raw = toAmount(v.amount)
          if (!(raw !== 0 && Math.abs(raw) <= MAX_ENTRY)) {
            ctx.addIssue({
              code: 'custom',
              path: ['amount'],
              message: 'amount must be a non-zero number stated by the user',
            })
            return z.NEVER
          }
          const category = toCategory(v.category)
          const merchant = toText(v.merchant, 120) || undefined
          const description = toText(v.description, 200, merchant ?? category.replace(/_/g, ' '))
          return {
            description,
            amount: cents(signedForCategory(raw, category, description)),
            category,
            merchant,
            date: toTransactionDate(v.date, today),
          }
        }),
    }),

    proposeHabit: tool({
      description:
        'Show a recurring savings habit confirmation card. Only call when you have a specific amount AND a frequency (weekly or monthly). Never guess the amount. Put a brief calculation breakdown (e.g. "50/week = ~200/month") in the pitch field.',
      inputSchema: z
        .object({
          name: z
            .string()
            .nullish()
            .describe(
              'Short habit name based ONLY on what the user said. If the user did not state a purpose, use a generic name like "Weekly savings" or "Monthly savings". NEVER infer a name from prior conversation or goals.'
            ),
          amount: amountIn.describe(
            'Amount to save each period, as a plain number (e.g. 100). Must be stated by the user.'
          ),
          frequency: z.string().describe('How often to save: "weekly" or "monthly".'),
          emoji: z.string().nullish().describe('A single relevant emoji'),
          pitch: z
            .string()
            .nullish()
            .describe('One warm sentence motivating this habit based on their finances'),
        })
        .transform((v, ctx) => {
          const amount = toAmount(v.amount)
          const frequency = toFrequency(v.frequency)
          if (!(amount > 0 && amount <= MAX_HABIT)) {
            ctx.addIssue({ code: 'custom', path: ['amount'], message: 'amount must be a positive number' })
          }
          if (!frequency) {
            ctx.addIssue({ code: 'custom', path: ['frequency'], message: 'frequency must be weekly or monthly' })
          }
          if (!(amount > 0 && amount <= MAX_HABIT) || !frequency) return z.NEVER
          return {
            name: toText(v.name, 200, frequency === 'weekly' ? 'Weekly savings' : 'Monthly savings'),
            amount: cents(amount),
            frequency,
            emoji: toEmoji(v.emoji, '💰'),
            pitch: toText(v.pitch, 300),
          }
        }),
    }),
  }
}
