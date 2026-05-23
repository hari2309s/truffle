import type { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service — Truffle',
  description: 'The terms that govern your use of Truffle.',
}

export default function TermsPage() {
  return <TermsContent />
}
