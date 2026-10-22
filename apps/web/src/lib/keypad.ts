export const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const

/** Applies one keypad press to the amount string (2 decimals, 9 chars max). */
export function pressKey(amount: string, key: (typeof KEYS)[number]): string {
  if (key === '⌫') return amount.slice(0, -1)
  if (key === '.') return amount.includes('.') ? amount : (amount || '0') + '.'
  if (amount.length >= 9) return amount
  if (/\.\d{2}$/.test(amount)) return amount
  if (amount === '0') return key
  return amount + key
}
