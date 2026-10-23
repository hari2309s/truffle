import { AppShell } from './AppShell'
import { LoadingDots } from './PageMotion'

/** Chat chrome while auth + history load, or around a route-level error. */
export function ChatShell({ children }: { children?: React.ReactNode }) {
  return (
    <AppShell active="chat">
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        {children ?? <LoadingDots />}
      </main>
    </AppShell>
  )
}
