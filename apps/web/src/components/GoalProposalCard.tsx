'use client'

import { motion } from 'framer-motion'
import { memo, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { truffleEase } from '@/lib/motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'
import { parseLocalDay } from '@/lib/toolArgs'
import { LeaderRow } from './Tally'

interface GoalProposal {
  name: string
  targetAmount: number
  deadline?: string
  emoji: string
  pitch: string
}

interface GoalProposalCardProps {
  proposal: GoalProposal
  userId: string
  onResult: (confirmed: boolean) => void
}

export type ProposalCardStatus = 'pending' | 'saving' | 'done' | 'declined'

interface UseProposalCardParams {
  onResult: (confirmed: boolean) => void
  /** Performs the payload-specific fetch + capture + insert. Throw to signal failure. */
  onConfirm: () => Promise<void>
  errorMessage: string
}

/**
 * Shared accept/decline state machine for the propose* cards (goal, habit,
 * transaction). Each card supplies its own fetch/PostHog-capture/Supabase-insert
 * logic via `onConfirm` — this hook only owns the pending/saving/done/declined
 * transitions and the error string.
 */
export function useProposalCard({ onResult, onConfirm, errorMessage }: UseProposalCardParams) {
  const [status, setStatus] = useState<ProposalCardStatus>('pending')
  const [error, setError] = useState<string | null>(null)

  const handleYes = async () => {
    setStatus('saving')
    setError(null)
    try {
      await onConfirm()
      setStatus('done')
      onResult(true)
    } catch {
      setError(errorMessage)
      setStatus('pending')
    }
  }

  const handleNo = () => {
    setStatus('declined')
    onResult(false)
  }

  return { status, error, handleYes, handleNo }
}

export const GoalProposalCard = memo(function GoalProposalCard({
  proposal,
  userId,
  onResult,
}: GoalProposalCardProps) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const posthog = usePostHog()

  const { status, error, handleYes, handleNo } = useProposalCard({
    onResult,
    errorMessage: t.proposals.goal.error,
    onConfirm: async () => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: proposal.name,
          targetAmount: proposal.targetAmount,
          savedAmount: 0,
          deadline: proposal.deadline || null,
          emoji: proposal.emoji,
        }),
      })
      if (!res.ok) throw new Error('Failed to save goal')

      posthog.capture('goal_created', {
        target_amount: proposal.targetAmount,
        has_deadline: Boolean(proposal.deadline),
        source: 'voice',
      })

      await queryClient.invalidateQueries({ queryKey: ['goals', userId] })
      await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: `${proposal.emoji} ${proposal.name} added to your goals — find it in Insights.`,
      })
    },
  })

  // Return null on done/declined — ChatPage's output-available branch renders
  // the persistent confirmation slip, avoiding a double print.
  if (status === 'done' || status === 'declined') return null

  return (
    <motion.div
      className="slip px-4 pt-3.5 pb-[26px] flex flex-col gap-2 text-sm"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: truffleEase }}
    >
      <span className="text-xs font-bold uppercase text-truffle-accent-ink">
        {t.proposals.goal.proposed}
      </span>
      <LeaderRow
        className="text-base"
        left={`${proposal.emoji} ${proposal.name}`}
        right={<b>{formatAmount(proposal.targetAmount)}</b>}
      />
      {proposal.deadline && (
        <LeaderRow
          className="text-truffle-text2"
          left={t.proposals.goal.deadline}
          right={parseLocalDay(proposal.deadline).toLocaleDateString(toDateLocale(locale), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        />
      )}
      <p className="font-grotesk text-sm leading-[1.45] text-truffle-text2">{proposal.pitch}</p>

      {error && <p className="text-xs font-bold text-truffle-negative uppercase">■ {error}</p>}

      <div className="grid grid-cols-2 gap-2 pt-1.5">
        <button
          type="button"
          onClick={handleYes}
          disabled={status === 'saving'}
          className="key key-ink h-12 text-[13px] uppercase"
        >
          {status === 'saving' ? t.proposals.goal.saving : t.proposals.goal.yesAddIt}
        </button>
        <button
          type="button"
          onClick={handleNo}
          disabled={status === 'saving'}
          className="key key-line h-12 text-[13px] uppercase"
        >
          {t.proposals.goal.noThanks}
        </button>
      </div>
    </motion.div>
  )
})
