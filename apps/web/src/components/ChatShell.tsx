import { BottomNav } from './BottomNav'
import { LoadingDots } from './PageMotion'

/** Chat chrome while auth + history load, or around a route-level error. */
export function ChatShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="h-dvh w-full bg-truffle-bg flex flex-col max-w-lg mx-auto overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))]">
        {children ?? <LoadingDots />}
      </main>
      <BottomNav active="chat" />
    </div>
  )
}
