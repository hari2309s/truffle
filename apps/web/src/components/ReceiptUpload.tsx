'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from 'posthog-js/react'
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useImportFlow, ImportSuccess } from '@/hooks/useImportFlow'
import { useCamera } from '@/hooks/useCamera'
import { CURRENCY_SYMBOLS } from '@/lib/currency'
import { PartialImportError, postTransactions } from '@/lib/postTransactions'
import { LeaderRow, MINUS, NoticeSlip, Rule, Sheet, Tallying } from './Tally'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  currency: 'EUR' | 'GBP' | 'USD'
  category: TransactionCategory
}

interface ParsedReceipt {
  merchant: string
  date: string
  currency: 'EUR' | 'GBP' | 'USD'
  total: number
  items: { name: string; amount: number }[]
  itemsLegible: boolean
}

interface ReceiptUploadProps {
  userId: string
  onClose: () => void
}

const MAX_SIZE_MB = 10
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

function Corner({ className }: { className: string }) {
  return <div aria-hidden className={`absolute w-7 h-7 border-[#f6bd87] ${className}`} />
}

export function ReceiptUpload({ userId, onClose }: ReceiptUploadProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ file: File; objectUrl: string } | null>(null)
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null)
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null)
  const flow = useImportFlow()

  const camera = useCamera(!preview && !parsed && !flow.imported)

  const selectFile = (file: File) => {
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) selectFile(file)
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
      setReceipt((json.receipt as ParsedReceipt | undefined) ?? null)
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
      await postTransactions(parsed.map((tx) => ({ ...tx, merchant: tx.description, isRecurring: false })))
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })

      posthog.capture('receipt_imported', { transaction_count: parsed.length })

      flow.markImported()
    } catch (e) {
      const saved = e instanceof PartialImportError ? e.saved : 0
      if (saved > 0) {
        // Chunks go in order: keep only the unsaved rows so a retry can't double them.
        setParsed(parsed.slice(saved))
        await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      }
      flow.setError(
        saved > 0 ? t.receiptUpload.importPartial(saved, parsed.length) : t.receiptUpload.importFailed
      )
    } finally {
      flow.stopLoading()
    }
  }

  const reset = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
    setParsed(null)
    setReceipt(null)
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
              {flow.isLoading
                ? t.receiptUpload.importing
                : receipt && !receipt.itemsLegible
                  ? `✓ ${t.receiptUpload.saveTotal}`
                  : `✓ ${t.receiptUpload.import(parsed.length)}`}
            </button>
          </div>
        }
      >
        {receipt && !receipt.itemsLegible && (
          <NoticeSlip tone="warning" title={t.receiptUpload.blurryTitle} className="mx-4 mt-3">
            {t.receiptUpload.blurryBody(fmt(receipt.currency, receipt.total))}
          </NoticeSlip>
        )}
        <div className="slip mx-4 mt-3 px-[18px] pt-[18px] pb-8 flex flex-col gap-1.5 text-[13px]">
          {single ? (
            <>
              <div className="text-center text-lg font-bold tracking-[.2em] uppercase break-words">
                {single.description}
              </div>
              <div className="text-center text-[11px] text-truffle-text2 uppercase">{single.date}</div>
            </>
          ) : (
            <div className="text-center text-[11px] text-truffle-text2 uppercase">
              {t.receiptUpload.transactionsFound(parsed.length)}
            </div>
          )}
          <Rule className="my-1.5" />
          {receipt ? (
            // A receipt: its printed line items (if readable), then the total.
            receipt.itemsLegible &&
            receipt.items.map((item, i) => (
              <div key={i} className="print-in" style={{ animationDelay: `${i * 60}ms` }}>
                <LeaderRow
                  baseline
                  left={item.name}
                  right={<b>{fmt(receipt.currency, Math.abs(item.amount))}</b>}
                />
              </div>
            ))
          ) : (
            parsed.map((tx, i) => (
              <div key={i} className="print-in" style={{ animationDelay: `${i * 60}ms` }}>
                <LeaderRow baseline left={tx.description} right={<b>{fmt(tx.currency, tx.amount)}</b>} />
                <div className="text-[11px] text-truffle-text2">
                  {tx.date} · {t.categories[tx.category] ?? tx.category}
                </div>
              </div>
            ))
          )}
          {(!receipt || receipt.itemsLegible) && <Rule className="my-1.5" />}
          {currencies.size === 1 && (
            <div
              className="flex justify-between text-lg font-bold uppercase print-in"
              style={{ animationDelay: `${(receipt?.items.length ?? parsed.length) * 60}ms` }}
            >
              <span>{t.receiptUpload.total}</span>
              <span>{fmt(parsed[0]!.currency, total)}</span>
            </div>
          )}
          <div className="flex justify-between text-[11px] text-truffle-text2 uppercase">
            <span>
              {receipt
                ? receipt.itemsLegible
                  ? t.receiptUpload.items(receipt.items.length)
                  : t.receiptUpload.totalOnly
                : t.receiptUpload.items(parsed.length)}
            </span>
            <span className="truncate max-w-[50%]">{preview?.file.name}</span>
          </div>
        </div>
        {single && (
          <div className="mx-4 mt-4 px-1 flex gap-1.5 items-center min-h-11 text-[13px]">
            <label htmlFor="scan-category" className="text-truffle-text2">
              {t.addTransaction.categoryLabel}
            </label>
            <span aria-hidden className="leader !mb-0 mt-1.5 self-center" />
            <select
              id="scan-category"
              value={single.category}
              onChange={(e) =>
                setParsed([{ ...single, category: e.target.value as TransactionCategory }])
              }
              className="bg-transparent font-bold text-right focus:outline-none"
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.categories[c] ?? c}
                </option>
              ))}
            </select>
          </div>
        )}
        {flow.error && (
          <NoticeSlip tone="negative" title={t.receiptUpload.errorTitle} className="mx-4 mt-4">
            {flow.error}
          </NoticeSlip>
        )}
      </Sheet>
    )
  }

  // ── Capture: live viewfinder (or file picker fallback), shutter, files ──
  const live = camera.state === 'live' && !preview
  const snap = async () => {
    if (live) {
      const file = await camera.capture()
      if (file) selectFile(file)
    } else {
      cameraRef.current?.click()
    }
  }

  return (
    <Sheet
      title={t.receiptUpload.title}
      onClose={onClose}
      closeLabel={t.common.close}
      dark={!preview}
      right={
        live && camera.torchSupported ? (
          <button
            type="button"
            onClick={camera.toggleTorch}
            aria-pressed={camera.torchOn}
            aria-label={t.receiptUpload.torch}
            className={`w-11 h-11 rounded-lg grid place-items-center text-sm ${camera.torchOn ? 'bg-[#f6bd87] text-[#1b1a18]' : 'bg-black/50'}`}
          >
            ϟ
          </button>
        ) : null
      }
    >
      {inputs}
      <div className="relative flex-1 flex flex-col">
        {/* Always mounted so the stream can attach before it goes live. */}
        <video
          ref={camera.videoRef}
          playsInline
          muted
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover ${live ? '' : 'hidden'}`}
        />
        {!preview && camera.state !== 'live' && (
          <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#1c1b19_0_10px,#171615_10px_20px)]" />
        )}

        <div className="relative mx-auto mt-2 flex p-[3px] rounded-lg bg-black/55" role="radiogroup" aria-label={t.receiptUpload.mode}>
          <span
            role="radio"
            aria-checked
            className="h-[38px] px-3.5 rounded-md bg-[#efe9de] text-[#121211] grid place-items-center text-xs font-bold uppercase"
          >
            {t.receiptUpload.receipt}
          </span>
          <button
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => fileRef.current?.click()}
            className={`h-[38px] px-3.5 grid place-items-center text-xs font-bold uppercase ${preview ? 'text-truffle-text' : ''}`}
          >
            {t.receiptUpload.pdf}
          </button>
        </div>

        <button
          type="button"
          onClick={() => (preview || live ? undefined : fileRef.current?.click())}
          aria-label={preview ? preview.file.name : live ? t.receiptUpload.lineUp : t.receiptUpload.tapToSelect}
          className="relative mx-12 mt-6 min-h-[360px] flex-1 max-h-[440px] border-2 border-dashed border-[#f6bd87] grid place-items-center overflow-hidden"
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
          ) : live ? null : (
            <span className="px-6 text-xs text-[#8a857d] uppercase leading-relaxed">
              {camera.state === 'starting' ? t.receiptUpload.startingCamera : t.receiptUpload.tapToSelect}
              <br />
              {t.receiptUpload.fileTypes}
            </span>
          )}
          {(flow.isLoading || live) && (
            <div
              aria-hidden
              className="absolute left-0 right-0 h-0.5 bg-[#f6bd87]"
              style={{ boxShadow: '0 0 12px #f6bd87', animation: 'tr-scan 1.6s ease-in-out infinite' }}
            />
          )}
        </button>

        <p className="relative mx-8 mt-5 text-center text-[13px] font-bold uppercase" aria-live="polite">
          {flow.isLoading ? (
            <Tallying label={t.receiptUpload.analysing} />
          ) : preview ? (
            preview.file.name
          ) : live ? (
            t.receiptUpload.lineUp
          ) : (
            t.receiptUpload.hint
          )}
        </p>

        {flow.error && (
          <NoticeSlip tone="warning" title={t.receiptUpload.errorTitle} className="relative mx-4 mt-4 text-truffle-text">
            {flow.error}
          </NoticeSlip>
        )}

        <div className="relative mt-auto px-8 pt-6 pb-[max(40px,env(safe-area-inset-bottom))] flex justify-between items-center">
          {preview ? (
            <>
              <button
                type="button"
                onClick={reset}
                disabled={flow.isLoading}
                className="key key-line h-[52px] px-3 text-[11px] uppercase"
              >
                {t.receiptUpload.retake}
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
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label={t.receiptUpload.files}
                className="w-[52px] h-[52px] rounded-lg border border-[#5a554d] bg-[repeating-linear-gradient(135deg,#3a3733_0_4px,#2a2826_4px_8px)]"
              />
              <button
                type="button"
                onClick={snap}
                aria-label={t.receiptUpload.shutter}
                className="w-[84px] h-[84px] rounded-full border-4 border-[#efe9de] grid place-items-center active:scale-95 transition-transform"
              >
                <span className="w-[66px] h-[66px] rounded-full bg-[#f6bd87]" />
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-[52px] h-[52px] rounded-lg bg-black/50 grid place-items-center text-[11px] font-bold uppercase"
              >
                {t.receiptUpload.files}
              </button>
            </>
          )}
        </div>
      </div>
    </Sheet>
  )
}
