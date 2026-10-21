'use client'

import { CURRENCY_SYMBOLS } from '@/lib/currency'
import type { Currency } from '@/contexts/CurrencyContext'

const CURRENCIES = Object.keys(CURRENCY_SYMBOLS) as Currency[]

interface CurrencyPickerProps {
  value: Currency
  onChange: (currency: Currency) => void
  label?: string
}

export function CurrencyPicker({ value, onChange, label }: CurrencyPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${CURRENCIES.length}, minmax(0, 1fr))` }}
    >
      {CURRENCIES.map((c) => {
        const selected = value === c
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(c)}
            className={`h-12 rounded-lg border border-truffle-border text-[13px] font-bold ${
              selected ? 'bg-truffle-text text-truffle-bg' : 'text-truffle-text'
            }`}
          >
            {CURRENCY_SYMBOLS[c]} {c}
          </button>
        )
      })}
    </div>
  )
}
