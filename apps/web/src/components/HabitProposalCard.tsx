'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'
import { truffleEase } from '@/lib/motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useProposalCard } from './GoalProposalCard'
import { LeaderRow } from './Tally'

export interface HabitProposal {
  name: string
  amount: number
  frequency: 'weekly' | 'monthly'
  emoji: string
  pitch: string
}

interface HabitProposalCardProps {
  proposal: HabitProposal
  userId: string
  onResult: (confirmed: boolean) => void
}

export const HabitProposalCard = memo(function HabitProposalCard({
  proposal,
  userId,
  onResult,
}: HabitProposalCardProps) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const queryClient = useQueryClient()

  const periodLabel =
    proposal.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth
  const frequencyLabel =
    proposal.frequency === 'weekly' ? t.proposals.habit.weeklyLabel : t.proposals.habit.monthlyLabel

  const { status, error, handleYes, handleNo } = useProposalCard({
    onResult,
    errorMessage: t.proposals.habit.error,
    onConfirm: async () => {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: proposal.name,
          amount: proposal.amount,
          frequency: proposal.frequency,
          emoji: proposal.emoji,
        }),
      })
      if (!res.ok) throw new Error('Failed to create habit')
      await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
      await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: `${proposal.emoji} ${proposal.name} — ${formatAmount(proposal.amount)}/${periodLabel}. ${t.proposals.habit.logEachPeriod(periodLabel)}`,
      })
    },
  })

  if (status === 'done' || status === 'declined') return null

  return (
    <motion.div
      className="slip px-4 pt-3.5 pb-[26px] flex flex-col gap-2 text-sm"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: truffleEase }}
    >
      <span className="text-xs font-bold uppercase text-truffle-accent-ink">
        {t.proposals.habit.proposed}
      </span>
      <LeaderRow
        className="text-base"
        left={`${proposal.emoji} ${proposal.name}`}
        right={
          <b>
            {formatAmount(proposal.amount)}/{periodLabel}
          </b>
        }
      />
      <LeaderRow
        className="text-truffle-text2"
        left={frequencyLabel}
        right={t.proposals.habit.logEachPeriod(periodLabel)}
      />
      <p className="font-grotesk text-sm leading-[1.45] text-truffle-text2">{proposal.pitch}</p>

      {error && <p className="text-xs font-bold text-truffle-negative uppercase">■ {error}</p>}

      <div className="grid grid-cols-2 gap-2 pt-1.5">
        <button
          type="button"
          onClick={handleYes}
          disabled={status === 'saving'}
          className="key key-ink h-12 text-[13px] uppercase"
        >
          {status === 'saving' ? t.proposals.habit.settingUp : t.proposals.habit.startSaving}
        </button>
        <button
          type="button"
          onClick={handleNo}
          disabled={status === 'saving'}
          className="key key-line h-12 text-[13px] uppercase"
        >
          {t.proposals.habit.notNow}
        </button>
      </div>
    </motion.div>
  )
})
