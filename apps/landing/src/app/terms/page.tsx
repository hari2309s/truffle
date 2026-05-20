import Image from 'next/image'

export const metadata = {
  title: 'Terms of Service — Truffle',
  description: 'The terms that govern your use of Truffle.',
}

const LAST_UPDATED = 'May 2025'
const CONTACT_EMAIL = 'hello@truffle.finance'

export default function TermsPage() {
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
        <h1 className="text-4xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-truffle-muted text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-truffle-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">
              1. Who these terms apply to
            </h2>
            <p>
              These Terms of Service ("Terms") govern your use of Truffle, a personal finance
              assistant operated by Hariharan Selvaraj, Berlin, Germany ("we", "us", "Truffle"). By
              creating an account you agree to these Terms. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">2. What Truffle is</h2>
            <p>
              Truffle is a personal finance tracking and AI chat tool. It helps you log spending,
              set savings goals, and ask questions about your own financial data.
            </p>
            <p className="mt-3 font-semibold text-truffle-text">
              Truffle is not a financial advisor.
            </p>
            <p className="mt-2">
              Nothing in Truffle constitutes financial, investment, tax, or legal advice. All
              insights, forecasts, and suggestions are based solely on the data you enter and are
              provided for informational purposes only. Make financial decisions based on your own
              judgement and, where appropriate, professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">3. Your account</h2>
            <ul className="space-y-2 list-none">
              {[
                'You must be at least 18 years old to use Truffle.',
                'You are responsible for keeping your magic link emails private and your account secure.',
                'You are responsible for all activity that occurs under your account.',
                'One account per person. Do not create accounts on behalf of others without their knowledge.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">4. Free and Pro plans</h2>
            <p>
              Truffle is free to use with certain limits (see the{' '}
              <a href="/#pricing" className="text-truffle-amber hover:underline">
                pricing page
              </a>{' '}
              for current details). A Pro plan is in development and will be offered at €9/month
              when launched.
            </p>
            <p className="mt-3">
              We reserve the right to change plan limits and pricing. We will give you at least 30
              days' notice before any price increase takes effect for existing paid subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">5. Your data</h2>
            <p>
              You own the data you enter into Truffle. We do not claim any rights over your
              transaction records, goals, or other personal data. You can export or delete your data
              at any time.
            </p>
            <p className="mt-3">
              See our{' '}
              <a href="/privacy" className="text-truffle-amber hover:underline">
                Privacy Policy
              </a>{' '}
              for full details on how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">6. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                'Use Truffle for any unlawful purpose.',
                "Attempt to access other users' data.",
                'Reverse-engineer, scrape, or abuse the API.',
                'Use the service to process data on behalf of others without their consent.',
                'Misrepresent your identity or impersonate others.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-muted flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">7. Availability</h2>
            <p>
              We aim to keep Truffle available but do not guarantee uptime. The service is provided
              "as is". We may change, suspend, or discontinue features at any time, though we will
              try to give reasonable notice for significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Truffle is not liable for any indirect,
              incidental, or consequential damages arising from your use of the service — including
              financial losses resulting from decisions you make based on Truffle's output.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">9. Termination</h2>
            <p>
              You can delete your account at any time from Settings. We may suspend or terminate
              accounts that violate these Terms. Upon termination, your data will be deleted in
              accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">10. Governing law</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Germany. Any disputes
              shall be subject to the exclusive jurisdiction of the courts of Berlin, Germany,
              unless mandatory consumer protection laws in your country of residence provide
              otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">11. Contact</h2>
            <p>
              Questions about these Terms?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-truffle-border/40 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-truffle-muted">© {new Date().getFullYear()} Truffle.</p>
          <div className="flex gap-6 text-xs text-truffle-muted">
            <a href="/privacy" className="hover:text-truffle-text-secondary transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-truffle-text-secondary">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
