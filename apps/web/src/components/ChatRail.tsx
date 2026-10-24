'use client'

import { ChatEmbed } from './ChatEmbed'

/**
 * Desktop chat rail — 380px fixed right column, always visible on xl+.
 * Renders the compact chat embed with voice input and recent messages.
 */
export function ChatRail({ userId }: { userId: string }) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-[380px] border-l border-dashed border-truffle-border bg-truffle-bg flex flex-col z-[6]">
      <div className="flex-1 min-h-0 flex flex-col px-5 py-4">
        <ChatEmbed userId={userId} controlSize={36} />
      </div>
    </div>
  )
}
