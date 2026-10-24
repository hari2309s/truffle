'use client'

import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useImportFlow, ImportSuccess } from '@/hooks/useImportFlow'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import {
  CSV_FIELDS,
  REQUIRED_FIELDS,
  assignColumn,
  detectColumns,
  duplicateKey,
  hasRequired,
  rowsFrom,
  splitCSV,
  type CsvColumns,
  type CsvField,
} from '@/lib/csv'
import { LeaderRow, MINUS, NoticeSlip, Sheet } from './Tally'
import { PartialImportError, postTransactions } from '@/lib/postTransactions'

interface CSVImportProps {
  userId: string
  onClose: () => void
}

const PREVIEW_LIMIT = 5

export function CSVImport({ userId, onClose }: CSVImportProps) {
  const { t } = useLanguage()
  const { currency, formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const { data: txData } = useTransactionsQuery(userId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [table, setTable] = useState<{ headers: string[]; records: string[][] } | null>(null)
  const [columns, setColumns] = useState<CsvColumns | null>(null)
  // Indices into `rows` the user has unticked / re-ticked, on top of the
  // default (everything except duplicates).
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map())
  const [showAll, setShowAll] = useState(false)
  const flow = useImportFlow()
  const c = t.csvImport

  const rows = useMemo(
    () => (table && columns ? rowsFrom(table.records, columns) : []),
    [table, columns]
  )

  const existing = useMemo(
    () => new Set((txData?.transactions ?? []).map(duplicateKey)),
    [txData]
  )
  // Rows saved by an import that then failed part-way — never sent again,
  // whatever is ticked (the server may store them under a different key).
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const isSaved = (i: number) => savedKeys.has(duplicateKey(rows[i]!))
  const isDuplicate = (i: number) => isSaved(i) || existing.has(duplicateKey(rows[i]!))
  const isSelected = (i: number) => !isSaved(i) && (overrides.get(i) ?? !isDuplicate(i))
  const selectedRows = rows.filter((_, i) => isSelected(i))
  const duplicateCount = rows.filter((_, i) => isDuplicate(i) && !isSelected(i)).length

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    flow.reset()
    setTable(null)
    setShowAll(false)
    setOverrides(new Map())
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = splitCSV(ev.target?.result as string)
      if (parsed.headers.length === 0 || parsed.records.length === 0) {
        flow.setError(c.parseError)
        return
      }
      setTable(parsed)
      setColumns(detectColumns(parsed.headers))
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    setTable(null)
    setColumns(null)
    setOverrides(new Map())
    setShowAll(false)
    flow.reset()
    if (fileRef.current) fileRef.current.value = ''
  }

  const remap = (column: number, field: CsvField | 'skip') => {
    if (!columns) return
    setColumns(assignColumn(columns, column, field))
    setOverrides(new Map())
  }

  const toggleRow = (i: number) =>
    setOverrides((prev) => new Map(prev).set(i, !isSelected(i)))

  const allSelected = rows.length > 0 && selectedRows.length === rows.length
  const toggleAll = () =>
    setOverrides(new Map(rows.map((_, i) => [i, !allSelected])))

  const handleImport = async () => {
    if (selectedRows.length === 0) return
    flow.startLoading()
    try {
      await postTransactions(
        selectedRows.map((row) => ({
          description: row.description,
          amount: row.amount,
          currency,
          category: row.category,
          date: row.date,
          merchant: row.merchant,
          isRecurring: false,
        }))
      )
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await queryClient.invalidateQueries({ queryKey: ['insights', userId] })
      flow.markImported()
    } catch (e) {
      const saved = e instanceof PartialImportError ? e.saved : 0
      if (saved > 0) {
        // Chunks go in order, so the first `saved` selected rows are in.
        setSavedKeys((prev) => new Set([...prev, ...selectedRows.slice(0, saved).map(duplicateKey)]))
        await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      }
      flow.setError(saved > 0 ? c.importPartial(saved, selectedRows.length) : c.importFailed)
    } finally {
      flow.stopLoading()
    }
  }

  if (flow.imported) {
    return (
      <Sheet title={c.title} onClose={onClose} closeLabel={t.common.close} wide>
        <ImportSuccess message={c.imported(selectedRows.length)} doneLabel={c.done} onDone={onClose} />
      </Sheet>
    )
  }

  const visibleRows = showAll ? rows : rows.slice(0, PREVIEW_LIMIT)
  const hiddenCount = rows.length - PREVIEW_LIMIT
  const dates = rows.map((r) => r.date).filter(Boolean)
  const signed = (n: number) => `${n < 0 ? MINUS : '+'}${formatAmount(n)}`
  const fieldOf = (column: number): CsvField | 'skip' =>
    CSV_FIELDS.find((f) => columns?.[f] === column) ?? 'skip'
  const missing = columns ? REQUIRED_FIELDS.filter((f) => columns[f] === -1) : []

  return (
    <Sheet
      title={c.title}
      onClose={table ? handleReset : onClose}
      closeLabel={table ? c.cancel : t.common.close}
      closeGlyph={table ? '←' : '✕'}
      wide
      footer={
        table && (
          <button
            type="button"
            onClick={handleImport}
            disabled={flow.isLoading || selectedRows.length === 0}
            className="key key-accent w-full h-[60px] text-[15px] uppercase"
          >
            {flow.isLoading ? c.importing : c.import(selectedRows.length)}
          </button>
        )
      }
    >
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />

      {!table || !columns ? (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mx-4 mt-3 py-14 border-2 border-dashed border-truffle-border rounded-lg flex flex-col items-center gap-2 hover:border-truffle-text transition-colors"
          >
            <span aria-hidden className="text-2xl">
              ⇣
            </span>
            <span className="text-sm font-bold uppercase">{c.tapToSelect}</span>
            <span className="text-xs text-truffle-text2 uppercase">{c.hint}</span>
          </button>
          {flow.error && (
            <NoticeSlip tone="negative" title={c.couldntRead} className="mx-4 mt-4">
              {flow.error}
              <p className="text-truffle-text2 mt-1">{c.nothingImported}</p>
            </NoticeSlip>
          )}
        </>
      ) : (
        <>
          <div className="px-6 pt-3 flex flex-col gap-1.5">
            <span className="font-grotesk text-[28px] font-medium leading-[1.1] break-all">{fileName}</span>
            <span className="text-xs text-truffle-text2 uppercase">
              {c.rows(table.records.length)}
              {dates.length > 0 && ` · ${dates[dates.length - 1]} – ${dates[0]}`}
            </span>
          </div>

          <div className="paper mx-4 mt-[18px] px-4 py-3.5 flex flex-col gap-0.5 text-[13px]">
            <span className="text-xs font-bold pb-1.5 uppercase">{c.mapping}</span>
            {table.headers.map((header, column) => {
              const field = fieldOf(column)
              return (
                <div
                  key={`${header}-${column}`}
                  className="grid grid-cols-[1fr_20px_1fr] gap-1.5 items-center min-h-12 rule-soft"
                >
                  <span className="font-bold truncate">{header || `#${column + 1}`}</span>
                  <span aria-hidden className="text-truffle-text2">
                    →
                  </span>
                  <select
                    value={field}
                    onChange={(e) => remap(column, e.target.value as CsvField | 'skip')}
                    aria-label={c.mapColumn(header)}
                    className={`h-9 px-2 rounded-md text-xs font-bold uppercase bg-transparent ${
                      field === 'skip'
                        ? 'border border-dashed border-truffle-border text-truffle-text2'
                        : 'border border-truffle-text text-truffle-text'
                    }`}
                  >
                    {CSV_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {c.fields[f]}
                      </option>
                    ))}
                    <option value="skip">{c.skip}</option>
                  </select>
                </div>
              )
            })}
            {missing.length > 0 && (
              <p className="m-0 pt-2 text-[11px] font-bold uppercase text-truffle-warning">
                ▲ {c.needFields(missing.map((f) => c.fields[f]).join(', '))}
              </p>
            )}
          </div>

          {hasRequired(columns) && (
            <>
              <div className="slip-sm mx-4 mt-3.5 px-4 pt-3 pb-[22px] flex flex-col gap-1.5 text-xs">
                <label className="flex items-center gap-2 font-bold uppercase min-h-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedRows.length > 0 && !allSelected
                    }}
                    onChange={toggleAll}
                    disabled={flow.isLoading}
                    className="w-4 h-4 accent-[var(--t-accent)]"
                  />
                  {c.preview} · {c.selectedOf(selectedRows.length, rows.length)}
                </label>
                {visibleRows.map((row, i) => (
                  <label key={i} className="flex items-center gap-2 min-h-8 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected(i)}
                      onChange={() => toggleRow(i)}
                      disabled={flow.isLoading}
                      className="w-4 h-4 flex-shrink-0 accent-[var(--t-accent)]"
                    />
                    <LeaderRow
                      className={`flex-1 min-w-0 ${isSelected(i) ? '' : 'opacity-50'}`}
                      left={
                        <span className="block truncate">
                          {row.date.slice(5)} {row.description}
                          {isDuplicate(i) && <b className="text-truffle-text2"> · {c.dup}</b>}
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
                    {showAll ? c.showLess : c.showMore(hiddenCount)}
                  </button>
                )}
              </div>

              <div className="mx-4 mt-3.5 px-1 flex flex-col gap-1.5 text-[13px]">
                <LeaderRow left={c.newEntries} right={<b>{selectedRows.length}</b>} />
                <LeaderRow className="text-truffle-text2" left={c.duplicatesSkipped} right={duplicateCount} />
              </div>
            </>
          )}

          {flow.error && (
            <NoticeSlip tone="negative" title={c.couldntRead} className="mx-4 mt-4">
              {flow.error}
            </NoticeSlip>
          )}
        </>
      )}
    </Sheet>
  )
}
