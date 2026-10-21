'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from 'posthog-js/react'
import type { TransactionCategory } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useImportFlow, ImportSuccess } from '@/hooks/useImportFlow'
import { CURRENCY_SYMBOLS } from '@/lib/currency'
import { LeaderRow, MINUS, NoticeSlip, Rule, Sheet, Tallying } from './Tally'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  currency: 'EUR' | 'GBP' | 'USD'
  category: TransactionCategory
}

interface ReceiptUploadProps {
  userId: string
  onClose: () => void
}

const MAX_SIZE_MB = 10
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

function Corner({ className }: { className: string }) {
  return <div aria-hidden className={`absolute w-7 h-7 border-truffle-accent ${className}`} />
}

export function ReceiptUpload({ userId, onClose }: ReceiptUploadProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ file: File; objectUrl: string } | null>(null)
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null)
  const flow = useImportFlow()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    flow.reset()
    setParsed(null)

    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    if (!isPDF && !isImage) {
      flow.setError(t.receiptUpload.invalidFile)
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      flow.setError(t.receiptUpload.fileTooLarge(MAX_SIZE_MB))
      return
    }

    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    const objectUrl = isImage ? URL.createObjectURL(file) : ''
    setPreview({ file, objectUrl })
  }

  const handleParse = async () => {
    if (!preview) return
    flow.startLoading()

    try {
      const fd = new FormData()
      fd.append('file', preview.file)

      const res = await fetch('/api/parse-receipt', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        flow.setError(json.error ?? t.receiptUpload.parseError)
        return
      }

      if (!json.transactions?.length) {
        flow.setError(t.receiptUpload.noTransactions)
        return
      }

      posthog.capture('receipt_scanned', {
        transaction_count: json.transactions.length,
        file_type: preview.file.type,
      })

      setParsed(json.transactions as ParsedTransaction[])
    } catch {
      flow.setError(t.receiptUpload.somethingWrong)
    } finally {
      flow.stopLoading()
    }
  }

  const handleImport = async () => {
    if (!parsed) return
    flow.startLoading()
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: parsed.map((tx) => ({
            ...tx,
            merchant: tx.description,
            isRecurring: false,
          })),
        }),
      })
      if (!res.ok) throw new Error('Import failed')

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })

      posthog.capture('receipt_imported', { transaction_count: parsed.length })

      flow.markImported()
    } catch {
      flow.setError(t.receiptUpload.importFailed)
    } finally {
      flow.stopLoading()
    }
  }

  const reset = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
    setParsed(null)
    flow.reset()
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const fmt = (currency: string, value: number) =>
    `${value < 0 ? MINUS : value > 0 ? '+' : ''}${CURRENCY_SYMBOLS[currency] ?? currency}${Math.abs(value).toFixed(2)}`

  const inputs = (
    <>
      <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </>
  )

  if (flow.imported) {
    return (
      <Sheet title={t.receiptUpload.title} onClose={onClose} closeLabel={t.common.close}>
        <ImportSuccess
          message={t.receiptUpload.imported(parsed?.length ?? 0)}
          doneLabel={t.receiptUpload.done}
          onDone={onClose}
        />
      </Sheet>
    )
  }

  // ── Result: the receipt, re-printed line by line ──
  if (parsed) {
    const single = parsed.length === 1 ? parsed[0]! : null
    const currencies = new Set(parsed.map((p) => p.currency))
    const total = parsed.reduce((s, p) => s + p.amount, 0)
    return (
      <Sheet
        title={t.receiptUpload.resultTitle}
        onClose={onClose}
        closeLabel={t.common.close}
        closeGlyph="←"
        right={
          <button type="button" onClick={reset} className="uppercase">
            {t.receiptUpload.retake}
          </button>
        }
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={flow.isLoading}
              className="key key-line h-14 text-[13px] uppercase"
            >
              {t.receiptUpload.tryAgain}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={flow.isLoading}
              className="key key-accent h-14 text-sm uppercase"
            >
              {flow.isLoading ? t.receiptUpload.importing : `✓ ${t.receiptUpload.import(parsed.length)}`}
            </button>
          </div>
        }
      >
        <div className="slip mx-4 mt-3 px-[18px] pt-[18px] pb-8 flex flex-col gap-1.5 text-[13px]">
          {single ? (
            <>
              <div className="text-center text-lg font-bold tracking-[.2em] uppercase break-words">
                {single.description}
              </div>
              <div className="text-center text-[11px] text-truffle-text2 uppercase">
                {single.date} · {t.categories[single.category] ?? single.category}
              </div>
            </>
          ) : (
            <div className="text-center text-[11px] text-truffle-text2 uppercase">
              {t.receiptUpload.transactionsFound(parsed.length)}
            </div>
          )}
          <Rule className="my-1.5" />
          {parsed.map((tx, i) => (
            <div key={i} className="print-in" style={{ animationDelay: `${i * 60}ms` }}>
              <LeaderRow
                baseline
                left={single ? (t.categories[tx.category] ?? tx.category) : tx.description}
                right={<b>{fmt(tx.currency, tx.amount)}</b>}
              />
              {!single && (
                <div className="text-[11px] text-truffle-text2">
                  {tx.date} · {t.categories[tx.category] ?? tx.category}
                </div>
              )}
            </div>
          ))}
          <Rule className="my-1.5" />
          {currencies.size === 1 && (
            <div className="flex justify-between text-lg font-bold uppercase">
              <span>{t.receiptUpload.total}</span>
              <span>{fmt(parsed[0]!.currency, total)}</span>
            </div>
          )}
          <div className="flex justify-between text-[11px] text-truffle-text2 uppercase">
            <span>{t.receiptUpload.items(parsed.length)}</span>
            <span>{preview?.file.name}</span>
          </div>
        </div>
        {flow.error && (
          <NoticeSlip tone="negative" title={t.receiptUpload.errorTitle} className="mx-4 mt-4">
            {flow.error}
          </NoticeSlip>
        )}
      </Sheet>
    )
  }

  // ── Capture: frame, shutter, files ──
  return (
    <Sheet title={t.receiptUpload.title} onClose={onClose} closeLabel={t.common.close}>
      {inputs}
      <button
        type="button"
        onClick={() => (preview ? undefined : fileRef.current?.click())}
        aria-label={preview ? preview.file.name : t.receiptUpload.tapToSelect}
        className="relative mx-12 mt-6 min-h-[360px] flex-1 max-h-[440px] border-2 border-dashed border-truffle-accent grid place-items-center overflow-hidden"
      >
        <Corner className="-left-0.5 -top-0.5 border-l-4 border-t-4" />
        <Corner className="-right-0.5 -top-0.5 border-r-4 border-t-4" />
        <Corner className="-left-0.5 -bottom-0.5 border-l-4 border-b-4" />
        <Corner className="-right-0.5 -bottom-0.5 border-r-4 border-b-4" />
        {preview?.objectUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview.objectUrl}
            alt=""
            className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-contain"
          />
        ) : preview ? (
          <span className="px-6 text-sm font-bold break-all">▤ {preview.file.name}</span>
        ) : (
          <span className="px-6 text-xs text-truffle-text2 uppercase leading-relaxed">
            {t.receiptUpload.tapToSelect}
            <br />
            {t.receiptUpload.fileTypes}
          </span>
        )}
        {flow.isLoading && (
          <div
            aria-hidden
            className="absolute left-0 right-0 h-0.5 bg-truffle-accent"
            style={{ boxShadow: '0 0 12px var(--t-accent)', animation: 'tr-scan 1.6s ease-in-out infinite' }}
          />
        )}
      </button>

      <p className="mx-8 mt-5 text-center text-[13px] font-bold uppercase" aria-live="polite">
        {flow.isLoading ? <Tallying label={t.receiptUpload.analysing} /> : preview ? preview.file.name : t.receiptUpload.hint}
      </p>

      {flow.error && (
        <NoticeSlip tone="warning" title={t.receiptUpload.errorTitle} className="mx-4 mt-4">
          {flow.error}
        </NoticeSlip>
      )}

      <div className="mt-auto px-8 pt-6 pb-[max(40px,env(safe-area-inset-bottom))] flex justify-between items-center">
        {preview ? (
          <>
            <button
              type="button"
              onClick={reset}
              disabled={flow.isLoading}
              className="key key-line h-[52px] px-3 text-[11px] uppercase"
            >
              {t.receiptUpload.changeFile}
            </button>
            <button
              type="button"
              onClick={handleParse}
              disabled={flow.isLoading}
              className="key key-accent h-[52px] px-5 text-[13px] uppercase"
            >
              {flow.isLoading ? t.receiptUpload.analysing : t.receiptUpload.extractTransactions}
            </button>
          </>
        ) : (
          <>
            <span className="w-[52px]" />
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              aria-label={t.receiptUpload.shutter}
              className="w-[84px] h-[84px] rounded-full border-4 border-truffle-text grid place-items-center active:scale-95 transition-transform"
            >
              <span className="w-[66px] h-[66px] rounded-full bg-truffle-accent" />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="key key-plain w-[52px] h-[52px] text-[11px] uppercase"
            >
              {t.receiptUpload.files}
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}
