/**
 * The one money formatter. Home, Insights and the chat assistant's facts all
 * go through it, so a figure reads identically everywhere (e.g. "€1,794.52",
 * projected close "€982"). Unsigned: callers add "−"/"+" where it matters.
 */
const LOCALE = 'en-US' // "€1,794.52", "£…", "$…" (en-GB would print "US$")

const cache = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency: string, options: { whole?: boolean } = {}): string {
  const key = `${currency}:${options.whole ? 'w' : 'c'}`
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      ...(options.whole ? { maximumFractionDigits: 0 } : {}),
    })
    cache.set(key, f)
  }
  return f.format(Math.abs(amount))
}

/** Signed form for figures that can go negative (net, projected close). */
export function formatSignedMoney(amount: number, currency: string, options: { whole?: boolean } = {}): string {
  return `${amount < 0 ? '−' : ''}${formatMoney(amount, currency, options)}`
}
