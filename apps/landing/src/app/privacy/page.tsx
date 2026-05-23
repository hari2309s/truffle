import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy — Truffle',
  description: 'How Truffle handles your data.',
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
