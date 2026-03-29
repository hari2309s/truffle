'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FinancialBrief } from './FinancialBrief'
import { TransactionList } from './TransactionList'
import { AddTransactionForm } from './AddTransactionForm'
import { ThemeToggle } from './ThemeToggle'
import { CSVImport } from './CSVImport'
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
          <FinancialBrief userId={userId} />

          {showAddForm && (
            <AddTransactionForm userId={userId} onClose={() => setShowAddForm(false)} />
          )}

          {showCSVImport && <CSVImport userId={userId} onClose={() => setShowCSVImport(false)} />}
        </div>

        {/* Transactions — scroll naturally, last item clears the nav bar */}
        <div className="px-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-truffle-text">Recent</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowCSVImport((v) => !v)
                  setShowAddForm(false)
                }}
                className="text-sm text-truffle-muted hover:text-truffle-text transition-colors"
              >
                {showCSVImport ? 'Cancel' : 'Import CSV'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm((v) => !v)
                  setShowCSVImport(false)
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

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t border-truffle-border bg-truffle-bg/95 backdrop-blur-sm">
        <div className="flex">
          <Link
            href="/"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-amber"
          >
            <HomeIcon />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link
            href="/chat"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
          >
            <ChatIcon />
            <span className="text-[10px]">Chat</span>
          </Link>
          <Link
            href="/insights"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
          >
            <InsightsIcon />
            <span className="text-[10px]">Insights</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223 15.522 15.522 0 003-.152z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InsightsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  )
}
