export type Locale = 'en' | 'de'

export interface HeadlineWord {
  text: string
  amber: boolean
}

export interface LandingTranslations {
  nav: {
    features: string
    howItWorks: string
    pricing: string
    signIn: string
    getStarted: string
  }
  hero: {
    badge: string
    headlineWords: HeadlineWord[]
    subheadline: string
    getStartedFree: string
    seeHowItWorks: string
    socialProof: string
    mockupQuestion: string
    mockupAnswer: string
    holdToSpeak: string
    aiAssistant: string
  }
  trustStrip: {
    badges: string[]
  }
  features: {
    sectionLabel: string
    headlineNormal: string
    headlineAmber: string
    subheadline: string
    items: { title: string; desc: string }[]
  }
  howItWorks: {
    sectionLabel: string
    headline: string
    subheadline: string
    steps: { number: string; title: string; desc: string; detail: string }[]
  }
  pricing: {
    sectionLabel: string
    headline: string
    subheadline: string
    free: {
      name: string
      period: string
      description: string
      features: string[]
      cta: string
    }
    pro: {
      name: string
      badge: string
      period: string
      description: string
      features: string[]
      cta: string
    }
    finePrint: string
  }
  finalCta: {
    headline: string
    headlineAmber: string
    subheadline: string
    cta: string
    finePrint: string
  }
  footer: {
    tagline: string
    getStartedFree: string
    groups: {
      product: { label: string; links: { label: string; href: string }[] }
      legal: { label: string; links: { label: string; href: string }[] }
    }
    bottomTagline: string
  }
  legal: {
    back: string
    lastUpdatedPrefix: string
    footerPrivacy: string
    footerTerms: string
    privacy: {
      pageTitle: string
      sections: {
        whoWeAre: { heading: string; body: string; contactPrefix: string }
        whatWeCollect: {
          heading: string
          items: { title: string; desc: string }[]
        }
        whatWeDoNotCollect: { heading: string; items: string[] }
        howWeUse: { heading: string; intro: string; items: string[]; outro: string }
        thirdParty: {
          heading: string
          intro: string
          items: { name: string; desc: string }[]
        }
        gdprRights: {
          heading: string
          intro: string
          items: { right: string; desc: string }[]
          outro: string
        }
        retention: { heading: string; body: string }
        changes: { heading: string; body: string }
        contact: { heading: string; body: string }
      }
    }
    terms: {
      pageTitle: string
      sections: {
        whoApplies: { heading: string; body: string }
        whatTruffleIs: {
          heading: string
          body: string
          notAdvisorLabel: string
          notAdvisorBody: string
        }
        yourAccount: { heading: string; items: string[] }
        plans: { heading: string; body: string; pricingLinkLabel: string; body2: string }
        yourData: { heading: string; body: string; privacyLinkLabel: string; body2: string }
        acceptableUse: { heading: string; intro: string; items: string[] }
        availability: { heading: string; body: string }
        liability: { heading: string; body: string }
        termination: { heading: string; body: string }
        governingLaw: { heading: string; body: string }
        contact: { heading: string; body: string }
      }
    }
  }
}

export const translations: Record<Locale, LandingTranslations> = {
  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      signIn: 'Sign in',
      getStarted: 'Get started',
    },
    hero: {
      badge: 'Voice-first · AI-powered',
      headlineWords: [
        { text: 'Your', amber: false },
        { text: 'finances,', amber: false },
        { text: 'unearthed.', amber: true },
      ],
      subheadline:
        'The AI finance assistant that talks with you, not at you. No spreadsheets. No bank linking. Just speak.',
      getStartedFree: 'Get Started Free',
      seeHowItWorks: 'See how it works',
      socialProof: 'Free to start · No credit card · No bank credentials',
      mockupQuestion: 'How much did I spend on food this week?',
      mockupAnswer:
        'You spent $284 on food this week — $47 over last week. Most of it was DoorDash (5 orders) and Whole Foods (2 visits).',
      holdToSpeak: 'Hold to speak',
      aiAssistant: 'AI assistant',
    },
    trustStrip: {
      badges: [
        'No bank linking required',
        'Voice-first input',
        'Your data stays yours',
        'Zero spreadsheets',
        'Powered by AI',
      ],
    },
    features: {
      sectionLabel: 'Features',
      headlineNormal: 'Everything you need,',
      headlineAmber: "nothing you don't",
      subheadline:
        'Truffle is built for people who hate managing money — so it does the heavy lifting for you.',
      items: [
        {
          title: 'Voice-First Chat',
          desc: "Ask 'How much did I spend on food this week?' out loud. Truffle understands natural language and remembers your context.",
        },
        {
          title: 'Receipt Scanner',
          desc: 'Snap a receipt or upload a PDF. Truffle extracts every line and categorizes it automatically — no manual entry needed.',
        },
        {
          title: 'AI Spending Insights',
          desc: 'Anomalies, trends, and month-end forecasts — surfaced automatically. Know where your money goes before you run out.',
        },
        {
          title: 'Savings Goals',
          desc: 'Set a goal with a deadline. Get nudged when you fall behind. Get celebrated when you hit milestones.',
        },
        {
          title: 'Smart Habits',
          desc: 'Build weekly saving streaks. Truffle tracks every contribution and rewards consistency with milestone celebrations.',
        },
        {
          title: 'Privacy First',
          desc: 'No bank linking. Ever. You enter your data — Truffle analyzes it. Nothing is sold, shared, or synced without you.',
        },
      ],
    },
    howItWorks: {
      sectionLabel: 'How it works',
      headline: 'Up and running in three steps',
      subheadline: 'No onboarding call. No three-week integration. Just sign up and start talking.',
      steps: [
        {
          number: '01',
          title: 'Sign up in seconds',
          desc: "Just your email. No credit card, no bank credentials, no form that takes ten minutes. You're in before your coffee gets cold.",
          detail: 'Passwordless magic link — no password to forget',
        },
        {
          number: '02',
          title: 'Log your spending your way',
          desc: 'Type it, say it out loud, snap a receipt, or drop in a bank CSV. However you prefer — Truffle handles the rest.',
          detail: 'Text · Voice · Receipt photo · CSV import',
        },
        {
          number: '03',
          title: 'Ask anything, get real answers',
          desc: '"What did I spend last month?" "Can I afford this?" "Where is my money going?" Ask naturally, get clear answers — no dashboard diving.',
          detail: 'Context-aware AI that remembers your history',
        },
      ],
    },
    pricing: {
      sectionLabel: 'Pricing',
      headline: 'Simple, honest pricing',
      subheadline: 'Start free. Upgrade when Truffle earns it.',
      free: {
        name: 'Free',
        period: 'forever',
        description: 'Everything you need to get started. No card required.',
        features: [
          'Manual transaction entry',
          'AI chat — 50 messages/month',
          'Spending insights & heatmap',
          '3 savings goals',
          '2 savings habits',
          'CSV export — last 30 days',
        ],
        cta: 'Get Started Free',
      },
      pro: {
        name: 'Pro',
        badge: 'Coming Soon',
        period: '/month',
        description: 'For people serious about taking control of their money.',
        features: [
          'Everything in Free',
          'Unlimited AI chat',
          'Receipt & PDF scanner',
          'Voice transcription',
          'Unlimited goals & habits',
          'Full history CSV export',
          'Monthly AI finance report',
        ],
        cta: 'Join Waitlist',
      },
      finePrint:
        'Pro tier in active development. Join the waitlist to be notified at launch and lock in early pricing.',
    },
    finalCta: {
      headline: 'Your finances are waiting',
      headlineAmber: 'to be unearthed',
      subheadline:
        'Stop guessing where your money went. Start asking. Truffle is free to try — no card, no bank link, no catch.',
      cta: 'Get Started Free',
      finePrint: 'Free forever · No credit card · Takes 30 seconds',
    },
    footer: {
      tagline:
        'Your finances, unearthed. A voice-first personal finance assistant that talks with you, not at you.',
      getStartedFree: 'Get started free →',
      groups: {
        product: {
          label: 'Product',
          links: [
            { label: 'Features', href: '#features' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Pricing', href: '#pricing' },
          ],
        },
        legal: {
          label: 'Legal',
          links: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
          ],
        },
      },
      bottomTagline: 'No bank linking. No spreadsheets. Just talk.',
    },
    legal: {
      back: '← Back',
      lastUpdatedPrefix: 'Last updated:',
      footerPrivacy: 'Privacy',
      footerTerms: 'Terms',
      privacy: {
        pageTitle: 'Privacy Policy',
        sections: {
          whoWeAre: {
            heading: 'Who we are',
            body: 'Truffle is a personal finance assistant built and operated by Hariharan Selvaraj, based in Berlin, Germany. When you use Truffle, Hariharan Selvaraj is the data controller responsible for your personal data under the GDPR.',
            contactPrefix: 'Contact:',
          },
          whatWeCollect: {
            heading: 'What data we collect',
            items: [
              {
                title: 'Your email address',
                desc: 'Used to create and authenticate your account via magic link. We never store a password.',
              },
              {
                title: 'Transactions you enter',
                desc: 'The spending data you type, import via CSV, or extract from receipts. This is the core of the service.',
              },
              {
                title: 'Voice recordings',
                desc: 'Captured only when you use the voice input feature, sent to Groq (Whisper) for transcription, and not stored after processing.',
              },
              {
                title: 'Receipt images and PDFs',
                desc: 'Uploaded for parsing only. Extracted transaction data is saved; the original file is not retained.',
              },
              {
                title: 'Usage analytics',
                desc: 'Anonymised event data via PostHog to understand how features are used. No personally identifiable information is included.',
              },
            ],
          },
          whatWeDoNotCollect: {
            heading: 'What we do NOT collect',
            items: [
              'Bank credentials or account numbers — we have no bank linking feature.',
              'Payment card details — payments (when Pro launches) are handled entirely by Stripe.',
              'Data from third-party data brokers.',
              "Any data from people who haven't signed up.",
            ],
          },
          howWeUse: {
            heading: 'How we use your data',
            intro: 'Your data is used solely to provide the Truffle service to you:',
            items: [
              'To answer your questions in the AI chat (your transaction history is passed as context to the AI model).',
              'To generate spending insights, forecasts, and anomaly detection.',
              'To send you proactive nudges about your savings goals and habits.',
              'To allow you to export your own data.',
            ],
            outro:
              'We do not sell your data, share it for advertising, or use it to train AI models.',
          },
          thirdParty: {
            heading: 'Third-party services',
            intro: 'We use the following sub-processors to operate the service:',
            items: [
              { name: 'Supabase', desc: 'Database and authentication (EU region).' },
              { name: 'Google Gemini', desc: 'AI model powering the chat and insights.' },
              { name: 'Groq / Whisper', desc: 'Voice transcription.' },
              { name: 'PostHog', desc: 'Anonymised product analytics.' },
              { name: 'Vercel', desc: 'Hosting and deployment (EU edge where available).' },
            ],
          },
          gdprRights: {
            heading: 'Your rights under GDPR',
            intro: 'As a user based in the EU, you have the right to:',
            items: [
              { right: 'Access', desc: 'Request a copy of all data we hold about you.' },
              { right: 'Rectification', desc: 'Correct inaccurate data.' },
              { right: 'Erasure', desc: 'Delete your account and all associated data.' },
              {
                right: 'Portability',
                desc: 'Export your transaction data as CSV from within the app.',
              },
              {
                right: 'Objection',
                desc: 'Object to any processing based on legitimate interests.',
              },
            ],
            outro:
              'To exercise any of these rights, email {email}. We will respond within 30 days.',
          },
          retention: {
            heading: 'Data retention',
            body: 'Your data is retained for as long as your account is active. If you delete your account, all associated data is permanently deleted within 30 days. Anonymised analytics data (which cannot be linked back to you) may be retained for product improvement purposes.',
          },
          changes: {
            heading: 'Changes to this policy',
            body: 'If we make material changes to this policy, we will notify you by email before the changes take effect. Continued use of Truffle after that date constitutes acceptance of the updated policy.',
          },
          contact: {
            heading: 'Contact',
            body: 'Questions or complaints? {email}. You also have the right to lodge a complaint with the Berlin Commissioner for Data Protection and Freedom of Information (Berliner Beauftragte für Datenschutz und Informationsfreiheit).',
          },
        },
      },
      terms: {
        pageTitle: 'Terms of Service',
        sections: {
          whoApplies: {
            heading: '1. Who these terms apply to',
            body: 'These Terms of Service ("Terms") govern your use of Truffle, a personal finance assistant operated by Hariharan Selvaraj, Berlin, Germany ("we", "us", "Truffle"). By creating an account you agree to these Terms. If you do not agree, do not use the service.',
          },
          whatTruffleIs: {
            heading: '2. What Truffle is',
            body: 'Truffle is a personal finance tracking and AI chat tool. It helps you log spending, set savings goals, and ask questions about your own financial data.',
            notAdvisorLabel: 'Truffle is not a financial advisor.',
            notAdvisorBody:
              'Nothing in Truffle constitutes financial, investment, tax, or legal advice. All insights, forecasts, and suggestions are based solely on the data you enter and are provided for informational purposes only. Make financial decisions based on your own judgement and, where appropriate, professional advice.',
          },
          yourAccount: {
            heading: '3. Your account',
            items: [
              'You must be at least 18 years old to use Truffle.',
              'You are responsible for keeping your magic link emails private and your account secure.',
              'You are responsible for all activity that occurs under your account.',
              'One account per person. Do not create accounts on behalf of others without their knowledge.',
            ],
          },
          plans: {
            heading: '4. Free and Pro plans',
            body: 'Truffle is free to use with certain limits (see the {pricingLink} for current details). A Pro plan is in development and will be offered at €9/month when launched.',
            pricingLinkLabel: 'pricing page',
            body2:
              "We reserve the right to change plan limits and pricing. We will give you at least 30 days' notice before any price increase takes effect for existing paid subscribers.",
          },
          yourData: {
            heading: '5. Your data',
            body: 'You own the data you enter into Truffle. We do not claim any rights over your transaction records, goals, or other personal data. You can export or delete your data at any time.',
            privacyLinkLabel: 'Privacy Policy',
            body2: 'See our {privacyLink} for full details on how we handle your data.',
          },
          acceptableUse: {
            heading: '6. Acceptable use',
            intro: 'You agree not to:',
            items: [
              'Use Truffle for any unlawful purpose.',
              "Attempt to access other users' data.",
              'Reverse-engineer, scrape, or abuse the API.',
              'Use the service to process data on behalf of others without their consent.',
              'Misrepresent your identity or impersonate others.',
            ],
          },
          availability: {
            heading: '7. Availability',
            body: 'We aim to keep Truffle available but do not guarantee uptime. The service is provided "as is". We may change, suspend, or discontinue features at any time, though we will try to give reasonable notice for significant changes.',
          },
          liability: {
            heading: '8. Limitation of liability',
            body: "To the maximum extent permitted by law, Truffle is not liable for any indirect, incidental, or consequential damages arising from your use of the service — including financial losses resulting from decisions you make based on Truffle's output.",
          },
          termination: {
            heading: '9. Termination',
            body: 'You can delete your account at any time from Settings. We may suspend or terminate accounts that violate these Terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.',
          },
          governingLaw: {
            heading: '10. Governing law',
            body: 'These Terms are governed by the laws of the Federal Republic of Germany. Any disputes shall be subject to the exclusive jurisdiction of the courts of Berlin, Germany, unless mandatory consumer protection laws in your country of residence provide otherwise.',
          },
          contact: {
            heading: '11. Contact',
            body: 'Questions about these Terms? {email}',
          },
        },
      },
    },
  },

  de: {
    nav: {
      features: 'Funktionen',
      howItWorks: "So funktioniert's",
      pricing: 'Preise',
      signIn: 'Anmelden',
      getStarted: 'Jetzt starten',
    },
    hero: {
      badge: 'Sprache zuerst · KI-gestützt',
      headlineWords: [
        { text: 'Deine', amber: false },
        { text: 'Finanzen,', amber: false },
        { text: 'enthüllt.', amber: true },
      ],
      subheadline:
        'Der KI-Finanzassistent, der mit dir spricht — nicht über dich. Keine Tabellen. Kein Bank-Linking. Einfach sprechen.',
      getStartedFree: 'Kostenlos starten',
      seeHowItWorks: "So funktioniert's",
      socialProof: 'Kostenlos starten · Keine Kreditkarte · Keine Bankdaten',
      mockupQuestion: 'Wie viel habe ich diese Woche für Essen ausgegeben?',
      mockupAnswer:
        'Du hast diese Woche 284 € für Essen ausgegeben — 47 € mehr als letzte Woche. Größtenteils Lieferando (5 Bestellungen) und Rewe (2 Besuche).',
      holdToSpeak: 'Halten zum Sprechen',
      aiAssistant: 'KI-Assistent',
    },
    trustStrip: {
      badges: [
        'Kein Bank-Linking nötig',
        'Sprache als Eingabe',
        'Deine Daten gehören dir',
        'Keine Tabellen',
        'KI-gestützt',
      ],
    },
    features: {
      sectionLabel: 'Funktionen',
      headlineNormal: 'Alles, was du brauchst —',
      headlineAmber: 'nichts, was du nicht brauchst',
      subheadline:
        'Truffle wurde für Menschen entwickelt, die Finanzen hassen — damit es die schwere Arbeit für dich erledigt.',
      items: [
        {
          title: 'Sprachgesteuerter Chat',
          desc: "Frag laut 'Wie viel habe ich diese Woche für Essen ausgegeben?' Truffle versteht natürliche Sprache und merkt sich deinen Kontext.",
        },
        {
          title: 'Kassenbon-Scanner',
          desc: 'Fotografiere einen Kassenbon oder lade ein PDF hoch. Truffle extrahiert jede Zeile und kategorisiert sie automatisch — keine manuelle Eingabe.',
        },
        {
          title: 'KI-Ausgabenanalyse',
          desc: 'Anomalien, Trends und Monatsend-Prognosen — automatisch aufgedeckt. Wisse, wohin dein Geld geht, bevor es weg ist.',
        },
        {
          title: 'Sparziele',
          desc: 'Setze ein Ziel mit Deadline. Erhalte Hinweise, wenn du zurückfällst. Werde gefeiert, wenn du Meilensteine erreichst.',
        },
        {
          title: 'Spargewohnheiten',
          desc: 'Baue wöchentliche Sparsträhnen auf. Truffle verfolgt jeden Beitrag und belohnt Beständigkeit mit Meilenstein-Feiern.',
        },
        {
          title: 'Datenschutz an erster Stelle',
          desc: 'Kein Bank-Linking. Jemals. Du gibst deine Daten ein — Truffle analysiert sie. Nichts wird ohne dich verkauft, geteilt oder synchronisiert.',
        },
      ],
    },
    howItWorks: {
      sectionLabel: "So funktioniert's",
      headline: 'In drei Schritten startklar',
      subheadline:
        'Kein Onboarding-Call. Keine wochenlange Integration. Einfach registrieren und lossprechen.',
      steps: [
        {
          number: '01',
          title: 'In Sekunden registrieren',
          desc: 'Nur deine E-Mail. Keine Kreditkarte, keine Bankdaten, kein Formular das ewig dauert. Du bist dabei, bevor dein Kaffee kalt wird.',
          detail: 'Passwortloser Magic-Link — kein Passwort nötig',
        },
        {
          number: '02',
          title: 'Ausgaben auf deine Art erfassen',
          desc: 'Tippe es, sag es laut, fotografiere einen Kassenbon oder importiere eine Bank-CSV. Wie auch immer du es bevorzugst — Truffle erledigt den Rest.',
          detail: 'Text · Sprache · Kassenbon-Foto · CSV-Import',
        },
        {
          number: '03',
          title: 'Frag alles, erhalte echte Antworten',
          desc: '"Was habe ich letzten Monat ausgegeben?" "Kann ich mir das leisten?" "Wohin geht mein Geld?" Frag natürlich, erhalte klare Antworten.',
          detail: 'Kontextbewusste KI, die deine Geschichte kennt',
        },
      ],
    },
    pricing: {
      sectionLabel: 'Preise',
      headline: 'Einfache, ehrliche Preise',
      subheadline: 'Kostenlos starten. Upgraden, wenn Truffle es verdient hat.',
      free: {
        name: 'Kostenlos',
        period: 'für immer',
        description: 'Alles, was du zum Starten brauchst. Keine Kreditkarte nötig.',
        features: [
          'Manuelle Transaktionseingabe',
          'KI-Chat — 50 Nachrichten/Monat',
          'Ausgabenanalyse & Heatmap',
          '3 Sparziele',
          '2 Spargewohnheiten',
          'CSV-Export — letzte 30 Tage',
        ],
        cta: 'Kostenlos starten',
      },
      pro: {
        name: 'Pro',
        badge: 'Demnächst',
        period: '/Monat',
        description: 'Für Menschen, die ihre Finanzen wirklich in den Griff bekommen wollen.',
        features: [
          'Alles aus Kostenlos',
          'Unbegrenzter KI-Chat',
          'Kassenbon- & PDF-Scanner',
          'Sprach-Transkription',
          'Unbegrenzte Ziele & Gewohnheiten',
          'Vollständiger CSV-Verlauf',
          'Monatlicher KI-Finanzbericht',
        ],
        cta: 'Warteliste beitreten',
      },
      finePrint:
        'Pro-Tarif in aktiver Entwicklung. Tritt der Warteliste bei, um beim Launch benachrichtigt zu werden und frühzeitige Preise zu sichern.',
    },
    finalCta: {
      headline: 'Deine Finanzen warten darauf,',
      headlineAmber: 'enthüllt zu werden',
      subheadline:
        'Hör auf zu raten, wohin dein Geld geht. Fang an zu fragen. Truffle ist kostenlos — keine Kreditkarte, kein Bank-Link, kein Haken.',
      cta: 'Kostenlos starten',
      finePrint: 'Für immer kostenlos · Keine Kreditkarte · Dauert 30 Sekunden',
    },
    footer: {
      tagline:
        'Deine Finanzen, enthüllt. Ein sprachgesteuerter Finanzassistent, der mit dir spricht — nicht über dich.',
      getStartedFree: 'Kostenlos starten →',
      groups: {
        product: {
          label: 'Produkt',
          links: [
            { label: 'Funktionen', href: '#features' },
            { label: "So funktioniert's", href: '#how-it-works' },
            { label: 'Preise', href: '#pricing' },
          ],
        },
        legal: {
          label: 'Rechtliches',
          links: [
            { label: 'Datenschutz', href: '/privacy' },
            { label: 'Nutzungsbedingungen', href: '/terms' },
          ],
        },
      },
      bottomTagline: 'Kein Bank-Linking. Keine Tabellen. Einfach sprechen.',
    },
    legal: {
      back: '← Zurück',
      lastUpdatedPrefix: 'Zuletzt aktualisiert:',
      footerPrivacy: 'Datenschutz',
      footerTerms: 'Nutzungsbedingungen',
      privacy: {
        pageTitle: 'Datenschutzerklärung',
        sections: {
          whoWeAre: {
            heading: 'Wer wir sind',
            body: 'Truffle ist ein persönlicher Finanzassistent, der von Hariharan Selvaraj mit Sitz in Berlin, Deutschland, entwickelt und betrieben wird. Wenn du Truffle nutzt, ist Hariharan Selvaraj der Verantwortliche für deine personenbezogenen Daten gemäß der DSGVO.',
            contactPrefix: 'Kontakt:',
          },
          whatWeCollect: {
            heading: 'Welche Daten wir erheben',
            items: [
              {
                title: 'Deine E-Mail-Adresse',
                desc: 'Wird verwendet, um dein Konto per Magic-Link zu erstellen und zu authentifizieren. Wir speichern kein Passwort.',
              },
              {
                title: 'Von dir eingegebene Transaktionen',
                desc: 'Die Ausgabendaten, die du tippst, per CSV importierst oder aus Kassenbons extrahierst. Das ist der Kern des Dienstes.',
              },
              {
                title: 'Sprachaufnahmen',
                desc: 'Werden nur aufgenommen, wenn du die Spracheingabe nutzt, zur Transkription an Groq (Whisper) gesendet und nach der Verarbeitung nicht gespeichert.',
              },
              {
                title: 'Kassenbon-Bilder und PDFs',
                desc: 'Werden nur zum Parsen hochgeladen. Extrahierte Transaktionsdaten werden gespeichert; die Originaldatei wird nicht aufbewahrt.',
              },
              {
                title: 'Nutzungsanalysen',
                desc: 'Anonymisierte Ereignisdaten über PostHog, um zu verstehen, wie Funktionen genutzt werden. Es sind keine personenbezogenen Daten enthalten.',
              },
            ],
          },
          whatWeDoNotCollect: {
            heading: 'Was wir NICHT erheben',
            items: [
              'Bankzugangsdaten oder Kontonummern – wir haben keine Bank-Linking-Funktion.',
              'Zahlungskartendaten – Zahlungen (beim Pro-Start) werden vollständig über Stripe abgewickelt.',
              'Daten von Drittanbieter-Datenbrokern.',
              'Daten von Personen, die sich nicht registriert haben.',
            ],
          },
          howWeUse: {
            heading: 'Wie wir deine Daten verwenden',
            intro:
              'Deine Daten werden ausschließlich zur Erbringung des Truffle-Dienstes für dich verwendet:',
            items: [
              'Um deine Fragen im KI-Chat zu beantworten (deine Transaktionshistorie wird als Kontext an das KI-Modell übergeben).',
              'Um Ausgabenanalysen, Prognosen und Anomalieerkennung zu erstellen.',
              'Um dir proaktive Hinweise zu deinen Sparzielen und Gewohnheiten zu senden.',
              'Um dir den Export deiner eigenen Daten zu ermöglichen.',
            ],
            outro:
              'Wir verkaufen deine Daten nicht, teilen sie nicht für Werbezwecke und verwenden sie nicht zum Training von KI-Modellen.',
          },
          thirdParty: {
            heading: 'Drittanbieter-Dienste',
            intro: 'Wir nutzen folgende Auftragsverarbeiter zum Betrieb des Dienstes:',
            items: [
              { name: 'Supabase', desc: 'Datenbank und Authentifizierung (EU-Region).' },
              { name: 'Google Gemini', desc: 'KI-Modell für Chat und Analysen.' },
              { name: 'Groq / Whisper', desc: 'Sprachtranskription.' },
              { name: 'PostHog', desc: 'Anonymisierte Produktanalysen.' },
              { name: 'Vercel', desc: 'Hosting und Deployment (EU-Edge wo verfügbar).' },
            ],
          },
          gdprRights: {
            heading: 'Deine Rechte gemäß DSGVO',
            intro: 'Als Nutzer in der EU hast du das Recht auf:',
            items: [
              {
                right: 'Auskunft',
                desc: 'Anforderung einer Kopie aller Daten, die wir über dich gespeichert haben.',
              },
              { right: 'Berichtigung', desc: 'Korrektur unrichtiger Daten.' },
              { right: 'Löschung', desc: 'Löschung deines Kontos und aller zugehörigen Daten.' },
              {
                right: 'Datenübertragbarkeit',
                desc: 'Export deiner Transaktionsdaten als CSV aus der App heraus.',
              },
              {
                right: 'Widerspruch',
                desc: 'Widerspruch gegen jede Verarbeitung auf Basis berechtigter Interessen.',
              },
            ],
            outro:
              'Um eines dieser Rechte auszuüben, schreib an {email}. Wir antworten innerhalb von 30 Tagen.',
          },
          retention: {
            heading: 'Datenspeicherung',
            body: 'Deine Daten werden so lange gespeichert, wie dein Konto aktiv ist. Wenn du dein Konto löschst, werden alle zugehörigen Daten innerhalb von 30 Tagen dauerhaft gelöscht. Anonymisierte Analysedaten (die nicht auf dich zurückgeführt werden können) können zu Produktverbesserungszwecken aufbewahrt werden.',
          },
          changes: {
            heading: 'Änderungen dieser Richtlinie',
            body: 'Bei wesentlichen Änderungen dieser Richtlinie werden wir dich per E-Mail informieren, bevor die Änderungen in Kraft treten. Die weitere Nutzung von Truffle nach diesem Datum gilt als Zustimmung zur aktualisierten Richtlinie.',
          },
          contact: {
            heading: 'Kontakt',
            body: 'Fragen oder Beschwerden? {email}. Du hast auch das Recht, eine Beschwerde bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit einzureichen.',
          },
        },
      },
      terms: {
        pageTitle: 'Nutzungsbedingungen',
        sections: {
          whoApplies: {
            heading: '1. Für wen diese Bedingungen gelten',
            body: 'Diese Nutzungsbedingungen ("Bedingungen") regeln deine Nutzung von Truffle, einem persönlichen Finanzassistenten, der von Hariharan Selvaraj, Berlin, Deutschland ("wir", "uns", "Truffle") betrieben wird. Durch die Erstellung eines Kontos stimmst du diesen Bedingungen zu. Wenn du nicht einverstanden bist, nutze den Dienst nicht.',
          },
          whatTruffleIs: {
            heading: '2. Was Truffle ist',
            body: 'Truffle ist ein persönliches Finanzverfolgungstool mit KI-Chat. Es hilft dir, Ausgaben zu erfassen, Sparziele zu setzen und Fragen zu deinen eigenen Finanzdaten zu stellen.',
            notAdvisorLabel: 'Truffle ist kein Finanzberater.',
            notAdvisorBody:
              'Nichts in Truffle stellt eine Finanz-, Investment-, Steuer- oder Rechtsberatung dar. Alle Analysen, Prognosen und Empfehlungen basieren ausschließlich auf den von dir eingegebenen Daten und dienen nur zu Informationszwecken. Triff Finanzentscheidungen auf Basis deines eigenen Urteils und gegebenenfalls professioneller Beratung.',
          },
          yourAccount: {
            heading: '3. Dein Konto',
            items: [
              'Du musst mindestens 18 Jahre alt sein, um Truffle zu nutzen.',
              'Du bist dafür verantwortlich, deine Magic-Link-E-Mails privat zu halten und dein Konto zu sichern.',
              'Du bist für alle Aktivitäten verantwortlich, die unter deinem Konto stattfinden.',
              'Ein Konto pro Person. Erstelle keine Konten im Namen anderer ohne deren Wissen.',
            ],
          },
          plans: {
            heading: '4. Kostenlos- und Pro-Plan',
            body: 'Truffle ist mit bestimmten Limits kostenlos nutzbar (aktuelle Details siehe {pricingLink}). Ein Pro-Plan befindet sich in der Entwicklung und wird bei Markteinführung für 9 €/Monat angeboten.',
            pricingLinkLabel: 'Preisseite',
            body2:
              'Wir behalten uns das Recht vor, Plan-Limits und Preise zu ändern. Bei Preiserhöhungen für bestehende zahlende Abonnenten werden wir mindestens 30 Tage im Voraus informieren.',
          },
          yourData: {
            heading: '5. Deine Daten',
            body: 'Du bist Eigentümer der Daten, die du in Truffle eingibst. Wir beanspruchen keine Rechte an deinen Transaktionsdaten, Zielen oder anderen persönlichen Daten. Du kannst deine Daten jederzeit exportieren oder löschen.',
            privacyLinkLabel: 'Datenschutzerklärung',
            body2:
              'Vollständige Details zur Datenverarbeitung findest du in unserer {privacyLink}.',
          },
          acceptableUse: {
            heading: '6. Zulässige Nutzung',
            intro: 'Du stimmst zu, Folgendes zu unterlassen:',
            items: [
              'Truffle für illegale Zwecke zu nutzen.',
              'Auf Daten anderer Nutzer zuzugreifen.',
              'Die API zu reverse-engineeren, zu scrapen oder zu missbrauchen.',
              'Den Dienst zu nutzen, um Daten anderer ohne deren Zustimmung zu verarbeiten.',
              'Deine Identität zu verschleiern oder andere zu imitieren.',
            ],
          },
          availability: {
            heading: '7. Verfügbarkeit',
            body: 'Wir streben eine hohe Verfügbarkeit von Truffle an, garantieren jedoch keine Betriebszeit. Der Dienst wird "wie besehen" bereitgestellt. Wir können Funktionen jederzeit ändern, aussetzen oder einstellen, werden jedoch bei wesentlichen Änderungen versuchen, angemessen zu informieren.',
          },
          liability: {
            heading: '8. Haftungsbeschränkung',
            body: 'Soweit gesetzlich zulässig, haftet Truffle nicht für indirekte, zufällige oder Folgeschäden, die aus deiner Nutzung des Dienstes entstehen – einschließlich finanzieller Verluste, die aus Entscheidungen resultieren, die du auf Basis von Truffles Ausgaben triffst.',
          },
          termination: {
            heading: '9. Kündigung',
            body: 'Du kannst dein Konto jederzeit in den Einstellungen löschen. Wir können Konten, die gegen diese Bedingungen verstoßen, sperren oder kündigen. Bei Kündigung werden deine Daten gemäß unserer Datenschutzerklärung gelöscht.',
          },
          governingLaw: {
            heading: '10. Anwendbares Recht',
            body: 'Diese Bedingungen unterliegen dem Recht der Bundesrepublik Deutschland. Streitigkeiten unterliegen der ausschließlichen Zuständigkeit der Gerichte in Berlin, Deutschland, sofern nicht zwingende Verbraucherschutzgesetze deines Wohnsitzlandes anderes vorsehen.',
          },
          contact: {
            heading: '11. Kontakt',
            body: 'Fragen zu diesen Bedingungen? {email}',
          },
        },
      },
    },
  },
}

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
}
