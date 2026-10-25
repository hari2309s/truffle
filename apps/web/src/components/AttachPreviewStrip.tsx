'use client'

import type { ChatAttachment } from '@/hooks/useAttachments'

interface AttachPreviewStripProps {
  attachments: ChatAttachment[]
  error: string | null
  onRemove: (id: string) => void
}

function FileTypeIcon({ kind }: { kind: ChatAttachment['kind'] }) {
  const label = kind.toUpperCase()
  return (
    <div className="flex-none w-4 h-5 border-[1.5px] border-truffle-text2 rounded-sm box-border flex items-center justify-center text-[5px] font-bold text-truffle-text2">
      {label}
    </div>
  )
}

function DismissButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute -top-1.5 -right-1.5 w-5 h-5 p-0 border-0 rounded-full bg-truffle-text text-truffle-bg text-[11px] font-bold leading-none flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
    >
      ×
    </button>
  )
}

export function AttachPreviewStrip({ attachments, error, onRemove }: AttachPreviewStripProps) {
  if (attachments.length === 0 && !error) return null

  return (
    <div className="flex gap-2.5 px-1 py-2 overflow-x-auto scrollbar-none print-in">
      {attachments.map((att) => (
        <div key={att.id} className="relative flex-shrink-0 inline-flex print-in">
          {att.kind === 'photo' ? (
            <div className="w-16 h-16 rounded-lg border border-truffle-border box-border overflow-hidden bg-truffle-surface flex items-end p-1">
              {att.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-[8px] font-bold tracking-[.06em] text-truffle-text2">
                  JPG
                </span>
              )}
            </div>
          ) : (
            <div className="h-16 px-3 rounded-lg border border-truffle-border bg-truffle-surface box-border flex items-center gap-2">
              <FileTypeIcon kind={att.kind} />
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="max-w-[120px] font-grotesk text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {att.name}
                </span>
                <span className="text-[11px] text-truffle-text2">{att.size}</span>
              </div>
            </div>
          )}
          <DismissButton onClick={() => onRemove(att.id)} label={`Remove ${att.name}`} />
        </div>
      ))}
      {error && (
        <div className="h-16 flex items-center gap-1.5 px-1 text-[11px] font-bold tracking-[.04em] text-truffle-negative print-in">
          ■ {error}
        </div>
      )}
    </div>
  )
}
