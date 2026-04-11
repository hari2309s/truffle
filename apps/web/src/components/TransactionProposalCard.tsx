'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { truffleEase } from '@/lib/motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TransactionCategory } from '@truffle/types'
import { CATEGORY_EMOJI } from '@/lib/categories'

export { CATEGORY_EMOJI }

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

export function TransactionProposalCard({
  proposal,
  userId,
  onResult,
}: TransactionProposalCardProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'pending' | 'saving' | 'done' | 'declined'>('pending')

  const isExpense = proposal.amount < 0
  const formattedAmount = `${isExpense ? '-' : '+'}€${Math.abs(proposal.amount).toFixed(2)}`
  const amountColor = isExpense ? 'text-red-400' : 'text-green-400'
  const emoji = CATEGORY_EMOJI[proposal.category] ?? '📝'
  const categoryLabel = proposal.category.replace(/_/g, ' ')
  const formattedDate = new Date(proposal.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const handleYes = async () => {
    setStatus('saving')
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        transactions: [
          {
            userId,
            amount: proposal.amount,
            currency: 'EUR',
            description: proposal.description,
            category: proposal.category,
            merchant: proposal.merchant ?? null,
            date: proposal.date,
            isRecurring: false,
          },
        ],
      }),
    })
    await queryClient.refetchQueries({ queryKey: ['transactions', userId] })
    await supabase.from('chat_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: `${emoji} ${proposal.description} logged — ${formattedAmount}`,
    })
    setStatus('done')
    onResult(true)
  }

  const handleNo = () => {
    setStatus('declined')
    onResult(false)
  }

  // Return null on done/declined — ChatPage's inv.state === 'result' branch
  // renders the persistent confirmation, avoiding a double bubble.
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
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className="font-semibold text-truffle-text text-sm">{proposal.description}</p>
            <p className="text-xs text-truffle-muted">
              {proposal.merchant ? `${proposal.merchant} · ` : ''}
              {categoryLabel} · {formattedDate}
            </p>
          </div>
          <span className={`ml-auto font-semibold text-sm ${amountColor}`}>{formattedAmount}</span>
        </div>

        <p className="text-sm font-medium text-truffle-text">Log this transaction?</p>

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
            {status === 'saving' ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
