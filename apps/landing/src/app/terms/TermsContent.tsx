'use client'

import LegalNav from '@/components/LegalNav'
import { useLanguage } from '@/contexts/LanguageContext'

const LAST_UPDATED = 'May 2025'
const CONTACT_EMAIL = 'hello@truffle.finance'

export default function TermsContent() {
  const { t } = useLanguage()
  const s = t.legal.terms.sections

  return (
    <div className="min-h-screen bg-truffle-bg text-truffle-text">
      <LegalNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-truffle-amber text-xs font-semibold uppercase tracking-widest mb-4">
          Legal
        </p>
        <h1 className="text-4xl font-black tracking-tight mb-2">{t.legal.terms.pageTitle}</h1>
        <p className="text-truffle-muted text-sm mb-12">
          {t.legal.lastUpdatedPrefix} {LAST_UPDATED}
        </p>

        <div className="space-y-10 text-truffle-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.whoApplies.heading}</h2>
            <p>{s.whoApplies.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.whatTruffleIs.heading}</h2>
            <p>{s.whatTruffleIs.body}</p>
            <p className="mt-3 font-semibold text-truffle-text">
              {s.whatTruffleIs.notAdvisorLabel}
            </p>
            <p className="mt-2">{s.whatTruffleIs.notAdvisorBody}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.yourAccount.heading}</h2>
            <ul className="space-y-2 list-none">
              {s.yourAccount.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.plans.heading}</h2>
            <p>
              {s.plans.body.split('{pricingLink}')[0]}
              <a href="/#pricing" className="text-truffle-amber hover:underline">
                {s.plans.pricingLinkLabel}
              </a>
              {s.plans.body.split('{pricingLink}')[1]}
            </p>
            <p className="mt-3">{s.plans.body2}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.yourData.heading}</h2>
            <p>{s.yourData.body}</p>
            <p className="mt-3">
              {s.yourData.body2.split('{privacyLink}')[0]}
              <a href="/privacy" className="text-truffle-amber hover:underline">
                {s.yourData.privacyLinkLabel}
              </a>
              {s.yourData.body2.split('{privacyLink}')[1]}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.acceptableUse.heading}</h2>
            <p>{s.acceptableUse.intro}</p>
            <ul className="mt-3 space-y-2 list-none">
              {s.acceptableUse.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-muted flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.availability.heading}</h2>
            <p>{s.availability.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.liability.heading}</h2>
            <p>{s.liability.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.termination.heading}</h2>
            <p>{s.termination.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.governingLaw.heading}</h2>
            <p>{s.governingLaw.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.contact.heading}</h2>
            <p>
              {s.contact.body.split('{email}')[0]}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
              {s.contact.body.split('{email}')[1]}
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-truffle-border/40 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-truffle-muted">© {new Date().getFullYear()} Truffle.</p>
          <div className="flex gap-6 text-xs text-truffle-muted">
            <a href="/privacy" className="hover:text-truffle-text-secondary transition-colors">
              {t.legal.footerPrivacy}
            </a>
            <a href="/terms" className="text-truffle-text-secondary">
              {t.legal.footerTerms}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
