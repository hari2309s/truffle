'use client'

import LegalPage, { type LegalSection } from '@/components/LegalPage'
import { LegalItem, LegalList, MailLink, readMinutes } from '@/components/LegalParts'
import { useLanguage } from '@/contexts/LanguageContext'

/** Month of the last change; shown in the reader's language. */
const LAST_UPDATED = new Date(2025, 4, 1)
const CONTACT_EMAIL = 'hello@truffle.finance'

/** Drops the "1. " numbering — the section code and index carry it now. */
const unnumbered = (heading: string) => heading.replace(/^\d+\.\s*/, '')

/** Splits "text {token} text" around a link. */
function withLink(text: string, token: string, link: React.ReactNode) {
  const [before, after] = text.split(token)
  return (
    <>
      {before}
      {link}
      {after}
    </>
  )
}

const linkClass = 'text-truffle-accent-ink underline underline-offset-2'

export default function TermsContent() {
  const { t, locale } = useLanguage()
  const updated = LAST_UPDATED.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' })
  const p = t.legal.terms
  const s = p.sections

  const sections: LegalSection[] = [
    { code: 'Who', heading: unnumbered(s.whoApplies.heading), body: <p className="m-0">{s.whoApplies.body}</p> },
    {
      code: 'What',
      heading: unnumbered(s.whatTruffleIs.heading),
      body: (
        <>
          <p className="m-0">{s.whatTruffleIs.body}</p>
          <div className="bg-truffle-surface border-t-[6px] border-truffle-warning p-4 flex flex-col gap-1.5">
            <b className="font-mono text-[13px] uppercase tracking-[.04em] text-truffle-warning">
              ▲ {s.whatTruffleIs.notAdvisorLabel}
            </b>
            <span className="text-base">{s.whatTruffleIs.notAdvisorBody}</span>
          </div>
        </>
      ),
    },
    {
      code: 'Acct',
      heading: unnumbered(s.yourAccount.heading),
      body: (
        <LegalList>
          {s.yourAccount.items.map((item) => (
            <LegalItem key={item}>{item}</LegalItem>
          ))}
        </LegalList>
      ),
    },
    {
      code: 'Plan',
      heading: unnumbered(s.plans.heading),
      body: (
        <>
          <p className="m-0">
            {withLink(
              s.plans.body,
              '{pricingLink}',
              <a href="/#pricing" className={linkClass}>
                {s.plans.pricingLinkLabel}
              </a>
            )}
          </p>
          <p className="m-0">{s.plans.body2}</p>
        </>
      ),
    },
    {
      code: 'Data',
      heading: unnumbered(s.yourData.heading),
      body: (
        <>
          <p className="m-0">{s.yourData.body}</p>
          <p className="m-0">
            {withLink(
              s.yourData.body2,
              '{privacyLink}',
              <a href="/privacy" className={linkClass}>
                {s.yourData.privacyLinkLabel}
              </a>
            )}
          </p>
        </>
      ),
    },
    {
      code: 'Use',
      heading: unnumbered(s.acceptableUse.heading),
      body: (
        <>
          <p className="m-0">{s.acceptableUse.intro}</p>
          <LegalList>
            {s.acceptableUse.items.map((item) => (
              <LegalItem key={item}>{item}</LegalItem>
            ))}
          </LegalList>
        </>
      ),
    },
    { code: 'Up', heading: unnumbered(s.availability.heading), body: <p className="m-0">{s.availability.body}</p> },
    { code: 'Liab', heading: unnumbered(s.liability.heading), body: <p className="m-0">{s.liability.body}</p> },
    { code: 'End', heading: unnumbered(s.termination.heading), body: <p className="m-0">{s.termination.body}</p> },
    { code: 'Law', heading: unnumbered(s.governingLaw.heading), body: <p className="m-0">{s.governingLaw.body}</p> },
    {
      code: 'Ask',
      heading: unnumbered(s.contact.heading),
      body: <p className="m-0">{withLink(s.contact.body, '{email}', <MailLink email={CONTACT_EMAIL} />)}</p>,
    },
  ]

  return (
    <LegalPage
      eyebrow={p.eyebrow}
      headline={p.headline}
      meta={t.legal.meta(updated, sections.length, readMinutes(s))}
      summary={p.summary}
      sections={sections}
      contactEmail={CONTACT_EMAIL}
    />
  )
}
