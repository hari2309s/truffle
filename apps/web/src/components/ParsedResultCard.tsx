'use client'

import { memo, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@truffle/types'
import { truffleEase } from '@/lib/motion'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LeaderRow, MINUS } from './Tally'

export interface ParsedRow {
  date: string
  description: string
  amount: number
  category: TransactionCategory
}

export interface ParsedResultData {
  source: 'receipt' | 'statement' | 'csv'
  sourceName: string
  rows: ParsedRow[]
}

type CardMode = 'pending' | 'edit' | 'confirmed'

interface ParsedResultCardProps {
  data: ParsedResultData
  onConfirm: (rows: ParsedRow[]) => void
  onDecline?: () => void
}

const SOURCE_LABELS: Record<string, string> = {
  receipt: 'RECEIPT',
  statement: 'BANK STATEMENT',
  csv: 'CSV IMPORT',
}

export const ParsedResultCard = memo(function ParsedResultCard({
  data,
  onConfirm,
}: ParsedResultCardProps) {
  const { formatAmount } = useCurrency()
  const { t } = useLanguage()

  const [mode, setMode] = useState<CardMode>('pending')
  const [rows, setRows] = useState(() =>
    data.rows.map((r, i) => ({ ...r, on: true, id: `pr-${i}` }))
  )

  const updateRow = useCallback(
    (id: string, patch: Partial<(typeof rows)[0]>) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    []
  )

  const selected = rows.filter((r) => r.on)
  const total = selected.reduce((sum, r) => sum + r.amount, 0)

  const fmtAmount = (a: number) => {
    const abs = formatAmount(Math.abs(a))
    return a < 0 ? `${MINUS}${abs}` : `+${abs}`
  }

  const handleLog = () => {
    const toLog = rows.filter((r) => r.on).map(({ on: _, id: __, ...rest }) => rest)
    onConfirm(toLog)
    setMode('confirmed')
  }

  const cardEdge = mode === 'confirmed' ? 'border-truffle-positive' : 'border-truffle-accent'

  return (
    <motion.div
      className={`self-start w-[84%] max-w-[520px] slip px-4 pt-3.5 pb-[26px] flex flex-col box-border border-t-[6px] ${cardEdge}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: truffleEase }}
    >
      {/* Header */}
      <div className="flex flex-col gap-[3px] pb-2 text-[11px] font-bold tracking-[.1em]">
        <div className="flex items-center gap-2">
          {mode === 'confirmed' ? (
            <span className="text-truffle-positive animate-[ta-fade_240ms_ease-out_both]">
              ✓ CONFIRMED · {SOURCE_LABELS[data.source]}
            </span>
          ) : (
            <>
              <span className="w-2.5 h-[13px] border-[1.5px] border-truffle-accent-ink box-border" />
              <span className="text-truffle-accent-ink">{SOURCE_LABELS[data.source]}</span>
            </>
          )}
        </div>
        <span className="text-truffle-text2 whitespace-nowrap">{data.sourceName}</span>
      </div>

      {/* Pending: checkbox rows */}
      {mode === 'pending' && (
        <div className="flex flex-col">
          {rows.map((r, i) => (
            <label
              key={r.id}
              className="flex items-center gap-2.5 min-h-[44px] cursor-pointer print-in"
              style={{
                opacity: r.on ? 1 : 0.5,
                transition: 'opacity .16s',
                animationDelay: `${120 + i * 40}ms`,
              }}
            >
              <input
                type="checkbox"
                checked={r.on}
                onChange={() => updateRow(r.id, { on: !r.on })}
                className="flex-none w-4 h-4 m-0 accent-[var(--t-accent)] cursor-pointer"
              />
              <div className="flex-[0_1_auto] min-w-0 flex flex-col gap-0.5">
                <span className="text-[11px] text-truffle-text2">{r.date}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-grotesk text-[13px] leading-[1.25]">{r.description}</span>
                  <span className="text-[11px] text-truffle-text2 bg-truffle-surface px-2 py-0.5 rounded whitespace-nowrap">
                    {t.categories[r.category] ?? r.category.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <span className="leader flex-[1_1_8px] min-w-2 !mb-[13px] self-end" />
              <span
                className={`flex-none whitespace-nowrap self-end mb-2 text-[13px] font-bold ${r.amount > 0 ? 'text-truffle-positive' : 'text-truffle-text'}`}
              >
                {fmtAmount(r.amount)}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Edit: inline editable fields */}
      {mode === 'edit' && (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-2 gap-1.5 pb-3 border-b border-dashed border-truffle-border print-in"
            >
              <input
                value={r.description}
                onChange={(e) => updateRow(r.id, { description: e.target.value })}
                aria-label="Description"
                className="col-span-2 field h-10 font-grotesk text-[13px]"
              />
              <input
                value={String(Math.abs(r.amount).toFixed(2))}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(',', '.'))
                  if (!isNaN(v)) updateRow(r.id, { amount: r.amount < 0 ? -Math.abs(v) : Math.abs(v) })
                }}
                aria-label="Amount"
                inputMode="decimal"
                className="field h-10 text-[13px]"
              />
              <input
                value={r.date}
                onChange={(e) => updateRow(r.id, { date: e.target.value })}
                aria-label="Date"
                className="field h-10 text-[13px]"
              />
              <select
                value={r.category}
                onChange={(e) =>
                  updateRow(r.id, { category: e.target.value as TransactionCategory })
                }
                aria-label="Category"
                className="col-span-2 field h-10 text-[13px]"
              >
                {TRANSACTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t.categories[c] ?? c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Confirmed: leader rows */}
      {mode === 'confirmed' && (
        <div className="flex flex-col gap-2.5 pt-0.5">
          {selected.map((r, i) => (
            <div
              key={r.id}
              className="flex flex-col gap-0.5 print-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <LeaderRow
                className="text-[13px]"
                left={<span className="font-grotesk">{r.description}</span>}
                right={
                  <b className={r.amount > 0 ? 'text-truffle-positive' : ''}>{fmtAmount(r.amount)}</b>
                }
              />
              <span className="text-[11px] text-truffle-text2">
                {r.date} · {t.categories[r.category] ?? r.category.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider + summary */}
      <div className="border-t border-truffle-border my-2.5" />
      <div className="flex justify-between items-center pt-0.5">
        <span className="text-[13px] text-truffle-text2 tracking-[.06em]">
          {selected.length} TRANSACTION{selected.length === 1 ? '' : 'S'}
        </span>
        <span className={`text-[15px] font-bold ${total > 0 ? 'text-truffle-positive' : 'text-truffle-text'}`}>
          {fmtAmount(total)}
        </span>
      </div>

      {/* Footer buttons */}
      {mode === 'pending' && (
        <div className="grid grid-cols-2 gap-2 pt-3.5 pb-1">
          <button
            type="button"
            onClick={handleLog}
            disabled={selected.length === 0}
            className="key key-accent h-12 text-[13px] uppercase"
          >
            LOG THESE
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className="key key-line h-12 text-[13px] uppercase"
          >
            EDIT
          </button>
        </div>
      )}
      {mode === 'edit' && (
        <div className="pt-3.5 pb-1">
          <button
            type="button"
            onClick={() => setMode('pending')}
            className="key key-ink w-full h-11 text-[13px] uppercase"
          >
            DONE EDITING
          </button>
        </div>
      )}
    </motion.div>
  )
})
