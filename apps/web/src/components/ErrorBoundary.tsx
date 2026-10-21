'use client'

import React from 'react'
import { NoticeSlip } from './Tally'

interface Props {
  children: React.ReactNode
  /** Custom fallback. Omit to use the default "Something went wrong" card. */
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <NoticeSlip
          tone="negative"
          title="Couldn’t load this section"
          className="mx-4 mt-4"
          actions={
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="key key-line key-3 h-11 text-xs uppercase"
            >
              Try again
            </button>
          }
        />
      )
    }
    return this.props.children
  }
}
