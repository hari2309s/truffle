import Image from 'next/image'

interface TopBarProps {
  subtitle?: string
  title?: string
  children?: React.ReactNode
}

export function TopBar({ subtitle = 'Ask me anything', title = 'Truffle', children }: TopBarProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-truffle-border">
      <div className="flex items-center gap-2">
        <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} priority />
        <div>
          <p className="font-semibold text-truffle-text text-sm">{title}</p>
          {subtitle && <p className="text-xs text-truffle-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  )
}
