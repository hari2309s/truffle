'use client'

import LegalNav from '@/components/LegalNav'
import { useLanguage } from '@/contexts/LanguageContext'

const LAST_UPDATED = 'May 2025'
const CONTACT_EMAIL = 'hello@truffle.finance'

export default function PrivacyContent() {
  const { t } = useLanguage()
  const s = t.legal.privacy.sections

  return (
    <div className="min-h-screen bg-truffle-bg text-truffle-text">
      <LegalNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-truffle-amber text-xs font-semibold uppercase tracking-widest mb-4">
          Legal
        </p>
        <h1 className="text-4xl font-black tracking-tight mb-2">{t.legal.privacy.pageTitle}</h1>
        <p className="text-truffle-muted text-sm mb-12">
          {t.legal.lastUpdatedPrefix} {LAST_UPDATED}
        </p>

        <div className="prose-truffle space-y-10 text-truffle-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.whoWeAre.heading}</h2>
            <p>{s.whoWeAre.body}</p>
            <p className="mt-3">
              {s.whoWeAre.contactPrefix}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.whatWeCollect.heading}</h2>
            <ul className="space-y-2 list-none">
              {s.whatWeCollect.items.map(({ title, desc }) => (
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
            <h2 className="text-xl font-bold text-truffle-text mb-3">
              {s.whatWeDoNotCollect.heading}
            </h2>
            <ul className="space-y-2 list-none">
              {s.whatWeDoNotCollect.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-muted flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.howWeUse.heading}</h2>
            <p>{s.howWeUse.intro}</p>
            <ul className="mt-3 space-y-2 list-none">
              {s.howWeUse.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">{s.howWeUse.outro}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.thirdParty.heading}</h2>
            <p>{s.thirdParty.intro}</p>
            <div className="mt-4 space-y-3">
              {s.thirdParty.items.map(({ name, desc }) => (
                <div key={name} className="flex gap-3">
                  <span className="font-semibold text-truffle-text w-36 flex-shrink-0">{name}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.gdprRights.heading}</h2>
            <p>{s.gdprRights.intro}</p>
            <ul className="mt-3 space-y-2 list-none">
              {s.gdprRights.items.map(({ right, desc }) => (
                <li key={right} className="flex gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-truffle-amber flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-truffle-text">{right}:</span> {desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {s.gdprRights.outro.split('{email}')[0]}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-truffle-amber hover:underline">
                {CONTACT_EMAIL}
              </a>
              {s.gdprRights.outro.split('{email}')[1]}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.retention.heading}</h2>
            <p>{s.retention.body}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-truffle-text mb-3">{s.changes.heading}</h2>
            <p>{s.changes.body}</p>
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
            <a href="/privacy" className="text-truffle-text-secondary">
              {t.legal.footerPrivacy}
            </a>
            <a href="/terms" className="hover:text-truffle-text-secondary transition-colors">
              {t.legal.footerTerms}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
