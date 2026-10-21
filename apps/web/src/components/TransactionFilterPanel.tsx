'use client'

import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TransactionCategory } from '@truffle/types'
import {
  type TransactionFilters,
  type TypeFilter,
  type DatePreset,
} from '@/hooks/useTransactionFilters'
import { useLanguage } from '@/contexts/LanguageContext'

const DATE_PRESET_KEYS: DatePreset[] = ['all', 'week', 'month', 'last_month', '3months']

type PanelFilters = Pick<
  TransactionFilters,
  | 'search'
  | 'setSearch'
  | 'typeFilter'
  | 'setTypeFilter'
  | 'datePreset'
  | 'setDatePreset'
  | 'activeCategories'
  | 'toggleCategory'
  | 'availableCategories'
  | 'filtersOpen'
  | 'setFiltersOpen'
  | 'activeFilterCount'
>

interface Props {
  filters: PanelFilters
}

export function TransactionFilterPanel({ filters }: Props) {
  const {
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    datePreset,
    setDatePreset,
    activeCategories,
    toggleCategory,
    availableCategories,
    filtersOpen,
    setFiltersOpen,
    activeFilterCount,
  } = filters
  const { t } = useLanguage()
  const panelId = useId()
  const filtersActive = filtersOpen || activeFilterCount > 0

  return (
    <div className="flex flex-col gap-2 pb-1">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2 text-sm pointer-events-none"
          >
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.filter.searchPlaceholder}
            aria-label={t.filter.searchPlaceholder}
            className="field h-11 pl-8"
          />
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls={panelId}
          className={`key key-3 h-11 px-3 text-xs uppercase ${filtersActive ? 'key-ink' : 'key-plain'}`}
        >
          {t.filter.filters}
          {activeFilterCount > 0 && (
            <span className="min-w-5 h-5 px-1 grid place-items-center bg-truffle-accent text-truffle-on-accent text-[11px]">
              {activeFilterCount}
            </span>
          )}
          <span aria-hidden>{filtersOpen ? '▴' : '▾'}</span>
        </button>
      </div>

      <div id={panelId}>
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              key="filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['all', 'expenses', 'income'] as TypeFilter[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      aria-pressed={typeFilter === type}
                      className="chip justify-center uppercase"
                    >
                      {type === 'all'
                        ? t.filter.all
                        : type === 'expenses'
                          ? t.filter.expenses
                          : t.filter.income}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {DATE_PRESET_KEYS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDatePreset(value)}
                      aria-pressed={datePreset === value}
                      className="chip flex-shrink-0 uppercase"
                    >
                      {t.filter.datePresets[value] ?? value}
                    </button>
                  ))}
                </div>

                {availableCategories.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                    {availableCategories.map((cat: TransactionCategory) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        aria-pressed={activeCategories.has(cat)}
                        className="chip flex-shrink-0 uppercase"
                      >
                        {t.categories[cat] ?? cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
