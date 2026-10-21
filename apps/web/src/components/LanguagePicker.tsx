'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'
import { LeaderRow } from './Tally'

interface LanguagePickerProps {
  onChange: (locale: Locale) => void
  label: string
}

export function LanguagePicker({ onChange, label }: LanguagePickerProps) {
  const { locale } = useLanguage()
  const locales = Object.entries(LOCALE_LABELS) as [Locale, { flag: string; label: string }][]

  // One language today: a plain receipt line rather than a one-option control.
  if (locales.length === 1) {
    const [, { flag, label: name }] = locales[0]!
    return (
      <div className="min-h-11 flex items-center">
        <LeaderRow
          className="flex-1"
          left={label}
          right={
            <span>
              {flag} {name}
            </span>
          }
        />
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {locales.map(([loc, { flag, label: name }]) => (
        <button
          key={loc}
          type="button"
          role="radio"
          aria-checked={locale === loc}
          onClick={() => onChange(loc)}
          className={`flex-1 h-12 rounded-lg border border-truffle-border text-[13px] font-bold ${
            locale === loc ? 'bg-truffle-text text-truffle-bg' : ''
          }`}
        >
          {flag} {name}
        </button>
      ))}
    </div>
  )
}
