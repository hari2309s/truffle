'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
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

export function HabitProposalCard({ proposal, userId, onResult }: HabitProposalCardProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'pending' | 'saving' | 'done' | 'declined'>('pending')

  const formattedAmount = `€${proposal.amount.toFixed(2)}/${proposal.frequency === 'weekly' ? 'week' : 'month'}`

  const handleYes = async () => {
    setStatus('saving')
    await fetch('/api/habits', {
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
    await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
    setStatus('done')
    onResult(true)
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
      <div className="max-w-[85%] bg-truffle-card border border-truffle-amber/40 rounded-2xl rounded-bl-sm px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{proposal.emoji}</span>
          <div>
            <p className="font-semibold text-truffle-text text-sm">{proposal.name}</p>
            <p className="text-xs text-truffle-muted capitalize">{formattedAmount}</p>
          </div>
        </div>

        <p className="text-sm text-truffle-muted">{proposal.pitch}</p>

        <p className="text-sm font-medium text-truffle-text">Set up this saving habit?</p>

        <div className="flex gap-2">
          <button
            onClick={handleNo}
            disabled={status === 'saving'}
            className="flex-1 btn-ghost text-sm py-2"
          >
            No thanks
          </button>
          <button
            onClick={handleYes}
            disabled={status === 'saving'}
            className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving…' : 'Add habit'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
