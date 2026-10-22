import type { Transaction } from '@truffle/types'

/**
 * Quotes a free-text cell. Text that a spreadsheet would run as a formula
 * (= + - @ or a leading tab/CR) gets a ' prefix so it stays plain text.
 */
export function textCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

/** Downloads transactions as a CSV file. */
export function exportToCSV(transactions: Transaction[]) {
  const header = ['Date', 'Description', 'Category', 'Merchant', 'Amount', 'Currency']
  const rows = transactions.map((tx) => [
    tx.date,
    textCell(tx.description),
    tx.category,
    textCell(tx.merchant ?? ''),
    tx.amount.toFixed(2),
    tx.currency,
  ])
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `truffle-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
