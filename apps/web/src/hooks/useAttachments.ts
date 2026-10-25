'use client'

import { useCallback, useRef, useState } from 'react'

export interface ChatAttachment {
  id: string
  kind: 'photo' | 'pdf' | 'csv'
  file: File
  name: string
  size: string
  /** Object URL for photo preview — revoked on remove. */
  previewUrl?: string
}

const MAX_ATTACHMENTS = 3
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function formatSize(bytes: number): string {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function detectKind(file: File): ChatAttachment['kind'] | null {
  if (/^image\//i.test(file.type)) return 'photo'
  if (/pdf/i.test(file.type)) return 'pdf'
  if (/csv/i.test(file.type) || /\.csv$/i.test(file.name)) return 'csv'
  return null
}

let nextId = 0

export function useAttachments() {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const errorTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flashToast = useCallback(() => {
    setToast(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2000)
  }, [])

  const flashError = useCallback((msg: string) => {
    setError(msg)
    clearTimeout(errorTimer.current)
    errorTimer.current = setTimeout(() => setError(null), 3000)
  }, [])

  const add = useCallback(
    (file: File): boolean => {
      if (file.size > MAX_FILE_SIZE) {
        flashError('File too large (max 10 MB)')
        return false
      }
      const kind = detectKind(file)
      if (!kind) {
        flashError('Unsupported file type')
        return false
      }
      setAttachments((prev) => {
        if (prev.length >= MAX_ATTACHMENTS) {
          flashToast()
          return prev
        }
        const previewUrl = kind === 'photo' ? URL.createObjectURL(file) : undefined
        return [
          ...prev,
          {
            id: `att-${++nextId}`,
            kind,
            file,
            name: file.name,
            size: formatSize(file.size),
            previewUrl,
          },
        ]
      })
      return true
    },
    [flashError, flashToast]
  )

  const remove = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id)
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const clear = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
      return []
    })
  }, [])

  const isFull = attachments.length >= MAX_ATTACHMENTS
  const slotsLeft = MAX_ATTACHMENTS - attachments.length

  return {
    attachments,
    add,
    remove,
    clear,
    isFull,
    slotsLeft,
    error,
    toast,
    flashToast,
  }
}
