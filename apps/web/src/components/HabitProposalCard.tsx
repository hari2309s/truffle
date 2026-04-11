'use client'

import { motion } from 'framer-motion'
import { memo, useState } from 'react'
import { truffleEase } from '@/lib/motion'
import { useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'pending' | 'saving' | 'done' | 'declined'>('pending')
  const [error, setError] = useState<string | null>(null)

  const periodLabel = proposal.frequency === 'weekly' ? 'week' : 'month'
  const frequencyLabel = proposal.frequency === 'weekly' ? 'Weekly' : 'Monthly'

  const handleYes = async () => {
    setStatus('saving')
    setError(null)
    try {
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
      setStatus('done')
      onResult(true)
    } catch {
      setError('Something went wrong — please try again.')
      setStatus('pending')
    }
  }

  const handleNo = () => {
    setStatus('declined')
    onResult(false)
  }

  if (status === 'done' || status === 'declined') return null

  return (
    <motion.div
      className="flex justify-start mb-3"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: truffleEase }}
    >
      <div className="max-w-[85%] bg-truffle-card border border-truffle-green/40 rounded-2xl rounded-bl-sm overflow-hidden">
        {/* Header band */}
        <div className="bg-truffle-green/10 px-4 py-3 flex items-center gap-2">
          <span className="text-base">🔁</span>
          <span className="text-xs font-semibold text-truffle-green uppercase tracking-wide">
            {frequencyLabel} saving habit
          </span>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Habit identity */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{proposal.emoji}</span>
            <div>
              <p className="font-semibold text-truffle-text text-sm">{proposal.name}</p>
              <p className="text-xs text-truffle-muted">
                You log each {periodLabel} yourself in Insights
              </p>
            </div>
          </div>

          {/* Amount callout */}
          <div className="bg-truffle-surface rounded-xl px-4 py-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-truffle-green">
              €{proposal.amount.toFixed(0)}
            </span>
            <span className="text-sm text-truffle-muted">/ {periodLabel}</span>
          </div>

          {/* Pitch */}
          <p className="text-xs text-truffle-muted leading-relaxed">{proposal.pitch}</p>

          {error && <p className="text-xs text-truffle-red">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleNo}
              disabled={status === 'saving'}
              className="flex-1 btn-ghost text-sm py-2"
            >
              Not now
            </button>
            <button
              onClick={handleYes}
              disabled={status === 'saving'}
              className="flex-1 text-sm py-2 rounded-xl font-semibold bg-truffle-green text-truffle-bg disabled:opacity-50 transition-opacity"
            >
              {status === 'saving' ? 'Setting up…' : 'Start saving'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
