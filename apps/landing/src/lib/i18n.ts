export type Locale = 'en'

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
  cookieBanner: {
    message: string
    accept: string
    reject: string
    privacyLabel: string
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
        'You spent €200 on food this week — €23 over last week. Most of it was food delivery (5 orders) and groceries (2 visits).',
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
        {
          title: 'Subscription Tracker',
          desc: 'Truffle spots recurring charges automatically and flags the ones you forgot about — before they quietly drain your account.',
        },
        {
          title: 'Monthly Budgets',
          desc: 'Set a limit per category. Get a heads-up at 80% before you go over — no spreadsheets, just a gentle nudge.',
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
          'AI chat',
          'Spending insights & heatmap',
          'Savings goals',
          'Savings habits',
          'CSV export',
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
    cookieBanner: {
      message:
        'We use analytics cookies to understand how Truffle is used and improve the experience.',
      accept: 'Accept',
      reject: 'Reject',
      privacyLabel: 'Privacy Policy',
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
}

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
}
