import Image from 'next/image'

export const metadata = {
  title: 'Privacy Policy — Truffle',
  description: 'How Truffle handles your data.',
}

const LAST_UPDATED = 'May 2025'
const CONTACT_EMAIL = 'hello@truffle.finance'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-truffle-bg text-truffle-text">
      {/* Nav */}
      <header className="border-b border-truffle-border/60">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} />
            <span className="font-black text-lg tracking-tight">truffle</span>
          </a>
          <a
            href="/"
            className="text-sm text-truffle-text-secondary hover:text-truffle-text transition-colors"
          >
            ← Back
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-truffle-amber text-xs font-semibold uppercase tracking-widest mb-4">
          Legal
        </p>
        <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-truffle-muted text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose-truffle space-y-10 text-truffle-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">Who we are</h2>
            <p>
              Truffle is a personal finance assistant built and operated by Hariharan Selvaraj,
              based in Berlin, Germany. When you use Truffle, Hariharan Selvaraj is the data
              controller responsible for your personal data under the GDPR.
            </p>
            <p className="mt-3">
              Contact:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">What data we collect</h2>
            <ul className="space-y-2 list-none">
              {[
                [
                  'Your email address',
                  'Used to create and authenticate your account via magic link. We never store a password.',
                ],
                [
                  'Transactions you enter',
                  'The spending data you type, import via CSV, or extract from receipts. This is the core of the service.',
                ],
                [
                  'Voice recordings',
                  'Captured only when you use the voice input feature, sent to Groq (Whisper) for transcription, and not stored after processing.',
                ],
                [
                  'Receipt images and PDFs',
                  'Uploaded for parsing only. Extracted transaction data is saved; the original file is not retained.',
                ],
                [
                  'Usage analytics',
                  'Anonymised event data via PostHog to understand how features are used. No personally identifiable information is included.',
                ],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-truffle-text">{title}:</span> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">What we do NOT collect</h2>
            <ul className="space-y-2 list-none">
              {[
                'Bank credentials or account numbers — we have no bank linking feature.',
                'Payment card details — payments (when Pro launches) are handled entirely by Stripe.',
                'Data from third-party data brokers.',
                "Any data from people who haven't signed up.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-muted flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">How we use your data</h2>
            <p>Your data is used solely to provide the Truffle service to you:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'To answer your questions in the AI chat (your transaction history is passed as context to the AI model).',
                'To generate spending insights, forecasts, and anomaly detection.',
                'To send you proactive nudges about your savings goals and habits.',
                'To allow you to export your own data.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We do not sell your data, share it for advertising, or use it to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">Third-party services</h2>
            <p>We use the following sub-processors to operate the service:</p>
            <div className="mt-4 space-y-3">
              {[
                ['Supabase', 'Database and authentication (EU region).'],
                ['Google Gemini', 'AI model powering the chat and insights.'],
                ['Groq / Whisper', 'Voice transcription.'],
                ['PostHog', 'Anonymised product analytics.'],
                ['Vercel', 'Hosting and deployment (EU edge where available).'],
              ].map(([name, desc]) => (
                <div key={name} className="flex gap-3">
                  <span className="font-semibold text-truffle-text w-36 flex-shrink-0">{name}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">Your rights under GDPR</h2>
            <p>As a user based in the EU, you have the right to:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                ['Access', 'Request a copy of all data we hold about you.'],
                ['Rectification', 'Correct inaccurate data.'],
                ['Erasure', 'Delete your account and all associated data.'],
                ['Portability', 'Export your transaction data as CSV from within the app.'],
                ['Objection', 'Object to any processing based on legitimate interests.'],
              ].map(([right, desc]) => (
                <li key={right} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-truffle-text">{right}:</span> {desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">Data retention</h2>
            <p>
              Your data is retained for as long as your account is active. If you delete your
              account, all associated data is permanently deleted within 30 days. Anonymised
              analytics data (which cannot be linked back to you) may be retained for product
              improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">Changes to this policy</h2>
            <p>
              If we make material changes to this policy, we will notify you by email before the
              changes take effect. Continued use of Truffle after that date constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">Contact</h2>
            <p>
              Questions or complaints?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
              . You also have the right to lodge a complaint with the Berlin Commissioner for Data
              Protection and Freedom of Information (Berliner Beauftragte für Datenschutz und
              Informationsfreiheit).
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-truffle-border/40 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-truffle-muted">© {new Date().getFullYear()} Truffle.</p>
          <div className="flex gap-6 text-xs text-truffle-muted">
            <a href="/privacy" className="text-truffle-text-secondary">
              Privacy
            </a>
            <a href="/terms" className="hover:text-truffle-text-secondary transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
