'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface PhotoLightboxProps {
  src: string
  alt?: string
  onClose: () => void
}

export function PhotoLightbox({ src, alt, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-label="Photo, tap to close"
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center gap-3.5 p-6 cursor-zoom-out animate-[ta-fade_200ms_ease-out_both]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? 'Attached photo'}
        className="max-w-full xl:max-w-[420px] md:max-w-[480px] max-h-[80vh] rounded-md object-contain animate-[ta-zoom_300ms_cubic-bezier(.32,.72,0,1)_both]"
      />
      <span className="text-[11px] font-bold tracking-[.12em] text-[#efe9de]">
        TAP TO CLOSE
      </span>
    </div>,
    document.body
  )
}
