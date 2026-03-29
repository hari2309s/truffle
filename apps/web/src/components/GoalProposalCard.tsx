'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

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

export function GoalProposalCard({ proposal, userId, onResult }: GoalProposalCardProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'pending' | 'saving' | 'done' | 'declined'>('pending')

  const handleYes = async () => {
    setStatus('saving')
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name: proposal.name,
        targetAmount: proposal.targetAmount,
        savedAmount: 0,
        deadline: proposal.deadline ?? null,
        emoji: proposal.emoji,
      }),
    })
    await queryClient.refetchQueries({ queryKey: ['goals', userId] })
    setStatus('done')
    onResult(true)
  }

  const handleNo = () => {
    setStatus('declined')
    onResult(false)
  }

  if (status === 'done') {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-sm text-truffle-text">
            {proposal.emoji} <span className="font-medium">{proposal.name}</span> added to your
            goals — find it in Insights.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'declined') return null

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] bg-truffle-card border border-truffle-amber/40 rounded-2xl rounded-bl-sm px-4 py-4 space-y-3">
        {/* Goal summary */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{proposal.emoji}</span>
          <div>
            <p className="font-semibold text-truffle-text text-sm">{proposal.name}</p>
            <p className="text-xs text-truffle-muted">
              €{proposal.targetAmount.toLocaleString()}
              {proposal.deadline
                ? ` · by ${new Date(proposal.deadline).toLocaleDateString('en-GB', {
                    month: 'short',
                    year: 'numeric',
                  })}`
                : ''}
            </p>
          </div>
        </div>

        <p className="text-xs text-truffle-text-secondary leading-relaxed">{proposal.pitch}</p>

        <p className="text-sm font-medium text-truffle-text">Add this to your goals?</p>

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
            {status === 'saving' ? 'Saving…' : 'Yes, add it'}
          </button>
        </div>
      </div>
    </div>
  )
}
