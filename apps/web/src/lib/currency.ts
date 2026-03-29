// Approximate exchange rates to EUR (base currency)
// These are fixed reference rates — good enough for a personal finance app
export const TO_EUR: Record<string, number> = {
  EUR: 1,
  GBP: 1.17,
  USD: 0.92,
}

export function toEur(amount: number, currency: string): number {
  return amount * (TO_EUR[currency] ?? 1)
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }
  const symbol = symbols[currency] ?? currency
  return `${symbol}${Math.abs(amount).toFixed(2)}`
}
