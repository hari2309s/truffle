'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import type { Transaction } from '@truffle/types'
import { useBudgetsQuery } from '@/hooks/useBudgetsQuery'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { setChatHandoff } from '@/lib/chatHandoff'
import { toDateLocale } from '@/lib/date'
import { budgetView } from '@/lib/budgets'
import { EditForm } from './TransactionEditForm'
import { SplitSheet } from './SplitSheet'
import { LeaderRow, MINUS, Rule, Sheet, TRUFFLE_ICON } from './Tally'

/** Distance (px) a slip must be dragged to tear it off. */
const TEAR_DISTANCE = 140

/** One entry, itemised — view, edit, ask about it, or tear it off. */
export function TransactionDetailSheet({
  tx,
  userId,
  onClose,
}: {
  tx: Transaction
  userId: string
  onClose: () => void
}) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: budgets = [] } = useBudgetsQuery(userId)
  const { data: txData } = useTransactionsQuery(userId)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [splitting, setSplitting] = useState(false)
  const [receiptBusy, setReceiptBusy] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ url: string; isPdf: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const receiptRequest = async (init: RequestInit, query = '') => {
    setReceiptBusy(true)
    setReceiptError(null)
    try {
      const res = await fetch(`/api/transactions/receipt${query}`, init)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? d.receiptError)
      return json
    } catch (e) {
      setReceiptError(e instanceof Error ? e.message : d.receiptError)
      return null
    } finally {
      setReceiptBusy(false)
    }
  }

  const attachReceipt = async (file: File) => {
    const body = new FormData()
    body.append('transactionId', tx.id)
    body.append('file', file)
    if (await receiptRequest({ method: 'POST', body })) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      onClose()
    }
  }

  const openReceipt = async () => {
    const json = await receiptRequest({}, `?transactionId=${encodeURIComponent(tx.id)}`)
    if (json?.url) setViewer({ url: json.url, isPdf: Boolean(json.isPdf) })
  }

  const removeReceipt = async () => {
    const json = await receiptRequest(
      { method: 'DELETE' },
      `?transactionId=${encodeURIComponent(tx.id)}`
    )
    if (json) {
      setViewer(null)
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      onClose()
    }
  }

  const d = t.entryDetail
  const isIncome = tx.amount > 0
  const category = t.categories[tx.category] ?? tx.category
  const dateLabel = new Date(tx.date + 'T12:00:00').toLocaleDateString(toDateLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // This month's position against the category budget, if there is one.
  const budget = budgets.find((b) => b.category === tx.category)
  let budgetLine: { text: string; color: string } | null = null
  if (budget && budget.amount > 0 && !isIncome) {
    const view = budgetView(budget, txData?.transactions ?? [])
    const pct = Math.round(view.pct)
    budgetLine =
      view.status === 'over'
        ? { text: `■ ${category} ${pct}%`, color: 'text-truffle-negative' }
        : view.status === 'headsUp'
          ? { text: `▲ ${category} ${pct}%`, color: 'text-truffle-warning' }
          : { text: `● ${category} ${pct}%`, color: 'text-truffle-positive' }
  }

  const askQuestion = d.askQuestion(tx.merchant || tx.description)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/transactions?userId=${userId}&transactionId=${tx.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      onClose()
    } catch {
      setError(d.deleteError)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <Sheet
      title={d.title(tx.id.replace(/-/g, '').slice(0, 4).toUpperCase())}
      onClose={onClose}
      closeLabel={t.common.close}
      closeGlyph="←"
      right={
        !editing && (
          <button type="button" onClick={() => setEditing(true)} className="uppercase">
            {d.edit}
          </button>
        )
      }
      footer={
        !editing && (
          <div className="flex flex-col gap-2">
            <div aria-hidden className="flex items-center gap-2 text-xs font-bold text-truffle-negative uppercase">
              <span>✂</span>
              <span className="flex-1 border-t border-dashed border-truffle-negative" />
              <span>{d.swipeToTear}</span>
            </div>
            <motion.button
              type="button"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > TEAR_DISTANCE) void handleDelete()
              }}
              onClick={() => (confirming ? void handleDelete() : setConfirming(true))}
              disabled={deleting}
              className="h-[52px] rounded-lg bg-truffle-neg-soft text-truffle-negative grid place-items-center text-sm font-bold uppercase touch-pan-y disabled:opacity-50"
            >
              {deleting ? d.deleting : confirming ? `✕ ${d.tapAgain}` : `✕ ${d.delete}`}
            </motion.button>
            {error && (
              <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
                ■ {error}
              </p>
            )}
          </div>
        )
      }
    >
      {editing ? (
        <div className="slip mx-4 mt-3 px-[18px] pt-2 pb-7">
          <EditForm
            tx={tx}
            userId={userId}
            focus="amount"
            onSave={async () => {
              await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
              onClose()
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="slip print-in mx-4 mt-3 px-[18px] pt-5 pb-[34px] flex flex-col gap-2 text-[13px]">
            <span className="text-xs text-truffle-text2 uppercase">{dateLabel}</span>
            <span className="font-grotesk text-[28px] font-medium leading-tight break-words">
              {tx.description}
            </span>
            <span className="text-xs text-truffle-text2 uppercase">
              {tx.merchant ? `${tx.merchant} · ` : ''}
              {category}
            </span>
            <Rule className="my-1.5" />
            <LeaderRow
              className="text-[15px]"
              left={isIncome ? d.received : d.charged}
              right={
                <b className={isIncome ? 'text-truffle-positive' : ''}>
                  {isIncome ? '+' : MINUS}
                  {formatAmount(tx.amount)}
                </b>
              }
            />
            <LeaderRow className="text-truffle-text2" left={d.currency} right={tx.currency} />
            {tx.note && (
              <p className="m-0 pt-1 font-grotesk text-sm leading-[1.45] text-truffle-text2 whitespace-pre-wrap">
                <span className="font-mono text-[11px] font-bold uppercase text-truffle-text">
                  {d.note} ·{' '}
                </span>
                {tx.note}
              </p>
            )}
            {tx.isRecurring && (
              <LeaderRow className="text-truffle-text2" left={d.recurring} right={d.yes} />
            )}
            <Rule className="my-1.5" />
            <div className="flex justify-between text-[22px] font-bold uppercase">
              <span>{d.total}</span>
              <span>
                {isIncome ? '+' : MINUS}
                {formatAmount(tx.amount)}
              </span>
            </div>
            {budgetLine && (
              <LeaderRow
                className="pt-2"
                left={<span className="text-truffle-text2">{d.budget}</span>}
                right={<b className={budgetLine.color}>{budgetLine.text}</b>}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mx-4 mt-5">
            {(
              [
                { glyph: '✎', label: d.edit, onClick: () => setEditing(true) },
                { glyph: '⫽', label: d.split, onClick: () => setSplitting(true) },
                {
                  glyph: '▤',
                  label: tx.receiptPath ? d.receipt : d.attach,
                  onClick: () => (tx.receiptPath ? void openReceipt() : fileRef.current?.click()),
                },
              ] as const
            ).map((key) => (
              <button
                key={key.label}
                type="button"
                onClick={key.onClick}
                disabled={receiptBusy && key.glyph === '▤'}
                className="key key-plain h-[60px] flex-col !gap-0 text-[11px] uppercase"
              >
                <span aria-hidden className="text-base">
                  {key.glyph}
                </span>
                {receiptBusy && key.glyph === '▤' ? d.working : key.label}
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void attachReceipt(file)
              e.target.value = ''
            }}
          />
          {receiptError && (
            <p role="alert" className="mx-4 mt-3 text-[11px] font-bold uppercase text-truffle-negative">
              ■ {receiptError}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setChatHandoff(askQuestion)
              router.push('/chat')
            }}
            className="mx-4 mt-4 py-3 px-3.5 bg-truffle-surface flex gap-2.5 items-center text-left"
          >
            <Image src={TRUFFLE_ICON} alt="" width={28} height={28} />
            <span className="font-grotesk text-sm leading-[1.4] flex-1">
              {d.askAbout}: “{askQuestion}”
            </span>
          </button>
        </>
      )}
      <AnimatePresence>
        {splitting && (
          <SplitSheet
            key="split"
            tx={tx}
            userId={userId}
            onClose={() => setSplitting(false)}
            onDone={onClose}
          />
        )}
        {viewer && (
          <Sheet
            key="receipt"
            title={d.receipt}
            onClose={() => setViewer(null)}
            closeLabel={t.common.close}
            closeGlyph="←"
            footer={
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={viewer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="key key-plain h-14 text-[13px] uppercase"
                >
                  {d.openFull}
                </a>
                <button
                  type="button"
                  onClick={removeReceipt}
                  disabled={receiptBusy}
                  className="key key-danger h-14 text-[13px] uppercase"
                >
                  ✕ {d.removeReceipt}
                </button>
              </div>
            }
          >
            <div className="flex-1 mx-4 mt-3 mb-2 grid place-items-center paper overflow-hidden">
              {viewer.isPdf ? (
                <iframe src={viewer.url} title={d.receipt} className="w-full h-full min-h-[60vh] border-0" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={viewer.url} alt={d.receipt} className="max-w-full max-h-[70vh] object-contain" />
              )}
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
