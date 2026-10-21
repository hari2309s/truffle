'use client'

import { useCallback, useState } from 'react'

/**
 * Shared state machine for the "select file -> preview -> parse/analyse ->
 * import -> success" flow used by CSVImport and ReceiptUpload.
 *
 * Only the terminal states that both flows need are modelled here
 * (idle / loading / error / imported). Anything specific to a single
 * component (the parsed preview rows, the selected receipt file, etc.)
 * stays local state in that component.
 */
export type ImportFlowStatus = 'idle' | 'loading' | 'error' | 'imported'

export interface UseImportFlowReturn {
  status: ImportFlowStatus
  isLoading: boolean
  error: string | null
  imported: boolean
  /** Set (or clear, with null) an error message. Moves status to 'error'. */
  setError: (message: string | null) => void
  /** Clear any error and mark the flow as busy. */
  startLoading: () => void
  /**
   * Stop loading. No-op if something else already moved the flow on
   * (e.g. markImported/setError ran before this fires in a `finally`).
   */
  stopLoading: () => void
  /** Clear any error and mark the flow as complete. */
  markImported: () => void
  /** Back to idle - clears error/imported. Used when the user picks a new file. */
  reset: () => void
}

export function useImportFlow(): UseImportFlowReturn {
  const [status, setStatus] = useState<ImportFlowStatus>('idle')
  const [error, setErrorMessage] = useState<string | null>(null)

  const setError = useCallback((message: string | null) => {
    setErrorMessage(message)
    setStatus(message ? 'error' : 'idle')
  }, [])

  const startLoading = useCallback(() => {
    setErrorMessage(null)
    setStatus('loading')
  }, [])

  const stopLoading = useCallback(() => {
    setStatus((prev) => (prev === 'loading' ? 'idle' : prev))
  }, [])

  const markImported = useCallback(() => {
    setErrorMessage(null)
    setStatus('imported')
  }, [])

  const reset = useCallback(() => {
    setErrorMessage(null)
    setStatus('idle')
  }, [])

  return {
    status,
    isLoading: status === 'loading',
    error,
    imported: status === 'imported',
    setError,
    startLoading,
    stopLoading,
    markImported,
    reset,
  }
}

interface ImportSuccessProps {
  message: string
  doneLabel: string
  onDone?: () => void
}

/** The "✓ imported" success slip shared by CSVImport and ReceiptUpload. */
export function ImportSuccess({ message, doneLabel, onDone }: ImportSuccessProps) {
  return (
    <div className="slip print-in mx-4 mt-3 px-[18px] pt-5 pb-8 flex flex-col gap-3 text-center">
      <span aria-hidden className="text-3xl font-bold">
        ✓
      </span>
      <p role="status" className="font-bold uppercase">
        {message}
      </p>
      <button type="button" onClick={onDone} className="key key-accent h-14 w-full uppercase">
        {doneLabel}
      </button>
    </div>
  )
}
