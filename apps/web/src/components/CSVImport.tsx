'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TransactionCategory } from '@truffle/types'

interface ParsedRow {
  date: string
  description: string
  amount: number
  category: TransactionCategory
  merchant?: string
}

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  groceries: 'food_groceries',
  supermarket: 'food_groceries',
  food: 'food_delivery',
  delivery: 'food_delivery',
  restaurant: 'food_delivery',
  transport: 'transport',
  uber: 'transport',
  train: 'transport',
  bus: 'transport',
  housing: 'housing',
  rent: 'housing',
  utilities: 'utilities',
  electricity: 'utilities',
  gas: 'utilities',
  internet: 'utilities',
  subscriptions: 'subscriptions',
  netflix: 'subscriptions',
  spotify: 'subscriptions',
  health: 'health',
  pharmacy: 'health',
  doctor: 'health',
  entertainment: 'entertainment',
  cinema: 'entertainment',
  shopping: 'shopping',
  amazon: 'shopping',
  income: 'income',
  salary: 'income',
  savings: 'savings',
}

function guessCategory(description: string, category?: string): TransactionCategory {
  const raw = (category ?? description).toLowerCase()
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(keyword)) return cat
  }
  return 'other'
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2 || !lines[0]) return []

  // Normalize header names
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))

  const dateIdx = headers.findIndex((h) => h === 'date')
  const descIdx = headers.findIndex((h) => ['description', 'desc', 'name', 'narrative'].includes(h))
  const amountIdx = headers.findIndex((h) => ['amount', 'value', 'sum'].includes(h))
  const categoryIdx = headers.findIndex((h) => h === 'category')
  const merchantIdx = headers.findIndex((h) => ['merchant', 'payee', 'vendor'].includes(h))

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) return []

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const rawAmount = cols[amountIdx]?.replace(/[^0-9.\-]/g, '') ?? ''
    const amount = parseFloat(rawAmount)
    if (isNaN(amount)) continue

    const description = cols[descIdx] ?? ''
    const rawCategory = categoryIdx !== -1 ? cols[categoryIdx] : undefined
    const merchant = merchantIdx !== -1 ? cols[merchantIdx] : undefined

    rows.push({
      date: cols[dateIdx] ?? '',
      description,
      amount,
      category: guessCategory(description, rawCategory),
      merchant: merchant || undefined,
    })
  }

  return rows
}

interface CSVImportProps {
  userId: string
  onClose?: () => void
}

export function CSVImport({ userId, onClose }: CSVImportProps) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imported, setImported] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setPreview(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setError('Could not parse the CSV. Make sure it has date, description, and amount columns.')
        return
      }
      setPreview(rows)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!preview) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactions: preview.map((row) => ({
            description: row.description,
            amount: row.amount,
            currency: 'EUR',
            category: row.category,
            date: row.date,
            merchant: row.merchant,
            isRecurring: false,
            userId,
          })),
        }),
      })
      if (!res.ok) throw new Error('Import failed')

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await queryClient.invalidateQueries({ queryKey: ['insights', userId] })
      setImported(true)
    } catch {
      setError('Import failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (imported) {
    return (
      <div className="card text-center space-y-3">
        <p className="text-2xl">✓</p>
        <p className="font-semibold text-truffle-text">
          {preview?.length} transaction{preview?.length !== 1 ? 's' : ''} imported
        </p>
        <button onClick={onClose} className="btn-primary w-full">
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-truffle-text">Import CSV</h3>
        <span className="text-xs text-truffle-muted">date, description, amount</span>
      </div>

      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-truffle-border rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-truffle-amber transition-colors"
        >
          <span className="text-2xl">📄</span>
          <p className="text-sm text-truffle-muted">Tap to select a CSV file</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-truffle-muted">
            {preview.length} transaction{preview.length !== 1 ? 's' : ''} found — review before
            importing
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {preview.slice(0, 30).map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 border-b border-truffle-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-truffle-text truncate block">{row.description}</span>
                  <span className="text-truffle-muted">
                    {row.date} · {row.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <span
                  className={`ml-3 font-medium tabular-nums ${row.amount >= 0 ? 'text-truffle-green' : 'text-truffle-red'}`}
                >
                  {row.amount >= 0 ? '+' : ''}€{row.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {preview.length > 30 && (
              <p className="text-xs text-truffle-muted text-center pt-1">
                +{preview.length - 30} more
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPreview(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
              className="btn-ghost flex-1 text-sm"
            >
              Change file
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {isLoading ? 'Importing...' : `Import ${preview.length}`}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-truffle-red">{error}</p>}
    </div>
  )
}
