import { localDate } from './date'

export type RecurringGroup = 'fixed' | 'investing' | 'subscriptions' | 'other'
export const RECURRING_GROUPS: RecurringGroup[] = ['fixed', 'investing', 'subscriptions', 'other']

/** The user's choice for one item: another group, or 'none' (not recurring). */
export type RecurringOverride = RecurringGroup | 'none'
export type RecurringOverrides = Record<string, RecurringOverride>

export interface RecurringItem {
  /** The merchant ("netflix"), plus the typical price when it has several plans ("trade republic|300"). */
  key: string
  displayName: string
  /** Typical charge converted to a month — €25 weekly is €108.71. */
  monthlyAmount: number
  /** The typical single charge, and how often it comes (null: no steady rhythm). */
  perCharge: number
  every: Cadence | null
  lastCharged: string
  /** Distinct months with a matching charge. */
  monthsDetected: number
  group: RecurringGroup
  /** 'possible': irregular day, few months, or a shop — shown, but not in totals. */
  confidence: 'high' | 'possible'
  /** The user moved it or marked it not recurring. */
  overridden: boolean
  /** Marked "not recurring". */
  hidden: boolean
}

interface RawTransaction {
  amount: number | string
  description: string
  merchant?: string | null
  date: string
  category?: string
}

/** No matching charge for this long (or 1.5 cycles, if longer) means it has stopped. */
const ACTIVE_DAYS = 62
/** Charges within 20% of each other are the same plan; further apart, a different one. */
const SAME_PLAN = 0.2
const DAYS_PER_MONTH = 365.25 / 12
/**
 * History the detector looks at: this month and the eleven before it. Long
 * enough for quarterly bills, and inside the 12 months Insights loads.
 */
const LOOKBACK_MONTHS = 12

/** First day (YYYY-MM-DD) of the detector's window — chat fetches from here too. */
export function recurringSince(today: Date = new Date()): string {
  return localDate(new Date(today.getFullYear(), today.getMonth() - (LOOKBACK_MONTHS - 1), 1))
}

export type Cadence = 'week' | 'fortnight' | 'month' | 'quarter'
const CADENCE_DAYS: Record<Cadence, number> = {
  week: 7,
  fortnight: 14,
  month: DAYS_PER_MONTH,
  quarter: DAYS_PER_MONTH * 3,
}

const INVESTING =
  /\b(spar ?plan\w*|etf|invest\w*|broker\w*|depot|trade republic|scalable|vanguard|etoro|degiro|flatex|tagesgeld|pension\w*)\b/i
const FIXED =
  /\b(rent|miete|hausverwaltung|landlord|mortgage|insurance|versicherung\w*|allianz|huk|ergo|axa|council tax|strom|electric\w*|broadband|internet|vattenfall|vodafone|telekom|o2)\b/i
const SUBSCRIPTION =
  /\b(netflix|spotify|disney\+?|prime video|amazon prime|icloud|youtube|google one|adobe|microsoft 365|office 365|chatgpt|openai|dropbox|notion|patreon|audible|deezer|dazn|gym|fitness|fitx|mcfit|urban sports\w*|membership|mitglied\w*|abo|subscription|deutschlandticket)\b/i
/** Spending that repeats by habit, not by contract — never more than "possibly". */
const SHOPPING = new Set(['shopping', 'food_groceries', 'food_delivery', 'entertainment'])

function merchantKey(tx: RawTransaction): string {
  const base = (tx.merchant || tx.description).toLowerCase().trim()
  // "Netflix" and "NETFLIX MONTHLY" are the same merchant.
  return base.replace(/\s+(monthly|subscription|sub|payment|charge|fee)$/i, '').trim()
}

const titleCase = (s: string) =>
  s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

/**
 * How often the charges come, from the gaps between them: about weekly,
 * fortnightly, monthly (so rent on the 1st that posts on the 31st still
 * counts) or quarterly, or null when there's no steady rhythm. Three in four
 * gaps must fit.
 */
function cadenceOf(dates: string[]): Cadence | null {
  const stamps = [...new Set(dates)].sort().map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000)
  const gaps = stamps.slice(1).map((d, i) => d - stamps[i]!)
  if (gaps.length === 0) return null
  const typical = median(gaps)
  const cadence: Cadence | null =
    typical >= 5 && typical <= 9
      ? 'week'
      : typical >= 12 && typical <= 17
        ? 'fortnight'
        : typical >= 25 && typical <= 35
          ? 'month'
          : typical >= 80 && typical <= 100
            ? 'quarter'
            : null
  if (cadence === null) return null
  const days = CADENCE_DAYS[cadence]
  const fitting = gaps.filter((g) => g >= days * 0.6 && g <= days * 1.4).length
  return fitting / gaps.length >= 0.75 ? cadence : null
}

/** The user's choice for a plan: its own key, or one saved under the merchant or a nearby price. */
function findOverride(
  overrides: RecurringOverrides,
  key: string,
  merchant: string,
  amount: number
): [string, RecurringOverride] | null {
  if (overrides[key]) return [key, overrides[key]]
  for (const [k, choice] of Object.entries(overrides)) {
    const bar = k.lastIndexOf('|')
    const price = bar === -1 ? NaN : Number(k.slice(bar + 1))
    if (k === merchant || (k.slice(0, bar) === merchant && Math.abs(price - amount) <= amount * SAME_PLAN)) {
      return [k, choice]
    }
  }
  return null
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

/** The most common category among the charges (they're usually all the same). */
function mainCategory(txs: RawTransaction[]): string {
  const counts = new Map<string, number>()
  for (const tx of txs) if (tx.category) counts.set(tx.category, (counts.get(tx.category) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other'
}

/** Category first (it's what the user sees and can edit), then the merchant's name. */
export function groupFor(category: string, text: string): RecurringGroup {
  if (category === 'savings') return 'investing'
  if (category === 'housing' || category === 'utilities') return 'fixed'
  if (category === 'subscriptions') return 'subscriptions'
  if (INVESTING.test(text)) return 'investing'
  if (FIXED.test(text)) return 'fixed'
  if (SUBSCRIPTION.test(text)) return 'subscriptions'
  return 'other'
}

/** Splits one merchant's charges into plans by amount (Trade Republic's €300 ETF vs €100 Bitcoin plan). */
function byPlan(txs: RawTransaction[]): RawTransaction[][] {
  const sorted = [...txs].sort((a, b) => Math.abs(Number(a.amount)) - Math.abs(Number(b.amount)))
  const plans: RawTransaction[][] = []
  for (const tx of sorted) {
    const plan = plans[plans.length - 1]
    const first = plan ? Math.abs(Number(plan[0]!.amount)) : 0
    if (plan && Math.abs(Number(tx.amount)) <= first * (1 + SAME_PLAN)) plan.push(tx)
    else plans.push([tx])
  }
  return plans
}

/**
 * Charges that repeat month to month, grouped as fixed costs, investing and
 * savings plans, subscriptions or other. `overrides` (from the user) move an
 * item to another group or mark it not recurring.
 */
export function detectRecurring(
  transactions: RawTransaction[],
  today: Date = new Date(),
  overrides: RecurringOverrides = {}
): RecurringItem[] {
  const stoppedBefore = (days: number) =>
    localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - Math.round(days)))

  // A fixed window, so Insights (12 months loaded) and chat (6) find the same items.
  const from = recurringSince(today)
  const merchants = new Map<string, RawTransaction[]>()
  for (const tx of transactions) {
    if (Number(tx.amount) >= 0 || tx.date < from) continue
    const key = merchantKey(tx)
    merchants.set(key, [...(merchants.get(key) ?? []), tx])
  }

  const items: RecurringItem[] = []
  const usedKeys = new Set<string>()
  for (const [mKey, txs] of merchants) {
    const plans = byPlan(txs).filter((plan) => new Set(plan.map((t) => t.date.slice(0, 7))).size >= 2)
    for (const plan of plans) {
      const latest = [...plan].sort((a, b) => (a.date > b.date ? -1 : 1))[0]!
      const cadence = cadenceOf(plan.map((t) => t.date))
      const cycle = cadence ? CADENCE_DAYS[cadence] : DAYS_PER_MONTH
      if (latest.date < stoppedBefore(Math.max(ACTIVE_DAYS, cycle * 1.5))) continue

      const amount = median(plan.map((t) => Math.abs(Number(t.amount))))
      const months = new Set(plan.map((t) => t.date.slice(0, 7))).size
      const regular = cadence !== null
      const category = mainCategory(plan)
      const text = `${latest.merchant ?? ''} ${latest.description}`
      const detected = groupFor(category, text)
      const contractual = detected !== 'other'
      // Shops and cafés repeat because people go back, not because they bill:
      // keep them only when they come on a steady rhythm, 3+ months running.
      if (!regular && !contractual) continue
      if (SHOPPING.has(category) && !contractual && months < 3) continue
      const confident = !SHOPPING.has(category) && regular && (months >= 3 || contractual)

      const ownKey = plans.length > 1 ? `${mKey}|${Math.round(amount)}` : mKey
      const found = findOverride(overrides, ownKey, mKey, amount)
      const override = found?.[1]
      // A choice saved for the whole merchant (or already claimed by a sibling
      // plan) is only a default here: keep this plan's own key so changing one
      // plan never changes another.
      const key = found && !(plans.length > 1 && (found[0] === mKey || usedKeys.has(found[0]))) ? found[0] : ownKey
      usedKeys.add(key)
      const name = titleCase(latest.merchant || latest.description)
      items.push({
        // An override saved under an older key keeps that key, so undo removes it.
        key,
        // A merchant with several plans names each one by its description.
        displayName: plans.length > 1 && latest.merchant ? `${name} · ${latest.description}` : name,
        monthlyAmount: (amount * DAYS_PER_MONTH) / cycle,
        perCharge: amount,
        every: cadence,
        lastCharged: latest.date,
        monthsDetected: months,
        group: override && override !== 'none' ? override : detected,
        // Moving an item is the user confirming it recurs.
        confidence: confident || (override !== undefined && override !== 'none') ? 'high' : 'possible',
        overridden: override !== undefined,
        hidden: override === 'none',
      })
    }
  }

  return items.sort(
    (a, b) =>
      RECURRING_GROUPS.indexOf(a.group) - RECURRING_GROUPS.indexOf(b.group) ||
      b.monthlyAmount - a.monthlyAmount
  )
}

/** Monthly totals of what's counted — shown, high-confidence items. */
export function recurringTotals(items: RecurringItem[]): { total: number } & Record<RecurringGroup, number> {
  const totals = { total: 0, fixed: 0, investing: 0, subscriptions: 0, other: 0 }
  for (const item of items) {
    if (item.hidden || item.confidence !== 'high') continue
    totals[item.group] += item.monthlyAmount
    totals.total += item.monthlyAmount
  }
  return totals
}
