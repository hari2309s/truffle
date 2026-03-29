'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TransactionCategory } from '@truffle/types'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  currency: 'EUR' | 'GBP' | 'USD'
  category: TransactionCategory
}

interface ReceiptUploadProps {
  userId: string
  onClose?: () => void
}

const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' }

export function ReceiptUpload({ userId, onClose }: ReceiptUploadProps) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ file: File; objectUrl: string } | null>(null)
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setParsed(null)
    setImported(false)

    const isPDF = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    if (!isPDF && !isImage) {
      setError('Please choose an image (JPEG, PNG, WEBP) or a PDF.')
      return
    }

    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    const objectUrl = isImage ? URL.createObjectURL(file) : ''
    setPreview({ file, objectUrl })
  }

  const handleParse = async () => {
    if (!preview) return
    setIsParsing(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', preview.file)

      const res = await fetch('/api/parse-receipt', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Could not parse the file. Try a clearer image.')
        return
      }

      if (!json.transactions?.length) {
        setError('No transactions found. Make sure the receipt or statement is legible.')
        return
      }

      setParsed(json.transactions as ParsedTransaction[])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    if (!parsed) return
    setIsImporting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactions: parsed.map((t) => ({
            ...t,
            merchant: t.description,
            isRecurring: false,
            userId,
          })),
        }),
      })
      if (!res.ok) throw new Error('Import failed')

      await queryClient.refetchQueries({ queryKey: ['transactions', userId] })
      setImported(true)
    } catch {
      setError('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const reset = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
    setParsed(null)
    setError(null)
    setImported(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (imported) {
    return (
      <div className="card text-center space-y-3">
        <p className="text-2xl">✓</p>
        <p className="font-semibold text-truffle-text">
          {parsed?.length} transaction{parsed?.length !== 1 ? 's' : ''} imported
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
        <h3 className="font-semibold text-truffle-text">Scan receipt / statement</h3>
        <span className="text-xs text-truffle-muted">image or PDF</span>
      </div>

      {/* File picker */}
      {!preview && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-truffle-border rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-truffle-amber transition-colors"
        >
          <span className="text-2xl">🧾</span>
          <p className="text-sm text-truffle-muted">Tap to select a receipt or bank statement</p>
          <p className="text-xs text-truffle-muted">JPEG · PNG · WEBP · PDF</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {/* Preview + parse */}
      {preview && !parsed && (
        <div className="space-y-3">
          {preview.objectUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview.objectUrl}
              alt="Receipt preview"
              className="w-full max-h-48 object-contain rounded-lg border border-truffle-border"
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-truffle-border bg-truffle-surface">
              <span className="text-lg">📄</span>
              <span className="text-sm text-truffle-text truncate">{preview.file.name}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={reset} className="btn-ghost flex-1 text-sm">
              Change file
            </button>
            <button
              onClick={handleParse}
              disabled={isParsing}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {isParsing ? 'Analysing…' : 'Extract transactions'}
            </button>
          </div>
        </div>
      )}

      {/* Parsed results */}
      {parsed && (
        <div className="space-y-3">
          <p className="text-sm text-truffle-muted">
            {parsed.length} transaction{parsed.length !== 1 ? 's' : ''} found — review before
            importing
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {parsed.map((t, i) => {
              const sym = CURRENCY_SYMBOL[t.currency] ?? t.currency
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-truffle-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-truffle-text truncate block">{t.description}</span>
                    <span className="text-truffle-muted">
                      {t.date} · {t.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span
                    className={`ml-3 font-medium tabular-nums ${t.amount >= 0 ? 'text-truffle-green' : 'text-truffle-red'}`}
                  >
                    {t.amount >= 0 ? '+' : ''}
                    {sym}
                    {Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="btn-ghost flex-1 text-sm">
              Try again
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              {isImporting ? 'Importing…' : `Import ${parsed.length}`}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-truffle-red">{error}</p>}
    </div>
  )
}
