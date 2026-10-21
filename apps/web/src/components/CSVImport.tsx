'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TransactionCategory } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useImportFlow, ImportSuccess } from '@/hooks/useImportFlow'
import { LeaderRow, MINUS, NoticeSlip, Sheet } from './Tally'

interface ParsedRow {
  date: string
  description: string
  amount: number
  category: TransactionCategory
  merchant?: string
}

type MappedField = 'date' | 'description' | 'amount' | 'category' | 'merchant'

interface ParsedCSV {
  rows: ParsedRow[]
  /** Which header in the file fed each Truffle field (only those found). */
  mapping: { from: string; to: MappedField }[]
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

const CATEGORY_ENTRIES = Object.entries(CATEGORY_MAP)

function guessCategory(description: string, category?: string): TransactionCategory {
  const raw = (category ?? description).toLowerCase()
  for (const [keyword, cat] of CATEGORY_ENTRIES) {
    if (raw.includes(keyword)) return cat
  }
  return 'other'
}

function parseCSV(text: string): ParsedCSV {
  const empty: ParsedCSV = { rows: [], mapping: [] }
  const lines = text.trim().split('\n')
  if (lines.length < 2 || !lines[0]) return empty

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/['"]/g, ''))
  const headers = rawHeaders.map((h) => h.toLowerCase())

  const dateIdx = headers.findIndex((h) => h === 'date')
  const descIdx = headers.findIndex((h) => ['description', 'desc', 'name', 'narrative'].includes(h))
  const amountIdx = headers.findIndex((h) => ['amount', 'value', 'sum'].includes(h))
  const categoryIdx = headers.findIndex((h) => h === 'category')
  const merchantIdx = headers.findIndex((h) => ['merchant', 'payee', 'vendor'].includes(h))

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) return empty

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
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

  const mapping = (
    [
      [dateIdx, 'date'],
      [descIdx, 'description'],
      [amountIdx, 'amount'],
      [categoryIdx, 'category'],
      [merchantIdx, 'merchant'],
    ] as const
  )
    .filter(([idx]) => idx !== -1)
    .map(([idx, to]) => ({ from: rawHeaders[idx]!, to }))

  return { rows, mapping }
}

interface CSVImportProps {
  userId: string
  onClose: () => void
}

const PREVIEW_LIMIT = 5

export function CSVImport({ userId, onClose }: CSVImportProps) {
  const { t } = useLanguage()
  const { currency, formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [mapping, setMapping] = useState<ParsedCSV['mapping']>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const flow = useImportFlow()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    flow.reset()
    setPreview(null)
    setShowAll(false)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      const rows = parsed.rows.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      if (rows.length === 0) {
        flow.setError(t.csvImport.parseError)
        return
      }
      setPreview(rows)
      setMapping(parsed.mapping)
      setSelected(new Set(rows.map((_, i) => i)))
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    setPreview(null)
    setSelected(new Set())
    setShowAll(false)
    flow.reset()
    if (fileRef.current) fileRef.current.value = ''
  }

  const toggleRow = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (!preview) return
    if (selected.size === preview.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(preview.map((_, i) => i)))
    }
  }

  const handleImport = async () => {
    if (!preview) return
    const rows = preview.filter((_, i) => selected.has(i))
    if (rows.length === 0) return
    flow.startLoading()
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: rows.map((row) => ({
            description: row.description,
            amount: row.amount,
            currency,
            category: row.category,
            date: row.date,
            merchant: row.merchant,
            isRecurring: false,
          })),
        }),
      })
      if (!res.ok) throw new Error('Import failed')

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await queryClient.invalidateQueries({ queryKey: ['insights', userId] })
      flow.markImported()
    } catch {
      flow.setError(t.csvImport.importFailed)
    } finally {
      flow.stopLoading()
    }
  }

  if (flow.imported) {
    return (
      <Sheet title={t.csvImport.title} onClose={onClose} closeLabel={t.common.close}>
        <ImportSuccess
          message={t.csvImport.imported(selected.size)}
          doneLabel={t.csvImport.done}
          onDone={onClose}
        />
      </Sheet>
    )
  }

  const visibleRows = preview ? (showAll ? preview : preview.slice(0, PREVIEW_LIMIT)) : []
  const hiddenCount = preview ? preview.length - PREVIEW_LIMIT : 0
  const allSelected = preview ? selected.size === preview.length : false
  const someSelected = selected.size > 0 && !allSelected
  const dates = preview?.map((r) => r.date).filter(Boolean).sort() ?? []
  const signed = (n: number) => `${n < 0 ? MINUS : '+'}${formatAmount(n)}`

  return (
    <Sheet
      title={t.csvImport.title}
      onClose={preview ? handleReset : onClose}
      closeLabel={preview ? t.csvImport.cancel : t.common.close}
      closeGlyph={preview ? '←' : '✕'}
      footer={
        preview && (
          <button
            type="button"
            onClick={handleImport}
            disabled={flow.isLoading || selected.size === 0}
            className="key key-accent w-full h-[60px] text-[15px] uppercase"
          >
            {flow.isLoading ? t.csvImport.importing : t.csvImport.import(selected.size)}
          </button>
        )
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />

      {!preview ? (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mx-4 mt-3 py-14 border-2 border-dashed border-truffle-border rounded-lg flex flex-col items-center gap-2 hover:border-truffle-text transition-colors"
          >
            <span aria-hidden className="text-2xl">
              ⇣
            </span>
            <span className="text-sm font-bold uppercase">{t.csvImport.tapToSelect}</span>
            <span className="text-xs text-truffle-text2 uppercase">{t.csvImport.hint}</span>
          </button>
          {flow.error && (
            <NoticeSlip tone="negative" title={t.csvImport.couldntRead} className="mx-4 mt-4">
              {flow.error}
              <p className="text-truffle-text2 mt-1">{t.csvImport.nothingImported}</p>
            </NoticeSlip>
          )}
        </>
      ) : (
        <>
          <div className="px-6 pt-3 flex flex-col gap-1.5">
            <span className="font-grotesk text-[28px] font-medium leading-[1.1] break-all">
              {fileName}
            </span>
            <span className="text-xs text-truffle-text2 uppercase">
              {t.csvImport.rows(preview.length)}
              {dates.length > 0 && ` · ${dates[0]} – ${dates[dates.length - 1]}`}
            </span>
          </div>

          <div className="paper mx-4 mt-[18px] px-4 py-3.5 flex flex-col gap-0.5 text-[13px]">
            <span className="text-xs font-bold pb-1.5 uppercase">{t.csvImport.mapping}</span>
            {mapping.map((m) => (
              <div
                key={m.to}
                className="grid grid-cols-[1fr_20px_1fr] gap-1.5 items-center min-h-12 rule-soft"
              >
                <span className="font-bold truncate">{m.from}</span>
                <span aria-hidden className="text-truffle-text2">
                  →
                </span>
                <span className="h-9 px-2.5 rounded-md border border-truffle-text flex items-center text-xs font-bold uppercase">
                  {t.csvImport.fields[m.to]}
                </span>
              </div>
            ))}
          </div>

          <div className="slip-sm mx-4 mt-3.5 px-4 pt-3 pb-[22px] flex flex-col gap-1.5 text-xs">
            <label className="flex items-center gap-2 font-bold uppercase min-h-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={toggleAll}
                disabled={flow.isLoading}
                className="w-4 h-4 accent-[var(--t-accent)]"
              />
              {t.csvImport.preview} · {t.csvImport.selectedOf(selected.size, preview.length)}
            </label>
            {visibleRows.map((row, i) => (
              <label key={i} className="flex items-center gap-2 min-h-8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleRow(i)}
                  disabled={flow.isLoading}
                  className="w-4 h-4 flex-shrink-0 accent-[var(--t-accent)]"
                />
                <LeaderRow
                  className={`flex-1 min-w-0 ${selected.has(i) ? '' : 'opacity-50'}`}
                  left={
                    <span className="block truncate">
                      {row.date.slice(5)} {row.description}
                    </span>
                  }
                  right={<b>{signed(row.amount)}</b>}
                />
              </label>
            ))}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="self-start underline underline-offset-2 uppercase min-h-8"
              >
                {showAll ? t.csvImport.showLess : t.csvImport.showMore(hiddenCount)}
              </button>
            )}
          </div>

          <div className="mx-4 mt-3.5 px-1 flex flex-col gap-1.5 text-[13px]">
            <LeaderRow left={t.csvImport.newEntries} right={<b>{selected.size}</b>} />
            <LeaderRow
              className="text-truffle-text2"
              left={t.csvImport.skipped}
              right={preview.length - selected.size}
            />
          </div>

          {flow.error && (
            <NoticeSlip tone="negative" title={t.csvImport.couldntRead} className="mx-4 mt-4">
              {flow.error}
            </NoticeSlip>
          )}
        </>
      )}
    </Sheet>
  )
}
