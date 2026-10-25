'use client'

export function DropOverlay() {
  return (
    <div className="absolute inset-3 z-[8] bg-truffle-bg/80 rounded-2xl flex flex-col items-center justify-center gap-2.5 animate-[ta-fade_150ms_ease-out_both] pointer-events-none">
      <div className="absolute inset-0 border-2 border-dashed border-truffle-accent rounded-2xl animate-[ta-pulse_1.2s_ease-in-out_infinite]" />
      <div className="w-10 h-12 border-2 border-truffle-accent-ink rounded-sm box-border flex items-center justify-center text-[22px] font-bold text-truffle-accent-ink">
        ↓
      </div>
      <span className="font-grotesk text-xl font-medium text-truffle-accent-ink">
        Drop file here
      </span>
      <span className="text-[11px] font-bold tracking-[.12em] text-truffle-text2">
        PHOTO · PDF · CSV · MAX 10 MB · UP TO 3
      </span>
    </div>
  )
}
