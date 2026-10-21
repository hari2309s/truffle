'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'
import { usePostHog } from 'posthog-js/react'
import { truffleEase } from '@/lib/motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TransactionCategory } from '@truffle/types'
import { CATEGORY_EMOJI } from '@/lib/categories'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'
import { useProposalCard } from './GoalProposalCard'
import { LeaderRow, MINUS } from './Tally'

export interface TransactionProposal {
  description: string
  amount: number
  category: TransactionCategory
  merchant?: string
  date: string
}

interface TransactionProposalCardProps {
  proposal: TransactionProposal
  userId: string
  onResult: (confirmed: boolean) => void
}

export const TransactionProposalCard = memo(function TransactionProposalCard({
  proposal,
  userId,
  onResult,
}: TransactionProposalCardProps) {
  const { t, locale } = useLanguage()
  const { formatAmount, currency } = useCurrency()
  const queryClient = useQueryClient()
  const posthog = usePostHog()

  const isExpense = proposal.amount < 0
  const formattedAmount = `${isExpense ? '-' : '+'}${formatAmount(proposal.amount)}`
  const emoji = CATEGORY_EMOJI[proposal.category] ?? '📝'
  const categoryLabel = t.categories[proposal.category] ?? proposal.category.replace(/_/g, ' ')
  const formattedDate = new Date(proposal.date).toLocaleDateString(toDateLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const { status, error, handleYes, handleNo } = useProposalCard({
    onResult,
    errorMessage: t.proposals.transaction.error,
    onConfirm: async () => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactions: [
            {
              userId,
              amount: proposal.amount,
              currency,
              description:
                proposal.description.charAt(0).toUpperCase() + proposal.description.slice(1),
              category: proposal.category,
              merchant: proposal.merchant ?? null,
              date: proposal.date,
              isRecurring: false,
            },
          ],
        }),
      })
      if (!res.ok) throw new Error('Failed to log transaction')

      posthog.capture('transaction_added', {
        category: proposal.category,
        is_expense: proposal.amount < 0,
        source: 'voice',
      })

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: `${emoji} ${proposal.description} logged — ${formattedAmount}`,
      })
    },
  })

  // Return null on done/declined — ChatPage's inv.state === 'result' branch
  // renders the persistent confirmation, avoiding a double bubble.
  if (status === 'done' || status === 'declined') return null

  return (
    <motion.div
      className="slip px-4 pt-3.5 pb-[26px] flex flex-col gap-2 text-sm border-t-[6px] border-truffle-accent"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: truffleEase }}
    >
      <span className="text-xs font-bold uppercase text-truffle-accent-ink">
        {t.proposals.transaction.proposed}
      </span>
      <LeaderRow
        className="text-base"
        left={proposal.merchant ? `${proposal.merchant} · ${categoryLabel}` : `${proposal.description} · ${categoryLabel}`}
        right={
          <b className={isExpense ? '' : 'text-truffle-positive'}>
            {isExpense ? MINUS : '+'}
            {formatAmount(proposal.amount)}
          </b>
        }
      />
      <span className="text-xs text-truffle-text2 uppercase">
        {formattedDate} · {currency}
        {proposal.merchant ? ` · ${proposal.description}` : ''}
      </span>

      {error && <p className="text-xs font-bold text-truffle-negative uppercase">■ {error}</p>}

      <div className="grid grid-cols-2 gap-2 pt-1.5">
        <button
          type="button"
          onClick={handleYes}
          disabled={status === 'saving'}
          className="key key-accent h-12 text-[13px] uppercase"
        >
          {status === 'saving' ? t.proposals.transaction.saving : t.proposals.transaction.add}
        </button>
        <button
          type="button"
          onClick={handleNo}
          disabled={status === 'saving'}
          className="key key-line h-12 text-[13px] uppercase"
        >
          {t.proposals.transaction.noThanks}
        </button>
      </div>
    </motion.div>
  )
})
