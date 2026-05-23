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
  },
}

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
}
