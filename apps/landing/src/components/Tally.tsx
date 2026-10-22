export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

/** The padded truffle mark — same asset the app uses. */
export const TRUFFLE_ICON = '/icons/truffle-mark.png'

/** "Label ........ value" — the receipt line everything sits on. */
export function Line({
  label,
  value,
  className = '',
  valueClassName = '',
  centered = false,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
  valueClassName?: string
  /** Dots centred on the row (for rows taller than one line of text). */
  centered?: boolean
}) {
  return (
    <div className={`flex gap-2 ${centered ? 'items-center' : ''} ${className}`}>
      <span className="min-w-0">{label}</span>
      <span
        aria-hidden
        className={`leader ${centered ? '!mb-0 mt-1.5 self-center' : ''}`}
      />
      <span className={`whitespace-nowrap ${valueClassName}`}>{value}</span>
    </div>
  )
}

/** Uppercase mono eyebrow above section headings. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold tracking-[.14em] uppercase text-truffle-accent-ink">
      {children}
    </span>
  )
}
