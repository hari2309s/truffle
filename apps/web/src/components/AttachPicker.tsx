'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const OPTS = [
  { key: 'camera', label: 'CAMERA', icon: 'cam' },
  { key: 'photo', label: 'PHOTO', icon: 'pho' },
  { key: 'pdf', label: 'DOCUMENT', icon: 'doc' },
  { key: 'csv', label: 'SPREADSHEET', icon: 'csv' },
] as const

function CameraIcon() {
  return (
    <div className="w-6 h-[18px] border-2 border-current rounded box-border flex items-center justify-center">
      <div className="w-2 h-2 border-2 border-current rounded-full box-border" />
    </div>
  )
}

function PhotoIcon() {
  return (
    <div className="relative w-6 h-[18px] border-2 border-current rounded-sm box-border">
      <i className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-current" />
      <i
        className="absolute bottom-px left-0.5"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '7px solid currentColor',
        }}
      />
    </div>
  )
}

function DocIcon() {
  return (
    <div className="w-[18px] h-[22px] border-2 border-current rounded-sm box-border flex flex-col justify-center gap-[3px] px-[3px]">
      <i className="h-0.5 bg-current" />
      <i className="h-0.5 bg-current" />
      <i className="h-0.5 w-[60%] bg-current" />
    </div>
  )
}

function CsvIcon() {
  return (
    <div className="w-[22px] h-[18px] grid grid-cols-3 grid-rows-3 gap-0.5">
      <i className="bg-current" />
      <i className="bg-current" />
      <i className="bg-current" />
      <i className="border-[1.5px] border-current" />
      <i className="border-[1.5px] border-current" />
      <i className="border-[1.5px] border-current" />
      <i className="border-[1.5px] border-current" />
      <i className="border-[1.5px] border-current" />
      <i className="border-[1.5px] border-current" />
    </div>
  )
}

const ICONS: Record<string, () => React.JSX.Element> = {
  cam: CameraIcon,
  pho: PhotoIcon,
  doc: DocIcon,
  csv: CsvIcon,
}

interface AttachPickerProps {
  variant: 'sheet' | 'popover'
  slotsLeft: number
  onPick: (kind: 'camera' | 'photo' | 'pdf' | 'csv') => void
  onClose: () => void
}

function PickerGrid({
  slotsLeft,
  onPick,
}: {
  slotsLeft: number
  onPick: (kind: 'camera' | 'photo' | 'pdf' | 'csv') => void
}) {
  return (
    <>
      <div className="flex justify-between text-[11px] font-bold tracking-[.12em] text-truffle-text2">
        <span>ATTACH TO MESSAGE</span>
        <span>{slotsLeft} OF 3 LEFT</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OPTS.map((o) => {
          const Icon = ICONS[o.icon]!
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onPick(o.key)}
              className="key key-plain h-[72px] flex-col !gap-1"
            >
              <Icon />
              <span className="pt-1 text-xs font-bold tracking-[.08em]">{o.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

/** Mobile: bottom sheet with scrim. */
function SheetPicker({ slotsLeft, onPick, onClose }: Omit<AttachPickerProps, 'variant'>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return createPortal(
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-50 bg-black/60 animate-[ta-fade_200ms_ease-out_both]"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={ref}
        role="dialog"
        aria-label="Attach a file"
        className="fixed left-0 right-0 bottom-0 z-[51] bg-truffle-card border-t border-truffle-border rounded-t-2xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)] flex flex-col gap-3.5 animate-[ta-sheet_300ms_ease-out_both]"
      >
        <span className="self-center w-10 h-1 rounded-full bg-truffle-border" />
        <PickerGrid slotsLeft={slotsLeft} onPick={onPick} />
      </div>
    </>,
    document.body
  )
}

/** Tablet/Desktop: popover anchored to the + button. */
function PopoverPicker({
  slotsLeft,
  onPick,
  onClose,
}: Omit<AttachPickerProps, 'variant'>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <>
      {/* Click-away scrim (invisible) */}
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-label="Attach a file"
        className="absolute left-0 bottom-[calc(100%+10px)] z-[21] w-60 bg-truffle-card border border-truffle-border rounded-lg shadow-[var(--t-e1)] p-3 flex flex-col gap-2.5 origin-[28px_100%] animate-[ta-pop_200ms_ease-out_both]"
      >
        <PickerGrid slotsLeft={slotsLeft} onPick={onPick} />
        {/* Arrow */}
        <i className="absolute left-[22px] -bottom-[7px] w-3 h-3 bg-truffle-card border-r border-b border-truffle-border rotate-45" />
      </div>
    </>
  )
}

export function AttachPicker({ variant, slotsLeft, onPick, onClose }: AttachPickerProps) {
  if (variant === 'sheet') {
    return <SheetPicker slotsLeft={slotsLeft} onPick={onPick} onClose={onClose} />
  }
  return <PopoverPicker slotsLeft={slotsLeft} onPick={onPick} onClose={onClose} />
}
