'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FinancialBrief } from './FinancialBrief'
import { TransactionList } from './TransactionList'
import { AddTransactionForm } from './AddTransactionForm'
import { ThemeToggle } from './ThemeToggle'
import { CSVImport } from './CSVImport'
import { ReceiptUpload } from './ReceiptUpload'
import { WeeklySummary } from './WeeklySummary'
import { BottomNav } from './BottomNav'
import { supabase } from '@/lib/supabase'

interface DashboardProps {
  userId: string
  name: string
}

function greeting(name: string) {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name}`
}

export function Dashboard({ userId, name }: DashboardProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-truffle-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/icons/truffle.png" alt="Truffle" width={28} height={28} priority />
          <div>
            <span className="font-semibold text-truffle-text">Truffle</span>
            {name && (
              <p className="text-xs text-truffle-muted leading-none mt-0.5">{greeting(name)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={handleSignOut} className="btn-ghost text-xs">
            Sign out
          </button>
        </div>
      </header>

      {/* Content — single scroll container so items flow behind the translucent nav */}
      <main className="flex-1 overflow-y-auto min-h-0">
        {/* Sticky top section — stays visible as transactions scroll underneath */}
        <div className="sticky top-0 z-10 bg-truffle-bg px-4 pt-6 pb-4 space-y-4">
          <WeeklySummary userId={userId} />
          <FinancialBrief userId={userId} />

          {showAddForm && (
            <AddTransactionForm userId={userId} onClose={() => setShowAddForm(false)} />
          )}

          {showCSVImport && <CSVImport userId={userId} onClose={() => setShowCSVImport(false)} />}

          {showReceiptUpload && (
            <ReceiptUpload userId={userId} onClose={() => setShowReceiptUpload(false)} />
          )}
        </div>

        {/* Transactions — scroll naturally, last item clears the nav bar */}
        <div className="px-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-truffle-text">Recent</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowReceiptUpload((v) => !v)
                  setShowCSVImport(false)
                  setShowAddForm(false)
                }}
                className="text-sm text-truffle-muted hover:text-truffle-text transition-colors"
              >
                {showReceiptUpload ? 'Cancel' : 'Scan'}
              </button>
              <button
                onClick={() => {
                  setShowCSVImport((v) => !v)
                  setShowReceiptUpload(false)
                  setShowAddForm(false)
                }}
                className="text-sm text-truffle-muted hover:text-truffle-text transition-colors"
              >
                {showCSVImport ? 'Cancel' : 'CSV'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm((v) => !v)
                  setShowCSVImport(false)
                  setShowReceiptUpload(false)
                }}
                className="text-sm text-truffle-amber hover:text-truffle-amber-light transition-colors"
              >
                {showAddForm ? 'Cancel' : '+ Add'}
              </button>
            </div>
          </div>
          <TransactionList userId={userId} />
        </div>
      </main>

      <BottomNav active="home" />
    </div>
  )
}
