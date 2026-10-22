'use client'

import Image from 'next/image'
import { useState } from 'react'
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
                  glyph: '?',
                  label: d.ask,
                  onClick: () => {
                    setChatHandoff(askQuestion)
                    router.push('/chat')
                  },
                },
              ] as const
            ).map((key) => (
              <button
                key={key.label}
                type="button"
                onClick={key.onClick}
                className="key key-plain h-[60px] flex-col !gap-0 text-[11px] uppercase"
              >
                <span aria-hidden className="text-base">
                  {key.glyph}
                </span>
                {key.label}
              </button>
            ))}
          </div>

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
      </AnimatePresence>
    </Sheet>
  )
}
