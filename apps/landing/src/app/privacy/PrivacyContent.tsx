'use client'

import LegalPage, { type LegalSection } from '@/components/LegalPage'
import { LegalItem, LegalList, MailLink, readMinutes } from '@/components/LegalParts'
import { useLanguage } from '@/contexts/LanguageContext'

/** Month of the last change; shown in the reader's language. */
const LAST_UPDATED = new Date(2025, 4, 1)
const CONTACT_EMAIL = 'hello@truffle.finance'

/** Splits "text {email} text" around a mail link. */
function withEmail(text: string) {
  const [before, after] = text.split('{email}')
  return (
    <>
      {before}
      <MailLink email={CONTACT_EMAIL} />
      {after}
    </>
  )
}

export default function PrivacyContent() {
  const { t, locale } = useLanguage()
  const updated = LAST_UPDATED.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' })
  const p = t.legal.privacy
  const s = p.sections

  const sections: LegalSection[] = [
    {
      code: 'Who',
      heading: s.whoWeAre.heading,
      body: (
        <>
          <p className="m-0">{s.whoWeAre.body}</p>
          <p className="m-0">
            {s.whoWeAre.contactPrefix} <MailLink email={CONTACT_EMAIL} />
          </p>
        </>
      ),
    },
    {
      code: 'Col',
      heading: s.whatWeCollect.heading,
      body: (
        <LegalList>
          {s.whatWeCollect.items.map(({ title, desc }) => (
            <LegalItem key={title} title={`${title}:`}>
              {desc}
            </LegalItem>
          ))}
        </LegalList>
      ),
    },
    {
      code: 'Not',
      heading: s.whatWeDoNotCollect.heading,
      body: (
        <LegalList>
          {s.whatWeDoNotCollect.items.map((item) => (
            <LegalItem key={item}>{item}</LegalItem>
          ))}
        </LegalList>
      ),
    },
    {
      code: 'Use',
      heading: s.howWeUse.heading,
      body: (
        <>
          <p className="m-0">{s.howWeUse.intro}</p>
          <LegalList>
            {s.howWeUse.items.map((item) => (
              <LegalItem key={item}>{item}</LegalItem>
            ))}
          </LegalList>
          <p className="m-0">{s.howWeUse.outro}</p>
        </>
      ),
    },
    {
      code: '3rd',
      heading: s.thirdParty.heading,
      body: (
        <>
          <p className="m-0">{s.thirdParty.intro}</p>
          <LegalList>
            {s.thirdParty.items.map(({ name, desc }) => (
              <LegalItem key={name} title={name}>
                {desc}
              </LegalItem>
            ))}
          </LegalList>
        </>
      ),
    },
    {
      code: 'You',
      heading: s.gdprRights.heading,
      body: (
        <>
          <p className="m-0">{s.gdprRights.intro}</p>
          <LegalList>
            {s.gdprRights.items.map(({ right, desc }) => (
              <LegalItem key={right} title={`${right}:`}>
                {desc}
              </LegalItem>
            ))}
          </LegalList>
          <p className="m-0">{withEmail(s.gdprRights.outro)}</p>
        </>
      ),
    },
    { code: 'Keep', heading: s.retention.heading, body: <p className="m-0">{s.retention.body}</p> },
    { code: 'Chg', heading: s.changes.heading, body: <p className="m-0">{s.changes.body}</p> },
    { code: 'Ask', heading: s.contact.heading, body: <p className="m-0">{withEmail(s.contact.body)}</p> },
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
