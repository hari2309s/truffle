'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { signOut } from '@/lib/auth'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency, type Currency } from '@/contexts/CurrencyContext'
import { useVoicePreference } from '@/contexts/VoiceContext'
import { type Locale } from '@/lib/i18n'
import { type VoiceId } from '@/lib/voices'
import { LanguagePicker } from './LanguagePicker'
import { VoicePicker } from './VoicePicker'
import { CurrencyPicker } from './CurrencyPicker'
import { LeaderRow, Rule } from './Tally'
import { exportToCSV } from '@/lib/exportCsv'
import { fetchAllTransactions } from '@/hooks/useTransactionsQuery'
import { supabase } from '@/lib/supabase'

interface SettingsSheetProps {
  userId: string
  onClose: () => void
}

export function SettingsSheet({ userId, onClose }: SettingsSheetProps) {
  const { t, setLocale } = useLanguage()
  const { currency, setCurrency } = useCurrency()
  const { voiceId, setVoiceId } = useVoicePreference()
  const [isExporting, setIsExporting] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Move focus into the sheet on open, and let Escape close it.
  useEffect(() => {
    closeButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !sheetRef.current) return
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const [txRes, goalsRes, budgetsRes, habitsRes] = await Promise.all([
        fetch('/api/transactions?all=1'),
        fetch('/api/goals'),
        fetch('/api/budgets'),
        fetch('/api/habits'),
      ])
      const [txData, goalsData, budgetsData, habitsData] = await Promise.all([
        txRes.json(),
        goalsRes.json(),
        budgetsRes.json(),
        habitsRes.json(),
      ])
      const exportData = {
        exportedAt: new Date().toISOString(),
        transactions: txData.transactions ?? [],
        goals: goalsData.goals ?? [],
        budgets: budgetsData.budgets ?? [],
        habits: habitsData.habits ?? [],
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `truffle-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      exportToCSV(await fetchAllTransactions())
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteInput !== t.settings.deleteConfirmWord) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('server error')
      await signOut()
    } catch {
      setDeleteError(t.settings.deleteError)
      setIsDeleting(false)
    }
  }

  const handleLocaleChange = async (next: Locale) => {
    setLocale(next)
    await supabase.auth.updateUser({ data: { language: next } })
  }

  const handleCurrencyChange = async (next: Currency) => {
    setCurrency(next)
    await supabase.auth.updateUser({ data: { currency: next } })
  }

  const handleVoiceChange = async (next: VoiceId) => {
    setVoiceId(next)
    await supabase.auth.updateUser({ data: { voice: next } })
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <motion.div
        className="absolute inset-0 hidden md:block"
        style={{ background: 'var(--t-scrim)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <div className="h-full md:h-auto md:flex md:flex-col md:items-center md:pt-[120px] xl:pt-8 pointer-events-none">
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-sheet-title"
          className="pointer-events-auto absolute left-3 right-3 bottom-0 top-24 md:static md:w-[480px] md:max-w-[calc(100%-48px)] md:max-h-[calc(100dvh-168px)] xl:max-h-[calc(100dvh-80px)] bg-truffle-card flex flex-col gap-4 px-[18px] pt-5 pb-[max(28px,env(safe-area-inset-bottom))] md:pb-5 text-sm overflow-y-auto slip md:slip"
          style={{ overscrollBehavior: 'contain' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex justify-between items-center">
          <h2 id="settings-sheet-title" className="text-base font-bold tracking-[.12em] uppercase">
            {t.settings.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="w-11 h-11 rounded-lg border border-truffle-border grid place-items-center font-bold"
          >
            ✕
          </button>
        </div>

        <Rule />

        <h3 className="text-xs text-truffle-text2 uppercase">{t.settings.currency}</h3>
        <CurrencyPicker
          value={currency}
          onChange={handleCurrencyChange}
          label={t.settings.currency}
        />
        <LanguagePicker onChange={handleLocaleChange} label={t.settings.language} />

        <Rule />

        <h3 className="text-xs text-truffle-text2 uppercase">{t.settings.voice}</h3>
        <VoicePicker value={voiceId} onChange={handleVoiceChange} />

        <Rule />

        <button
          type="button"
          onClick={() => setShowExport((v) => !v)}
          aria-expanded={showExport}
          aria-describedby="export-desc"
          className="min-h-11 flex items-center text-left"
        >
          <LeaderRow
            className="flex-1"
            left={t.settings.exportData}
            right={isExporting ? t.settings.preparing : t.settings.exportFormat}
          />
        </button>
        {showExport && (
          <div className="grid grid-cols-2 gap-2 print-in">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="key key-plain key-3 h-11 text-xs uppercase"
            >
              {t.settings.exportCsv}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="key key-plain key-3 h-11 text-xs uppercase"
            >
              {t.settings.exportJson}
            </button>
          </div>
        )}
        <p id="export-desc" className="sr-only">
          {t.settings.downloadDataDesc}
        </p>

        <button
          type="button"
          onClick={signOut}
          className="min-h-11 flex items-center text-left"
        >
          <LeaderRow className="flex-1" left={t.topBar.signOut} right="→" />
        </button>

        <button
          type="button"
          onClick={() => setShowDelete((v) => !v)}
          aria-expanded={showDelete}
          className="min-h-11 flex items-center justify-between text-left text-truffle-negative font-bold"
        >
          <span>✕ {t.settings.deleteAccount}</span>
          <span aria-hidden>{showDelete ? '↓' : '→'}</span>
        </button>

        {showDelete && (
          <div className="flex flex-col gap-2 border-t-[6px] border-truffle-negative bg-truffle-surface p-3.5 print-in">
            <p className="font-grotesk text-sm leading-[1.45]">{t.settings.deleteAccountDesc}</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={t.settings.deletePlaceholder}
              aria-label={t.settings.deletePlaceholder}
              autoCapitalize="characters"
              className="field h-11"
            />
            {deleteError && (
              <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
                ■ {deleteError}
              </p>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteInput !== t.settings.deleteConfirmWord || isDeleting}
              className="key key-danger h-11 text-xs uppercase"
            >
              {isDeleting ? t.settings.deleting : `✕ ${t.settings.deleteMyAccount}`}
            </button>
          </div>
        )}
      </motion.div>

        {/* ESC hint — md+ only */}
        <span
          className="hidden md:block pointer-events-none mt-3 text-center text-[10px] font-bold tracking-[.1em]"
          style={{ color: 'var(--t-esc-hint)' }}
        >
          {t.common.escHint}
        </span>
      </div>
    </div>
  )
}
