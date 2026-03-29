'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface WeeklySummaryProps {
  userId: string
}

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

function buildSummary(
  transactions: { amount: number | string; category: string; date: string }[]
): string | null {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  const weekTxs = transactions.filter((t) => new Date(t.date) >= weekAgo)
  if (weekTxs.length === 0) return null

  const income = weekTxs
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0)
  const expenses = weekTxs
    .filter((t) => Number(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  const catTotals: Record<string, number> = {}
  for (const tx of weekTxs) {
    if (Number(tx.amount) < 0) {
      catTotals[tx.category] = (catTotals[tx.category] ?? 0) + Math.abs(Number(tx.amount))
    }
  }
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const topLabel = topCategory.replace(/_/g, ' ')

  let text = `This week you spent €${expenses.toFixed(0)}`
  if (income > 0) text += ` and earned €${income.toFixed(0)}`
  if (topLabel) text += `. Most went on ${topLabel}.`

  return text
}

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const [visible, setVisible] = useState(false)
  const [summaryText, setSummaryText] = useState<string | null>(null)
  const [spoken, setSpoken] = useState(false)

  const { data } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
  })

  useEffect(() => {
    if (!data?.transactions) return
    const currentWeek = getISOWeek(new Date())
    const lastSeen = localStorage.getItem('truffle_weekly_summary')
    if (lastSeen === currentWeek) return

    const text = buildSummary(data.transactions)
    if (!text) return

    setSummaryText(text)
    setVisible(true)
    localStorage.setItem('truffle_weekly_summary', currentWeek)
  }, [data])

  const handleSpeak = () => {
    if (!summaryText || spoken) return
    const utterance = new SpeechSynthesisUtterance(summaryText)
    utterance.rate = 0.95
    utterance.pitch = 1

    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Neural') || v.localService)
    )
    if (preferred) utterance.voice = preferred

    utterance.onend = () => setSpoken(false)
    window.speechSynthesis.speak(utterance)
    setSpoken(true)
  }

  if (!visible || !summaryText) return null

  return (
    <div className="card border border-truffle-amber/30 bg-truffle-amber/5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-truffle-amber uppercase tracking-wide mb-1">
            Weekly summary
          </p>
          <p className="text-sm text-truffle-text">{summaryText}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-truffle-muted hover:text-truffle-text transition-colors flex-shrink-0 text-xs mt-0.5"
        >
          ✕
        </button>
      </div>
      <button
        onClick={handleSpeak}
        disabled={spoken}
        className={`text-xs flex items-center gap-1.5 transition-colors ${spoken ? 'text-truffle-muted cursor-default' : 'text-truffle-amber hover:text-truffle-amber-light'}`}
      >
        <span>{spoken ? '🔊' : '▶'}</span>
        {spoken ? 'Playing…' : 'Read aloud'}
      </button>
    </div>
  )
}
