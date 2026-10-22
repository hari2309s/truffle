export type Locale = 'en' | 'de'

export interface HeadlineWord {
  text: string
  amber: boolean
}

/** A "label ........ value" receipt line. */
export interface ReceiptLine {
  label: string
  value: string
}

export interface LandingTranslations {
  nav: {
    features: string
    howItWorks: string
    pricing: string
    signIn: string
    getStarted: string
    menu: string
    closeMenu: string
    theme: { label: string; light: string; system: string; dark: string }
    language: string
  }
  hero: {
    badge: string
    headlineWords: HeadlineWord[]
    subheadline: string
    getStartedFree: string
    seeHowItWorks: string
    socialProof: string
    mockup: {
      label: string
      reprint: string
      question: string
      prevSlipLabel: string
      prevSlipTotal: ReceiptLine
      forLine: string
      stamp: string
      heading: string
      lines: ReceiptLine[]
      total: ReceiptLine
      note: string
    }
    holdToSpeak: string
  }
  trustStrip: {
    badges: string[]
  }
  features: {
    sectionLabel: string
    headline: string
    subheadline: string
    statementLabel: string
    itemsCount: string
    items: { code: string; title: string; desc: string }[]
    total: ReceiptLine
    demo: {
      listening: string
      scanLine: ReceiptLine
      scanStatus: string
      revStatus: string
      goal: { label: string; line: ReceiptLine; create: string; notNow: string }
      habitStreak: string
      privacy: ReceiptLine[]
      subscriptions: ReceiptLine[]
      subscriptionsTotal: ReceiptLine
      budget: { line: ReceiptLine; status: string }
    }
  }
  howItWorks: {
    sectionLabel: string
    headline: string
    subheadline: string
    stepLabel: (n: number, total: number) => string
    steps: { title: string; desc: string; meta: ReceiptLine }[]
    total: ReceiptLine
  }
  pricing: {
    sectionLabel: string
    headline: string
    subheadline: string
    free: {
      name: string
      period: string
      price: string
      features: string[]
      total: ReceiptLine
      cta: string
    }
    pro: {
      name: string
      badge: string
      period: string
      price: string
      features: string[]
      total: ReceiptLine
      cta: string
    }
    finePrint: string
  }
  finalCta: {
    headline: string
    headlineAmber: string
    subheadline: string
    cta: string
    total: ReceiptLine
    finePrint: string
  }
  footer: {
    tagline: string
    groups: {
      product: { label: string; links: { label: string; href: string }[] }
      legal: { label: string; links: { label: string; href: string }[] }
    }
    demo: string
    copyright: (year: number) => string
    builtBy: string
    bottomTagline: string
  }
  cookieBanner: {
    title: string
    message: string
    accept: string
    reject: string
    privacyLabel: string
  }
  legal: {
    back: string
    home: string
    sectionsLabel: string
    meta: (updated: string, sections: number, minutes: number) => string
    questions: (email: string) => string
    endOfDocument: string
    lastUpdatedPrefix: string
    footerPrivacy: string
    footerTerms: string
    /** Display labels for the section codes ("Who" → "Wer"); codes stay the anchor ids. */
    sectionCodes?: Record<string, string>
    privacy: {
      pageTitle: string
      eyebrow: string
      headline: string
      summary: string
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
      eyebrow: string
      headline: string
      summary: string
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
      menu: 'Open menu',
      closeMenu: 'Close menu',
      theme: { label: 'Theme', light: 'Light', system: 'System', dark: 'Dark' },
      language: 'Language',
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
      getStartedFree: 'Get Started Free →',
      seeHowItWorks: 'See how it works',
      socialProof: 'Free to start · No credit card · No bank credentials',
      mockup: {
        label: 'Truffle · chat',
        reprint: '↻ Reprint',
        question: 'How much did I spend on food this week?',
        prevSlipLabel: 'Week 41 · Food',
        prevSlipTotal: { label: 'Total', value: '€177.00' },
        forLine: 'For Hari · Week 42',
        stamp: 'Wed 21 Oct · 18:42',
        heading: 'Food this week',
        lines: [
          { label: 'Food delivery × 5', value: '€142.00' },
          { label: 'Groceries × 2', value: '€58.00' },
        ],
        total: { label: 'Total', value: '€200.00' },
        note: '€23 over last week.',
      },
      holdToSpeak: 'Hold · Speak',
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
      sectionLabel: 'Features · 08 items',
      headline: 'Everything you need, nothing you don’t',
      subheadline: 'Itemised, like everything else in Truffle. No add-ons hiding at the bottom.',
      statementLabel: 'Statement of features',
      itemsCount: '08 items',
      items: [
        {
          code: 'Chat',
          title: 'Voice-first chat',
          desc: 'Hold the key and talk. Truffle answers out loud and prints the numbers.',
        },
        {
          code: 'Scan',
          title: 'Receipt scanner',
          desc: 'Snap a receipt or a PDF statement. Every line itemised in seconds.',
        },
        {
          code: 'Rev',
          title: 'AI spending insights',
          desc: 'Spots the odd charge and the busy days, then tells you plainly.',
        },
        {
          code: 'Goal',
          title: 'Savings goals',
          desc: 'Mention a plan and Truffle offers a goal to save towards, with a deadline.',
        },
        {
          code: 'Hab',
          title: 'Smart habits',
          desc: 'Small, repeatable saves like “€25 every Friday”, tracked as streaks.',
        },
        {
          code: 'Priv',
          title: 'Privacy first',
          desc: 'No bank logins, ever. Your data is yours to export or delete at any time.',
        },
        {
          code: 'Sub',
          title: 'Subscription tracker',
          desc: 'Spots recurring charges automatically and flags the ones you forgot about.',
        },
        {
          code: 'Bud',
          title: 'Monthly budgets',
          desc: 'Soft limits per category, with a gentle heads-up at 80%. Never a scolding.',
        },
      ],
      total: { label: 'Total to start', value: '€0.00' },
      demo: {
        listening: 'Listening 0:03',
        scanLine: { label: 'Lidl × 11 items', value: '€45.20' },
        scanStatus: '● Read 11 of 11 lines',
        revStatus: '▲ 1 to review · €129.00 new merchant',
        goal: {
          label: 'Proposed goal',
          line: { label: 'Japan trip', value: '€3,600.00' },
          create: 'Create goal',
          notNow: 'Not now',
        },
        habitStreak: '✦ 6-week streak',
        privacy: [
          { label: 'Bank logins stored', value: '0' },
          { label: 'Export', value: 'CSV · JSON' },
        ],
        subscriptions: [
          { label: 'Netflix', value: '€13.99' },
          { label: 'Spotify', value: '€10.99' },
        ],
        subscriptionsTotal: { label: 'Monthly', value: '€24.98' },
        budget: {
          line: { label: 'Groceries', value: '€322/€400' },
          status: '▲ Heads-up 80% · €78 left',
        },
      },
    },
    howItWorks: {
      sectionLabel: 'How it works · 3 steps',
      headline: 'From first word to first answer in a minute.',
      subheadline:
        'No setup wizard, no bank connection, no categories to build. Talk, and it prints.',
      stepLabel: (n, total) => `Step 0${n} of 0${total}`,
      steps: [
        {
          title: 'Sign up in seconds',
          desc: 'Just your email and a magic link. No password, no bank details, ever.',
          meta: { label: 'Time', value: '~30 seconds · No card' },
        },
        {
          title: 'Log your spending your way',
          desc: 'Say it, type it, snap a receipt or import a CSV from your bank.',
          meta: { label: 'Inputs', value: 'Voice · Text · Photo · CSV' },
        },
        {
          title: 'Ask anything, get real answers',
          desc: '“Can I afford Japan in April?” Truffle checks your numbers and answers in plain words.',
          meta: { label: 'Currencies', value: 'EUR · GBP · USD' },
        },
      ],
      total: { label: 'Spreadsheets', value: '0' },
    },
    pricing: {
      sectionLabel: 'Pricing · 2 plans',
      headline: 'Simple, honest pricing',
      subheadline: 'Start free. Upgrade when Truffle earns it.',
      free: {
        name: 'Free',
        period: 'forever',
        price: '€0.00',
        features: [
          'Manual transaction entry',
          'AI chat',
          'Spending insights & heatmap',
          'Savings goals',
          'Savings habits',
          'CSV export',
        ],
        total: { label: 'Total', value: '€0.00' },
        cta: 'Get Started Free',
      },
      pro: {
        name: 'Pro',
        badge: 'Coming soon',
        period: 'per month',
        price: '€—.——',
        features: [
          'Everything in Free',
          'Unlimited AI chat',
          'Receipt & PDF scanner',
          'Voice transcription',
          'Unlimited goals & habits',
          'Full history CSV export',
          'Monthly AI finance report',
        ],
        total: { label: 'Total', value: 'At launch' },
        cta: 'Join Waitlist',
      },
      finePrint: 'Pro is in active development · The free plan stays free',
    },
    finalCta: {
      headline: 'Your finances are waiting to be',
      headlineAmber: 'unearthed',
      subheadline: 'Start with one sentence. Truffle takes it from there.',
      cta: 'Get Started Free →',
      total: { label: 'Total', value: 'Calm' },
      finePrint: 'Free forever · No credit card · Takes 30 seconds',
    },
    footer: {
      tagline: 'Your finances, unearthed.',
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
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
          ],
        },
      },
      demo: 'Explore the demo',
      copyright: (year) => `© ${year} Truffle · All rights reserved`,
      builtBy: 'Built by Hariharan Selvaraj',
      bottomTagline: 'Printed with care · No bank logins stored',
    },
    cookieBanner: {
      title: 'Cookies · itemised',
      message:
        'We use analytics cookies to understand how Truffle is used and improve the experience.',
      accept: 'Accept',
      reject: 'Reject',
      privacyLabel: 'Privacy Policy',
    },
    legal: {
      back: '← Back',
      home: '← Home',
      sectionsLabel: 'Sections',
      meta: (updated, sections, minutes) =>
        `Last updated ${updated} · ${sections} sections · ~${minutes} min read`,
      questions: (email) => `Questions? ${email}`,
      endOfDocument: 'End of document',
      lastUpdatedPrefix: 'Last updated:',
      footerPrivacy: 'Privacy',
      footerTerms: 'Terms',
      privacy: {
        pageTitle: 'Privacy Policy',
        eyebrow: 'Legal · Privacy policy',
        headline: 'Privacy, itemised.',
        summary:
          'The short version: Truffle never asks for your bank login, keeps only what it needs to answer you, and lets you export or delete your data from Settings.',
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
              { name: 'Cloudflare Turnstile', desc: 'Bot protection on the sign-in form.' },
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
        eyebrow: 'Legal · Terms of service',
        headline: 'Terms, itemised.',
        summary:
          'The short version: Truffle helps you keep track of your own money. It isn’t financial advice, you own your data, and you can leave at any time.',
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
      howItWorks: 'So funktioniert’s',
      pricing: 'Preise',
      signIn: 'Anmelden',
      getStarted: 'Loslegen',
      menu: 'Menü öffnen',
      closeMenu: 'Menü schließen',
      theme: { label: 'Design', light: 'Hell', system: 'System', dark: 'Dunkel' },
      language: 'Sprache',
    },
    hero: {
      badge: 'Sprache zuerst · KI-gestützt',
      headlineWords: [
        { text: 'Deine', amber: false },
        { text: 'Finanzen,', amber: false },
        { text: 'ausgegraben.', amber: true },
      ],
      subheadline:
        'Der KI-Finanzassistent, der mit dir spricht – nicht über deinen Kopf hinweg. Keine Tabellen. Keine Bankverbindung. Einfach sagen.',
      getStartedFree: 'Kostenlos loslegen →',
      seeHowItWorks: 'So funktioniert’s',
      socialProof: 'Kostenlos starten · Keine Kreditkarte · Keine Bankzugangsdaten',
      mockup: {
        label: 'Truffle · Chat',
        reprint: '↻ Neu drucken',
        question: 'Wie viel habe ich diese Woche für Essen ausgegeben?',
        prevSlipLabel: 'Woche 41 · Essen',
        prevSlipTotal: { label: 'Summe', value: '177,00 €' },
        forLine: 'Für Hari · Woche 42',
        stamp: 'Mi., 21. Okt. · 18:42',
        heading: 'Essen diese Woche',
        lines: [
          { label: 'Lieferdienst × 5', value: '142,00 €' },
          { label: 'Lebensmittel × 2', value: '58,00 €' },
        ],
        total: { label: 'Summe', value: '200,00 €' },
        note: '23 € mehr als letzte Woche.',
      },
      holdToSpeak: 'Halten · Sprechen',
    },
    trustStrip: {
      badges: [
        'Keine Bankverbindung nötig',
        'Eingabe per Sprache',
        'Deine Daten bleiben deine',
        'Null Tabellen',
        'Mit KI',
      ],
    },
    features: {
      sectionLabel: 'Funktionen · 08 Posten',
      headline: 'Alles, was du brauchst – nichts, was du nicht brauchst',
      subheadline: 'Einzeln aufgeführt, wie alles bei Truffle. Keine Extras, die unten im Kleingedruckten lauern.',
      statementLabel: 'Aufstellung der Funktionen',
      itemsCount: '08 Posten',
      items: [
        {
          code: 'Chat',
          title: 'Chat per Sprache',
          desc: 'Taste halten und reden. Truffle antwortet laut und druckt die Zahlen aus.',
        },
        {
          code: 'Scan',
          title: 'Belegscanner',
          desc: 'Kassenbon oder PDF-Kontoauszug fotografieren. Jede Zeile in Sekunden erfasst.',
        },
        {
          code: 'Prü',
          title: 'KI-Ausgabenanalyse',
          desc: 'Erkennt ungewöhnliche Abbuchungen und teure Tage – und sagt es dir klar.',
        },
        {
          code: 'Ziel',
          title: 'Sparziele',
          desc: 'Erwähne einen Plan, und Truffle schlägt ein Sparziel mit Termin vor.',
        },
        {
          code: 'Gew',
          title: 'Smarte Gewohnheiten',
          desc: 'Kleine, wiederholbare Sparbeträge wie „25 € jeden Freitag“, als Serie verfolgt.',
        },
        {
          code: 'Priv',
          title: 'Datenschutz zuerst',
          desc: 'Niemals Bank-Logins. Deine Daten kannst du jederzeit exportieren oder löschen.',
        },
        {
          code: 'Wdk',
          title: 'Wiederkehrende Zahlungen',
          desc: 'Erkennt Abos und Daueraufträge automatisch und zeigt dir die, die du vergessen hast.',
        },
        {
          code: 'Bud',
          title: 'Monatsbudgets',
          desc: 'Weiche Limits pro Kategorie, mit einem freundlichen Hinweis bei 80 %. Nie ein Rüffel.',
        },
      ],
      total: { label: 'Summe zum Start', value: '0,00 €' },
      demo: {
        listening: 'Hört zu 0:03',
        scanLine: { label: 'Lidl × 11 Artikel', value: '45,20 €' },
        scanStatus: '● 11 von 11 Zeilen gelesen',
        revStatus: '▲ 1 zu prüfen · 129,00 € neuer Händler',
        goal: {
          label: 'Vorgeschlagenes Ziel',
          line: { label: 'Japanreise', value: '3.600,00 €' },
          create: 'Ziel anlegen',
          notNow: 'Nicht jetzt',
        },
        habitStreak: '✦ 6 Wochen in Folge',
        privacy: [
          { label: 'Gespeicherte Bank-Logins', value: '0' },
          { label: 'Export', value: 'CSV · JSON' },
        ],
        subscriptions: [
          { label: 'Netflix', value: '13,99 €' },
          { label: 'Spotify', value: '10,99 €' },
        ],
        subscriptionsTotal: { label: 'Monatlich', value: '24,98 €' },
        budget: {
          line: { label: 'Lebensmittel', value: '322 €/400 €' },
          status: '▲ Hinweis 80 % · noch 78 €',
        },
      },
    },
    howItWorks: {
      sectionLabel: 'So funktioniert’s · 3 Schritte',
      headline: 'Vom ersten Wort zur ersten Antwort in einer Minute.',
      subheadline:
        'Kein Einrichtungsassistent, keine Bankverbindung, keine Kategorien zum Anlegen. Sprich, und es wird gedruckt.',
      stepLabel: (n, total) => `Schritt 0${n} von 0${total}`,
      steps: [
        {
          title: 'In Sekunden registriert',
          desc: 'Nur deine E-Mail und ein Anmeldelink. Kein Passwort, niemals Bankdaten.',
          meta: { label: 'Zeit', value: '~30 Sekunden · Ohne Karte' },
        },
        {
          title: 'Ausgaben erfassen, wie du willst',
          desc: 'Sag es, tipp es, fotografiere den Beleg oder importiere eine CSV von deiner Bank.',
          meta: { label: 'Eingabe', value: 'Sprache · Text · Foto · CSV' },
        },
        {
          title: 'Frag alles, bekomm echte Antworten',
          desc: '„Kann ich mir Japan im April leisten?“ Truffle prüft deine Zahlen und antwortet in klaren Worten.',
          meta: { label: 'Währungen', value: 'EUR · GBP · USD' },
        },
      ],
      total: { label: 'Tabellen', value: '0' },
    },
    pricing: {
      sectionLabel: 'Preise · 2 Tarife',
      headline: 'Einfache, ehrliche Preise',
      subheadline: 'Kostenlos starten. Upgraden, wenn Truffle es sich verdient hat.',
      free: {
        name: 'Free',
        period: 'für immer',
        price: '0,00 €',
        features: [
          'Manuelle Erfassung',
          'KI-Chat',
          'Ausgabenanalyse & Kalender',
          'Sparziele',
          'Spargewohnheiten',
          'CSV-Export',
        ],
        total: { label: 'Summe', value: '0,00 €' },
        cta: 'Kostenlos loslegen',
      },
      pro: {
        name: 'Pro',
        badge: 'Demnächst',
        period: 'pro Monat',
        price: '—,—— €',
        features: [
          'Alles aus Free',
          'Unbegrenzter KI-Chat',
          'Beleg- & PDF-Scanner',
          'Spracherkennung',
          'Unbegrenzte Ziele & Gewohnheiten',
          'CSV-Export des gesamten Verlaufs',
          'Monatlicher KI-Finanzbericht',
        ],
        total: { label: 'Summe', value: 'Zum Start' },
        cta: 'Auf die Warteliste',
      },
      finePrint: 'Pro ist in Entwicklung · Der kostenlose Tarif bleibt kostenlos',
    },
    finalCta: {
      headline: 'Deine Finanzen warten darauf,',
      headlineAmber: 'ausgegraben zu werden',
      subheadline: 'Fang mit einem Satz an. Truffle macht den Rest.',
      cta: 'Kostenlos loslegen →',
      total: { label: 'Summe', value: 'Gelassenheit' },
      finePrint: 'Für immer kostenlos · Keine Kreditkarte · Dauert 30 Sekunden',
    },
    footer: {
      tagline: 'Deine Finanzen, ausgegraben.',
      groups: {
        product: {
          label: 'Produkt',
          links: [
            { label: 'Funktionen', href: '#features' },
            { label: 'So funktioniert’s', href: '#how-it-works' },
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
      demo: 'Demo ausprobieren',
      copyright: (year) => `© ${year} Truffle · Alle Rechte vorbehalten`,
      builtBy: 'Entwickelt von Hariharan Selvaraj',
      bottomTagline: 'Mit Sorgfalt gedruckt · Keine Bank-Logins gespeichert',
    },
    cookieBanner: {
      title: 'Cookies · einzeln aufgeführt',
      message:
        'Wir verwenden Analyse-Cookies, um zu verstehen, wie Truffle genutzt wird, und es zu verbessern.',
      accept: 'Akzeptieren',
      reject: 'Ablehnen',
      privacyLabel: 'Datenschutzerklärung',
    },
    legal: {
      back: '← Zurück',
      home: '← Start',
      sectionsLabel: 'Abschnitte',
      meta: (updated, sections, minutes) =>
        `Zuletzt aktualisiert: ${updated} · ${sections} Abschnitte · ca. ${minutes} Min. Lesezeit`,
      questions: (email) => `Fragen? ${email}`,
      endOfDocument: 'Ende des Dokuments',
      lastUpdatedPrefix: 'Zuletzt aktualisiert:',
      footerPrivacy: 'Datenschutz',
      footerTerms: 'Nutzungsbedingungen',
      sectionCodes: {
        Who: 'Wer',
        What: 'Was',
        Acct: 'Konto',
        Plan: 'Tarif',
        Data: 'Daten',
        Use: 'Nutz',
        Up: 'Betr',
        Liab: 'Haft',
        End: 'Ende',
        Law: 'Recht',
        Ask: 'Frag',
        Col: 'Erh',
        Not: 'Nicht',
        '3rd': 'Dritt',
        You: 'Rechte',
        Keep: 'Dauer',
        Chg: 'Änd',
      },
      privacy: {
        pageTitle: 'Datenschutzerklärung',
        eyebrow: 'Rechtliches · Datenschutzerklärung',
        headline: 'Datenschutz, einzeln aufgeführt.',
        summary:
          'Kurz gesagt: Truffle fragt nie nach deinem Bank-Login, speichert nur, was es braucht, um dir zu antworten, und du kannst deine Daten in den Einstellungen exportieren oder löschen.',
        sections: {
          whoWeAre: {
            heading: 'Wer wir sind',
            body: 'Truffle ist ein persönlicher Finanzassistent, entwickelt und betrieben von Hariharan Selvaraj mit Sitz in Berlin, Deutschland. Wenn du Truffle nutzt, ist Hariharan Selvaraj der für deine personenbezogenen Daten Verantwortliche im Sinne der DSGVO.',
            contactPrefix: 'Kontakt:',
          },
          whatWeCollect: {
            heading: 'Welche Daten wir erheben',
            items: [
              {
                title: 'Deine E-Mail-Adresse',
                desc: 'Zum Anlegen deines Kontos und zur Anmeldung per Anmeldelink. Wir speichern niemals ein Passwort.',
              },
              {
                title: 'Von dir erfasste Buchungen',
                desc: 'Die Ausgabendaten, die du eingibst, per CSV importierst oder aus Belegen auslesen lässt. Sie sind der Kern des Dienstes.',
              },
              {
                title: 'Sprachaufnahmen',
                desc: 'Nur aufgezeichnet, wenn du die Spracheingabe nutzt, zur Transkription an Groq (Whisper) gesendet und nach der Verarbeitung nicht gespeichert.',
              },
              {
                title: 'Belegfotos und PDFs',
                desc: 'Nur zum Auslesen hochgeladen. Die erkannten Buchungsdaten werden gespeichert, die Originaldatei nicht.',
              },
              {
                title: 'Nutzungsanalyse',
                desc: 'Anonymisierte Ereignisdaten über PostHog, um zu verstehen, wie Funktionen genutzt werden. Personenbezogene Daten sind nicht enthalten.',
              },
            ],
          },
          whatWeDoNotCollect: {
            heading: 'Was wir NICHT erheben',
            items: [
              'Bankzugangsdaten oder Kontonummern – es gibt keine Bankanbindung.',
              'Zahlungskartendaten – Zahlungen (sobald Pro startet) laufen vollständig über Stripe.',
              'Daten von Drittanbietern oder Datenhändlern.',
              'Daten von Personen, die sich nicht registriert haben.',
            ],
          },
          howWeUse: {
            heading: 'Wie wir deine Daten verwenden',
            intro: 'Deine Daten werden ausschließlich verwendet, um dir den Dienst Truffle bereitzustellen:',
            items: [
              'Um deine Fragen im KI-Chat zu beantworten (dein Buchungsverlauf wird dem KI-Modell als Kontext übergeben).',
              'Für Ausgabenanalysen, Prognosen und das Erkennen von Auffälligkeiten.',
              'Für proaktive Hinweise zu deinen Sparzielen und Gewohnheiten.',
              'Damit du deine eigenen Daten exportieren kannst.',
            ],
            outro:
              'Wir verkaufen deine Daten nicht, geben sie nicht für Werbung weiter und verwenden sie nicht zum Trainieren von KI-Modellen.',
          },
          thirdParty: {
            heading: 'Dienste Dritter',
            intro: 'Für den Betrieb des Dienstes setzen wir folgende Auftragsverarbeiter ein:',
            items: [
              { name: 'Supabase', desc: 'Datenbank und Anmeldung (Region EU).' },
              { name: 'Google Gemini', desc: 'KI-Modell für Chat und Analysen.' },
              { name: 'Groq / Whisper', desc: 'Transkription von Spracheingaben.' },
              { name: 'PostHog', desc: 'Anonymisierte Produktanalyse.' },
              { name: 'Vercel', desc: 'Hosting und Bereitstellung (EU-Edge, wo verfügbar).' },
              { name: 'Cloudflare Turnstile', desc: 'Schutz vor Bots im Anmeldeformular.' },
            ],
          },
          gdprRights: {
            heading: 'Deine Rechte nach der DSGVO',
            intro: 'Als Nutzer:in in der EU hast du das Recht auf:',
            items: [
              { right: 'Auskunft', desc: 'Eine Kopie aller Daten, die wir über dich speichern.' },
              { right: 'Berichtigung', desc: 'Korrektur unrichtiger Daten.' },
              { right: 'Löschung', desc: 'Löschen deines Kontos und aller zugehörigen Daten.' },
              {
                right: 'Datenübertragbarkeit',
                desc: 'Export deiner Buchungsdaten als CSV direkt in der App.',
              },
              {
                right: 'Widerspruch',
                desc: 'Widerspruch gegen jede Verarbeitung auf Grundlage berechtigter Interessen.',
              },
            ],
            outro:
              'Um eines dieser Rechte auszuüben, schreib an {email}. Wir antworten innerhalb von 30 Tagen.',
          },
          retention: {
            heading: 'Speicherdauer',
            body: 'Deine Daten werden gespeichert, solange dein Konto aktiv ist. Wenn du dein Konto löschst, werden alle zugehörigen Daten innerhalb von 30 Tagen endgültig gelöscht. Anonymisierte Analysedaten (die nicht auf dich zurückgeführt werden können) können zur Verbesserung des Produkts aufbewahrt werden.',
          },
          changes: {
            heading: 'Änderungen dieser Erklärung',
            body: 'Wenn wir diese Erklärung wesentlich ändern, informieren wir dich per E-Mail, bevor die Änderungen wirksam werden. Nutzt du Truffle nach diesem Zeitpunkt weiter, gilt das als Zustimmung zur aktualisierten Erklärung.',
          },
          contact: {
            heading: 'Kontakt',
            body: 'Fragen oder Beschwerden? {email}. Du hast außerdem das Recht, dich bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit zu beschweren.',
          },
        },
      },
      terms: {
        pageTitle: 'Nutzungsbedingungen',
        eyebrow: 'Rechtliches · Nutzungsbedingungen',
        headline: 'Bedingungen, einzeln aufgeführt.',
        summary:
          'Kurz gesagt: Truffle hilft dir, den Überblick über dein eigenes Geld zu behalten. Es ist keine Finanzberatung, deine Daten gehören dir, und du kannst jederzeit gehen.',
        sections: {
          whoApplies: {
            heading: '1. Für wen diese Bedingungen gelten',
            body: 'Diese Nutzungsbedingungen („Bedingungen“) regeln deine Nutzung von Truffle, einem persönlichen Finanzassistenten, betrieben von Hariharan Selvaraj, Berlin, Deutschland („wir“, „uns“, „Truffle“). Mit dem Anlegen eines Kontos stimmst du diesen Bedingungen zu. Wenn du nicht zustimmst, nutze den Dienst bitte nicht.',
          },
          whatTruffleIs: {
            heading: '2. Was Truffle ist',
            body: 'Truffle ist ein Werkzeug zum Erfassen deiner Finanzen mit KI-Chat. Es hilft dir, Ausgaben festzuhalten, Sparziele zu setzen und Fragen zu deinen eigenen Finanzdaten zu stellen.',
            notAdvisorLabel: 'Truffle ist keine Finanzberatung.',
            notAdvisorBody:
              'Nichts in Truffle stellt eine Finanz-, Anlage-, Steuer- oder Rechtsberatung dar. Alle Analysen, Prognosen und Vorschläge beruhen ausschließlich auf den Daten, die du eingibst, und dienen nur zur Information. Triff finanzielle Entscheidungen nach eigenem Ermessen und, wo angebracht, mit fachkundiger Beratung.',
          },
          yourAccount: {
            heading: '3. Dein Konto',
            items: [
              'Du musst mindestens 18 Jahre alt sein, um Truffle zu nutzen.',
              'Du bist dafür verantwortlich, deine Anmelde-E-Mails privat und dein Konto sicher zu halten.',
              'Du bist für alle Aktivitäten unter deinem Konto verantwortlich.',
              'Ein Konto pro Person. Lege keine Konten für andere ohne deren Wissen an.',
            ],
          },
          plans: {
            heading: '4. Tarife Free und Pro',
            body: 'Truffle ist mit bestimmten Grenzen kostenlos nutzbar (aktuelle Details auf der {pricingLink}). Ein Pro-Tarif ist in Entwicklung und wird zum Start 9 €/Monat kosten.',
            pricingLinkLabel: 'Preisseite',
            body2:
              'Wir behalten uns vor, Tarifgrenzen und Preise zu ändern. Preiserhöhungen kündigen wir bestehenden zahlenden Abonnent:innen mindestens 30 Tage vor ihrem Wirksamwerden an.',
          },
          yourData: {
            heading: '5. Deine Daten',
            body: 'Die Daten, die du in Truffle eingibst, gehören dir. Wir beanspruchen keine Rechte an deinen Buchungen, Zielen oder sonstigen persönlichen Daten. Du kannst deine Daten jederzeit exportieren oder löschen.',
            privacyLinkLabel: 'Datenschutzerklärung',
            body2: 'Alle Details zum Umgang mit deinen Daten findest du in unserer {privacyLink}.',
          },
          acceptableUse: {
            heading: '6. Zulässige Nutzung',
            intro: 'Du verpflichtest dich, Folgendes zu unterlassen:',
            items: [
              'Truffle für rechtswidrige Zwecke zu nutzen.',
              'Zu versuchen, auf Daten anderer Nutzer:innen zuzugreifen.',
              'Die API zurückzuentwickeln, auszulesen oder zu missbrauchen.',
              'Den Dienst ohne deren Einwilligung zur Verarbeitung von Daten anderer zu nutzen.',
              'Falsche Angaben zu deiner Identität zu machen oder dich als andere Person auszugeben.',
            ],
          },
          availability: {
            heading: '7. Verfügbarkeit',
            body: 'Wir bemühen uns, Truffle verfügbar zu halten, garantieren aber keine Verfügbarkeit. Der Dienst wird „wie besehen“ bereitgestellt. Wir können Funktionen jederzeit ändern, aussetzen oder einstellen, werden bei wesentlichen Änderungen aber versuchen, angemessen vorab zu informieren.',
          },
          liability: {
            heading: '8. Haftungsbeschränkung',
            body: 'Soweit gesetzlich zulässig, haftet Truffle nicht für mittelbare, zufällige oder Folgeschäden aus der Nutzung des Dienstes – einschließlich finanzieller Verluste aus Entscheidungen, die du auf Grundlage der Ausgaben von Truffle triffst.',
          },
          termination: {
            heading: '9. Kündigung',
            body: 'Du kannst dein Konto jederzeit in den Einstellungen löschen. Wir können Konten sperren oder kündigen, die gegen diese Bedingungen verstoßen. Bei Kündigung werden deine Daten gemäß unserer Datenschutzerklärung gelöscht.',
          },
          governingLaw: {
            heading: '10. Anwendbares Recht',
            body: 'Diese Bedingungen unterliegen dem Recht der Bundesrepublik Deutschland. Ausschließlicher Gerichtsstand für Streitigkeiten ist Berlin, Deutschland, sofern zwingende Verbraucherschutzvorschriften deines Wohnsitzlandes nichts anderes vorsehen.',
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
