'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { CURRENCY_SYMBOLS, CURRENCY_DECIMALS } from '@/lib/currency'
import { supabase } from '@/lib/supabase'

export type Currency = 'EUR' | 'GBP' | 'USD' | 'JPY'

const STORAGE_KEY = 'truffle-currency'

interface CurrencyContextValue {
  currency: Currency
  symbol: string
  setCurrency: (c: Currency) => void
  formatAmount: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'EUR',
  symbol: '€',
  setCurrency: () => {},
  formatAmount: (n) => `€${Math.abs(n).toFixed(2)}`,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EUR')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null
    if (stored && stored in CURRENCY_SYMBOLS) {
      setCurrencyState(stored)
    }
    supabase.auth.getSession().then(({ data }) => {
      const c = data.session?.user?.user_metadata?.currency as Currency | undefined
      if (c && c in CURRENCY_SYMBOLS) {
        setCurrencyState(c)
        localStorage.setItem(STORAGE_KEY, c)
      }
    })
  }, [])

  const setCurrency = (next: Currency) => {
    setCurrencyState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const symbol = CURRENCY_SYMBOLS[currency] ?? '€'
  const decimals = CURRENCY_DECIMALS[currency] ?? 2
  const formatAmount = (amount: number) => `${symbol}${Math.abs(amount).toFixed(decimals)}`

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
