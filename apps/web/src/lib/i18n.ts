export type Locale = 'en' | 'de'

export interface Translations {
  auth: {
    tagline: string
    emailPlaceholder: string
    continueWithEmail: string
    sending: string
    footer: string
    checkEmail: string
    magicLinkSent: (email: string) => string
  }
  onboarding: {
    heading: string
    subtitle: string
    nameLabel: string
    namePlaceholder: string
    currencyLabel: string
    saving: string
    continue: string
    errorSave: string
    languageLabel: string
  }
  tour: {
    steps: Array<{ emoji: string; title: string; body: string }>
    next: string
    letsGo: string
    skip: string
  }
  settings: {
    title: string
    yourData: string
    downloadData: string
    downloadDataDesc: string
    exportData: string
    preparing: string
    dangerZone: string
    deleteAccount: string
    deleteAccountDesc: string
    deletePlaceholder: string
    deleteConfirmWord: string
    deleting: string
    deleteMyAccount: string
    deleteError: string
    language: string
    currency: string
  }
  dashboard: {
    goodMorning: string
    goodAfternoon: string
    goodEvening: string
    recent: string
    scan: string
    csv: string
    add: string
    cancel: string
    signOut: string
    settingsLabel: string
  }
  nav: {
    home: string
    chat: string
    insights: string
  }
  home: {
    authExpiredError: string
  }
  categories: Record<string, string>
  addTransaction: {
    title: string
    expense: string
    income: string
    descriptionPlaceholder: string
    saving: string
    add: string
    saveOffline: string
    savedOffline: string
    savedOfflineDesc: string
  }
  transactions: {
    noTransactions: string
    noTransactionsHint: string
    fromCache: string
    filteredCount: (filtered: number, total: number) => string
    count: (n: number) => string
    clear: string
    exportCSV: string
    noMatching: string
    noThisMonth: string
    loadMonth: (label: string) => string
    deleteConfirm: string
    cancel: string
    delete: string
    descriptionPlaceholder: string
    merchantPlaceholder: string
    save: string
  }
  csvImport: {
    title: string
    hint: string
    tapToSelect: string
    parseError: string
    transactionsFound: (n: number) => string
    selectedOf: (selected: number, total: number) => string
    showLess: string
    showMore: (n: number) => string
    cancel: string
    import: (n: number) => string
    importing: string
    imported: (n: number) => string
    done: string
    importFailed: string
  }
  receiptUpload: {
    title: string
    hint: string
    tapToSelect: string
    fileTypes: string
    invalidFile: string
    fileTooLarge: (maxMb: number) => string
    changeFile: string
    analysing: string
    extractTransactions: string
    transactionsFound: (n: number) => string
    tryAgain: string
    import: (n: number) => string
    importing: string
    imported: (n: number) => string
    done: string
    noTransactions: string
    parseError: string
    importFailed: string
    somethingWrong: string
  }
  weeklySummary: {
    title: string
    readAloud: string
    playing: string
    spent: (amount: string) => string
    earned: (amount: string) => string
    topCategory: (label: string) => string
  }
  financialBrief: {
    addTransactions: string
    endOfMonth: string
    projectedBalance: string
    current: string
    addForForecast: string
    income: string
    expenses: string
    netBalance: string
    noDataThisMonth: string
    confidence: { high: string; medium: string; low: string }
  }
  filter: {
    searchPlaceholder: string
    filters: string
    all: string
    expenses: string
    income: string
    datePresets: Record<string, string>
  }
  insights: {
    title: string
    monthForecast: string
    addTransactionsForForecast: string
    spendingCalendar: string
    monthlyBudgets: string
    newBudget: string
    savingsGoals: string
    newGoal: string
    savingHabits: string
    recurringSubscriptions: string
    lastCharged: string
    detected: (months: number) => string
    thingsToReview: string
    noUnusualActivity: string
    projectedEndOfMonth: string
    perMonth: string
  }
  savingsGoals: {
    title: string
    newGoal: string
    cancel: string
    noGoals: string
    deadlinePassed: string
    daysLeft: (days: number) => string
    complete: string
    addFunds: string
    add: string
    goalNamePlaceholder: string
    targetAmount: string
    creating: string
    createGoal: string
  }
  savingsHabits: {
    noHabits: string
    periodWeek: string
    periodMonth: string
    totalSaved: (amount: string) => string
    done: string
    log: string
    frequencyWeekly: string
    frequencyMonthly: string
  }
  monthlyBudgets: {
    noBudgets: string
    allCategoriesHaveBudget: string
    over: (amount: string) => string
    left: (amount: string) => string
    budgetLabel: (amount: string) => string
    monthlyLimit: string
    saving: string
    setBudget: string
    removeBudget: string
  }
  offlineBanner: {
    offline: string
    syncing: string
    pendingChanges: (n: number) => string
  }
  cookieBanner: {
    message: string
    accept: string
    reject: string
    privacyLabel: string
  }
  topBar: {
    subtitle: string
    signOut: string
    settingsLabel: string
  }
  chat: {
    holdButton: string
    suggestions: string[]
    typePlaceholder: string
    stop: string
    mute: string
    unmute: string
    failedToSend: string
    resend: string
    offlineMessage: string
    anErrorOccurred: string
  }
  proposals: {
    goal: {
      addToGoals: string
      noThanks: string
      yesAddIt: string
      saving: string
      error: string
      addedToGoals: (emoji: string, name: string) => string
    }
    transaction: {
      logThis: string
      noThanks: string
      add: string
      saving: string
      error: string
    }
    habit: {
      weeklyLabel: string
      monthlyLabel: string
      logEachPeriod: (period: string) => string
      notNow: string
      startSaving: string
      settingUp: string
      error: string
    }
  }
  offline: {
    title: string
    description: string
    tryAgain: string
  }
}

export const translations: Record<Locale, Translations> = {
  en: {
    auth: {
      tagline: 'Your finances, unearthed.',
      emailPlaceholder: 'your@email.com',
      continueWithEmail: 'Continue with email',
      sending: 'Sending...',
      footer: 'Sign in with a magic link · No password needed',
      checkEmail: 'Check your email',
      magicLinkSent: (email) =>
        `We sent a magic link to ${email}. Click it to sign in — no password needed.`,
    },
    onboarding: {
      heading: 'Welcome to Truffle',
      subtitle: "Let's get you set up in 30 seconds.",
      nameLabel: 'What should we call you?',
      namePlaceholder: 'Your first name',
      currencyLabel: 'Your currency',
      saving: 'Saving...',
      continue: 'Continue →',
      errorSave: 'Failed to save your details — please try again.',
      languageLabel: 'Language',
    },
    tour: {
      steps: [
        {
          emoji: '💬',
          title: 'Chat naturally',
          body: "Just talk to Truffle like you'd text a friend. Ask how you're doing, log an expense, or get advice — voice or text.",
        },
        {
          emoji: '💶',
          title: 'Track every euro',
          body: 'Every transaction is automatically categorised. Add by chat, CSV import, or snap a receipt.',
        },
        {
          emoji: '🔔',
          title: 'Get smart nudges',
          body: 'Truffle watches for budget overruns, unusual spends, and saving streaks — and tells you before things go sideways.',
        },
      ],
      next: 'Next',
      letsGo: "Let's go →",
      skip: 'Skip tour',
    },
    settings: {
      title: 'Settings',
      yourData: 'Your data',
      downloadData: 'Download all my data',
      downloadDataDesc: 'Transactions, goals, budgets, and habits exported as JSON',
      exportData: 'Export data',
      preparing: 'Preparing…',
      dangerZone: 'Danger zone',
      deleteAccount: 'Delete account',
      deleteAccountDesc: 'Permanently deletes all your data. This cannot be undone.',
      deletePlaceholder: 'Type "DELETE" to confirm',
      deleteConfirmWord: 'DELETE',
      deleting: 'Deleting…',
      deleteMyAccount: 'Delete my account',
      deleteError: 'Failed to delete account. Please try again.',
      language: 'Language',
      currency: 'Currency',
    },
    dashboard: {
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      recent: 'Recent',
      scan: 'Scan',
      csv: 'CSV',
      add: '+ Add',
      cancel: 'Cancel',
      signOut: 'Sign out',
      settingsLabel: 'Settings',
    },
    nav: {
      home: 'Home',
      chat: 'Chat',
      insights: 'Insights',
    },
    home: {
      authExpiredError: 'Sign-in link expired or already used. Please request a new one.',
    },
    categories: {
      food_groceries: 'Groceries',
      food_delivery: 'Food Delivery',
      transport: 'Transport',
      housing: 'Housing',
      utilities: 'Utilities',
      subscriptions: 'Subscriptions',
      health: 'Health',
      entertainment: 'Entertainment',
      shopping: 'Shopping',
      income: 'Income',
      savings: 'Savings',
      other: 'Other',
    },
    addTransaction: {
      title: 'Add Transaction',
      expense: 'Expense',
      income: 'Income',
      descriptionPlaceholder: 'Description (e.g. Coffee at Rewe)',
      saving: 'Saving...',
      add: 'Add Transaction',
      saveOffline: 'Save Offline',
      savedOffline: 'Saved offline',
      savedOfflineDesc: "Will sync when you're back online.",
    },
    transactions: {
      noTransactions: 'No transactions yet.',
      noTransactionsHint: 'Add one below to get started.',
      fromCache: 'Showing cached data',
      filteredCount: (filtered, total) => `${filtered} of ${total} transactions`,
      count: (n) => `${n} transactions`,
      clear: 'Clear',
      exportCSV: 'Export CSV',
      noMatching: 'No matching transactions.',
      noThisMonth: 'No transactions this month yet.',
      loadMonth: (label) => `Load ${label}`,
      deleteConfirm: 'Delete this transaction?',
      cancel: 'Cancel',
      delete: 'Delete',
      descriptionPlaceholder: 'Description',
      merchantPlaceholder: 'Merchant (optional)',
      save: 'Save',
    },
    csvImport: {
      title: 'Import CSV',
      hint: 'date, description, amount',
      tapToSelect: 'Tap to select a CSV file',
      parseError:
        'Could not parse the CSV. Make sure it has date, description, and amount columns.',
      transactionsFound: (n) =>
        `${n} transaction${n !== 1 ? 's' : ''} found — select which to import`,
      selectedOf: (selected, total) => `${selected} of ${total} selected`,
      showLess: 'Show less',
      showMore: (n) => `+${n} more`,
      cancel: 'Cancel',
      import: (n) => `Import ${n}`,
      importing: 'Importing…',
      imported: (n) => `${n} transaction${n !== 1 ? 's' : ''} imported`,
      done: 'Done',
      importFailed: 'Import failed. Please try again.',
    },
    receiptUpload: {
      title: 'Scan receipt / statement',
      hint: 'image or PDF',
      tapToSelect: 'Tap to select a receipt or bank statement',
      fileTypes: 'JPEG · PNG · WEBP · PDF',
      invalidFile: 'Please choose an image (JPEG, PNG, WEBP) or a PDF.',
      fileTooLarge: (maxMb) => `File is too large — maximum size is ${maxMb} MB.`,
      changeFile: 'Change file',
      analysing: 'Analysing…',
      extractTransactions: 'Extract transactions',
      transactionsFound: (n) =>
        `${n} transaction${n !== 1 ? 's' : ''} found — review before importing`,
      tryAgain: 'Try again',
      import: (n) => `Import ${n}`,
      importing: 'Importing…',
      imported: (n) => `${n} transaction${n !== 1 ? 's' : ''} imported`,
      done: 'Done',
      noTransactions: 'No transactions found. Make sure the receipt or statement is legible.',
      parseError: 'Could not parse the file. Try a clearer image.',
      importFailed: 'Import failed. Please try again.',
      somethingWrong: 'Something went wrong. Please try again.',
    },
    weeklySummary: {
      title: 'Weekly summary',
      readAloud: 'Read aloud',
      playing: 'Playing…',
      spent: (amount) => `This week you spent ${amount}`,
      earned: (amount) => ` and earned ${amount}`,
      topCategory: (label) => `. Most went on ${label}.`,
    },
    financialBrief: {
      addTransactions: 'Add some transactions to see your financial brief',
      endOfMonth: 'End of Month',
      projectedBalance: 'projected balance',
      current: 'Current',
      addForForecast: 'Add a transaction for this month to see your forecast',
      income: 'Income',
      expenses: 'Expenses',
      netBalance: 'net balance',
      noDataThisMonth: 'no data this month',
      confidence: { high: 'high confidence', medium: 'medium confidence', low: 'low confidence' },
    },
    filter: {
      searchPlaceholder: 'Search transactions…',
      filters: 'Filters',
      all: 'All',
      expenses: 'Expenses',
      income: 'Income',
      datePresets: {
        all: 'All time',
        week: 'This week',
        month: 'This month',
        last_month: 'Last month',
        '3months': '3 months',
      },
    },
    insights: {
      title: 'Insights',
      monthForecast: 'Month Forecast',
      addTransactionsForForecast: 'Add transactions to see your forecast',
      spendingCalendar: 'Spending Calendar',
      monthlyBudgets: 'Monthly Budgets',
      newBudget: '+ New budget',
      savingsGoals: 'Savings Goals',
      newGoal: '+ New goal',
      savingHabits: 'Saving Habits',
      recurringSubscriptions: 'Recurring Subscriptions',
      lastCharged: 'Last charged',
      detected: (months) => `detected ${months} month${months !== 1 ? 's' : ''}`,
      thingsToReview: 'Things to Review',
      noUnusualActivity: 'No unusual activity detected',
      projectedEndOfMonth: 'Projected end of month',
      perMonth: '/mo',
    },
    savingsGoals: {
      title: 'Savings Goals',
      newGoal: '+ New goal',
      cancel: 'Cancel',
      noGoals: 'No goals yet — set one to start saving towards something',
      deadlinePassed: 'deadline passed',
      daysLeft: (days) => `${days}d left`,
      complete: 'Complete!',
      addFunds: '+ Add funds',
      add: 'Add',
      goalNamePlaceholder: 'Goal name (e.g. Amsterdam trip)',
      targetAmount: 'Target amount',
      creating: 'Creating…',
      createGoal: 'Create goal',
    },
    savingsHabits: {
      noHabits: 'No saving habits yet — ask Truffle to set one up',
      periodWeek: 'week',
      periodMonth: 'month',
      totalSaved: (amount) => `${amount} total saved`,
      done: '✓ done',
      log: '+ Log',
      frequencyWeekly: 'Weekly',
      frequencyMonthly: 'Monthly',
    },
    monthlyBudgets: {
      noBudgets: 'No budgets yet — set one to track category spending',
      allCategoriesHaveBudget: 'All spendable categories already have a budget.',
      over: (amount) => `${amount} over`,
      left: (amount) => `${amount} left`,
      budgetLabel: (amount) => `budget ${amount}/mo`,
      monthlyLimit: 'Monthly limit',
      saving: 'Saving…',
      setBudget: 'Set budget',
      removeBudget: 'Remove budget',
    },
    offlineBanner: {
      offline: 'Offline — changes will sync when reconnected',
      syncing: 'Syncing…',
      pendingChanges: (n) => `${n} pending change${n > 1 ? 's' : ''} — tap to sync`,
    },
    cookieBanner: {
      message:
        'We use analytics cookies to understand how Truffle is used and improve the experience.',
      accept: 'Accept',
      reject: 'Reject',
      privacyLabel: 'Privacy Policy',
    },
    topBar: {
      subtitle: 'Ask me anything',
      signOut: 'Sign out',
      settingsLabel: 'Settings',
    },
    chat: {
      holdButton: 'Hold the button and ask anything.',
      suggestions: [
        'How am I doing this month?',
        'What did I spend on food?',
        'Can I afford a weekend trip?',
      ],
      typePlaceholder: 'Or type your question...',
      stop: 'Stop',
      mute: 'Mute voice',
      unmute: 'Unmute voice',
      failedToSend: 'Failed to send',
      resend: 'Resend',
      offlineMessage: 'Offline — messages will be answered when you reconnect',
      anErrorOccurred: 'An error occurred.',
    },
    proposals: {
      goal: {
        addToGoals: 'Add this to your goals?',
        noThanks: 'No thanks',
        yesAddIt: 'Yes, add it',
        saving: 'Saving…',
        error: 'Something went wrong — please try again.',
        addedToGoals: (emoji, name) =>
          `${emoji} ${name} added to your goals — find it in Insights.`,
      },
      transaction: {
        logThis: 'Log this transaction?',
        noThanks: 'No thanks',
        add: 'Add',
        saving: 'Saving…',
        error: 'Something went wrong — please try again.',
      },
      habit: {
        weeklyLabel: 'Weekly saving habit',
        monthlyLabel: 'Monthly saving habit',
        logEachPeriod: (period) => `You log each ${period} yourself in Insights`,
        notNow: 'Not now',
        startSaving: 'Start saving',
        settingUp: 'Setting up…',
        error: 'Something went wrong — please try again.',
      },
    },
    offline: {
      title: "You're offline",
      description: 'No internet connection detected. Check your connection and try again.',
      tryAgain: 'Try again',
    },
  },

  de: {
    auth: {
      tagline: 'Deine Finanzen, ans Licht gebracht.',
      emailPlaceholder: 'deine@email.de',
      continueWithEmail: 'Mit E-Mail fortfahren',
      sending: 'Wird gesendet...',
      footer: 'Anmeldung per Magic-Link · Kein Passwort nötig',
      checkEmail: 'Überprüfe deine E-Mails',
      magicLinkSent: (email) =>
        `Wir haben einen Magic-Link an ${email} gesendet. Klicke darauf, um dich anzumelden — kein Passwort nötig.`,
    },
    onboarding: {
      heading: 'Willkommen bei Truffle',
      subtitle: 'Lass dich in 30 Sekunden einrichten.',
      nameLabel: 'Wie sollen wir dich nennen?',
      namePlaceholder: 'Dein Vorname',
      currencyLabel: 'Deine Währung',
      saving: 'Wird gespeichert...',
      continue: 'Weiter →',
      errorSave: 'Details konnten nicht gespeichert werden — bitte erneut versuchen.',
      languageLabel: 'Sprache',
    },
    tour: {
      steps: [
        {
          emoji: '💬',
          title: 'Natürlich chatten',
          body: 'Sprich einfach mit Truffle, wie du einem Freund schreiben würdest. Frag wie es läuft, erfasse eine Ausgabe oder hol dir Ratschläge — per Sprache oder Text.',
        },
        {
          emoji: '💶',
          title: 'Jeden Euro verfolgen',
          body: 'Jede Transaktion wird automatisch kategorisiert. Hinzufügen per Chat, CSV-Import oder Kassenbon fotografieren.',
        },
        {
          emoji: '🔔',
          title: 'Smarte Hinweise erhalten',
          body: 'Truffle achtet auf Budgetüberschreitungen, ungewöhnliche Ausgaben und Sparsträhnen — und informiert dich, bevor es schiefläuft.',
        },
      ],
      next: 'Weiter',
      letsGo: "Los geht's →",
      skip: 'Tour überspringen',
    },
    settings: {
      title: 'Einstellungen',
      yourData: 'Deine Daten',
      downloadData: 'Alle meine Daten herunterladen',
      downloadDataDesc: 'Transaktionen, Ziele, Budgets und Gewohnheiten als JSON exportiert',
      exportData: 'Daten exportieren',
      preparing: 'Wird vorbereitet…',
      dangerZone: 'Gefahrenzone',
      deleteAccount: 'Konto löschen',
      deleteAccountDesc:
        'Löscht alle deine Daten dauerhaft. Dies kann nicht rückgängig gemacht werden.',
      deletePlaceholder: 'Tippe "LÖSCHEN" zur Bestätigung',
      deleteConfirmWord: 'LÖSCHEN',
      deleting: 'Wird gelöscht…',
      deleteMyAccount: 'Mein Konto löschen',
      deleteError: 'Konto konnte nicht gelöscht werden. Bitte erneut versuchen.',
      language: 'Sprache',
      currency: 'Währung',
    },
    dashboard: {
      goodMorning: 'Guten Morgen',
      goodAfternoon: 'Guten Tag',
      goodEvening: 'Guten Abend',
      recent: 'Zuletzt',
      scan: 'Scannen',
      csv: 'CSV',
      add: '+ Hinzufügen',
      cancel: 'Abbrechen',
      signOut: 'Abmelden',
      settingsLabel: 'Einstellungen',
    },
    nav: {
      home: 'Start',
      chat: 'Chat',
      insights: 'Einblicke',
    },
    home: {
      authExpiredError:
        'Anmelde-Link abgelaufen oder bereits verwendet. Bitte einen neuen anfordern.',
    },
    categories: {
      food_groceries: 'Lebensmittel',
      food_delivery: 'Lieferservice',
      transport: 'Transport',
      housing: 'Wohnen',
      utilities: 'Nebenkosten',
      subscriptions: 'Abonnements',
      health: 'Gesundheit',
      entertainment: 'Unterhaltung',
      shopping: 'Einkaufen',
      income: 'Einkommen',
      savings: 'Ersparnisse',
      other: 'Sonstiges',
    },
    addTransaction: {
      title: 'Transaktion hinzufügen',
      expense: 'Ausgabe',
      income: 'Einnahme',
      descriptionPlaceholder: 'Beschreibung (z.B. Kaffee bei Rewe)',
      saving: 'Wird gespeichert...',
      add: 'Transaktion hinzufügen',
      saveOffline: 'Offline speichern',
      savedOffline: 'Offline gespeichert',
      savedOfflineDesc: 'Wird synchronisiert, sobald du wieder online bist.',
    },
    transactions: {
      noTransactions: 'Noch keine Transaktionen.',
      noTransactionsHint: 'Füge unten eine hinzu, um zu beginnen.',
      fromCache: 'Zeige zwischengespeicherte Daten',
      filteredCount: (filtered, total) => `${filtered} von ${total} Transaktionen`,
      count: (n) => `${n} Transaktionen`,
      clear: 'Zurücksetzen',
      exportCSV: 'CSV exportieren',
      noMatching: 'Keine passenden Transaktionen.',
      noThisMonth: 'Noch keine Transaktionen diesen Monat.',
      loadMonth: (label) => `${label} laden`,
      deleteConfirm: 'Diese Transaktion löschen?',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      descriptionPlaceholder: 'Beschreibung',
      merchantPlaceholder: 'Händler (optional)',
      save: 'Speichern',
    },
    csvImport: {
      title: 'CSV importieren',
      hint: 'Datum, Beschreibung, Betrag',
      tapToSelect: 'Tippe, um eine CSV-Datei auszuwählen',
      parseError:
        'CSV konnte nicht gelesen werden. Stelle sicher, dass sie Spalten für Datum, Beschreibung und Betrag enthält.',
      transactionsFound: (n) =>
        `${n} Transaktion${n !== 1 ? 'en' : ''} gefunden — wähle die zu importierenden aus`,
      selectedOf: (selected, total) => `${selected} von ${total} ausgewählt`,
      showLess: 'Weniger anzeigen',
      showMore: (n) => `+${n} weitere`,
      cancel: 'Abbrechen',
      import: (n) => `${n} importieren`,
      importing: 'Wird importiert…',
      imported: (n) => `${n} Transaktion${n !== 1 ? 'en' : ''} importiert`,
      done: 'Fertig',
      importFailed: 'Import fehlgeschlagen. Bitte erneut versuchen.',
    },
    receiptUpload: {
      title: 'Kassenbon / Kontoauszug scannen',
      hint: 'Bild oder PDF',
      tapToSelect: 'Tippe, um einen Kassenbon oder Kontoauszug auszuwählen',
      fileTypes: 'JPEG · PNG · WEBP · PDF',
      invalidFile: 'Bitte wähle ein Bild (JPEG, PNG, WEBP) oder ein PDF.',
      fileTooLarge: (maxMb) => `Datei zu groß — maximale Größe ist ${maxMb} MB.`,
      changeFile: 'Datei wechseln',
      analysing: 'Wird analysiert…',
      extractTransactions: 'Transaktionen extrahieren',
      transactionsFound: (n) =>
        `${n} Transaktion${n !== 1 ? 'en' : ''} gefunden — vor dem Import prüfen`,
      tryAgain: 'Erneut versuchen',
      import: (n) => `${n} importieren`,
      importing: 'Wird importiert…',
      imported: (n) => `${n} Transaktion${n !== 1 ? 'en' : ''} importiert`,
      done: 'Fertig',
      noTransactions: 'Keine Transaktionen gefunden. Stelle sicher, dass der Beleg lesbar ist.',
      parseError: 'Datei konnte nicht gelesen werden. Versuche ein klareres Bild.',
      importFailed: 'Import fehlgeschlagen. Bitte erneut versuchen.',
      somethingWrong: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.',
    },
    weeklySummary: {
      title: 'Wochenzusammenfassung',
      readAloud: 'Vorlesen',
      playing: 'Wird abgespielt…',
      spent: (amount) => `Diese Woche hast du ${amount} ausgegeben`,
      earned: (amount) => ` und ${amount} eingenommen`,
      topCategory: (label) => `. Der größte Teil entfiel auf ${label}.`,
    },
    financialBrief: {
      addTransactions: 'Füge Transaktionen hinzu, um deine Finanzübersicht zu sehen',
      endOfMonth: 'Monatsende',
      projectedBalance: 'voraussichtliches Guthaben',
      current: 'Aktuell',
      addForForecast: 'Füge eine Transaktion für diesen Monat hinzu, um deine Prognose zu sehen',
      income: 'Einnahmen',
      expenses: 'Ausgaben',
      netBalance: 'Nettosaldo',
      noDataThisMonth: 'keine Daten diesen Monat',
      confidence: {
        high: 'hohe Konfidenz',
        medium: 'mittlere Konfidenz',
        low: 'niedrige Konfidenz',
      },
    },
    filter: {
      searchPlaceholder: 'Transaktionen suchen…',
      filters: 'Filter',
      all: 'Alle',
      expenses: 'Ausgaben',
      income: 'Einnahmen',
      datePresets: {
        all: 'Gesamte Zeit',
        week: 'Diese Woche',
        month: 'Diesen Monat',
        last_month: 'Letzten Monat',
        '3months': '3 Monate',
      },
    },
    insights: {
      title: 'Einblicke',
      monthForecast: 'Monatsprognose',
      addTransactionsForForecast: 'Füge Transaktionen hinzu, um deine Prognose zu sehen',
      spendingCalendar: 'Ausgabenkalender',
      monthlyBudgets: 'Monatsbudgets',
      newBudget: '+ Neues Budget',
      savingsGoals: 'Sparziele',
      newGoal: '+ Neues Ziel',
      savingHabits: 'Spargewohnheiten',
      recurringSubscriptions: 'Wiederkehrende Abonnements',
      lastCharged: 'Zuletzt abgebucht',
      detected: (months) => `${months} Monat${months !== 1 ? 'e' : ''} erkannt`,
      thingsToReview: 'Zu überprüfen',
      noUnusualActivity: 'Keine ungewöhnliche Aktivität erkannt',
      projectedEndOfMonth: 'Voraussichtliches Monatsende',
      perMonth: '/Monat',
    },
    savingsGoals: {
      title: 'Sparziele',
      newGoal: '+ Neues Ziel',
      cancel: 'Abbrechen',
      noGoals: 'Noch keine Ziele — lege eines fest, um auf etwas hinzusparen',
      deadlinePassed: 'Frist abgelaufen',
      daysLeft: (days) => `noch ${days} Tage`,
      complete: 'Abgeschlossen!',
      addFunds: '+ Einzahlen',
      add: 'Hinzufügen',
      goalNamePlaceholder: 'Zielname (z.B. Amsterdamreise)',
      targetAmount: 'Zielbetrag',
      creating: 'Wird erstellt…',
      createGoal: 'Ziel erstellen',
    },
    savingsHabits: {
      noHabits: 'Noch keine Spargewohnheiten — bitte Truffle, eine einzurichten',
      periodWeek: 'Woche',
      periodMonth: 'Monat',
      totalSaved: (amount) => `${amount} insgesamt gespart`,
      done: '✓ erledigt',
      log: '+ Buchen',
      frequencyWeekly: 'Wöchentlich',
      frequencyMonthly: 'Monatlich',
    },
    monthlyBudgets: {
      noBudgets: 'Noch keine Budgets — lege eines fest, um Ausgaben zu verfolgen',
      allCategoriesHaveBudget: 'Alle Ausgabenkategorien haben bereits ein Budget.',
      over: (amount) => `${amount} überschritten`,
      left: (amount) => `${amount} übrig`,
      budgetLabel: (amount) => `Budget ${amount}/Monat`,
      monthlyLimit: 'Monatslimit',
      saving: 'Wird gespeichert…',
      setBudget: 'Budget festlegen',
      removeBudget: 'Budget entfernen',
    },
    offlineBanner: {
      offline: 'Offline — Änderungen werden synchronisiert, wenn du wieder verbunden bist',
      syncing: 'Wird synchronisiert…',
      pendingChanges: (n) =>
        `${n} ausstehende Änderung${n > 1 ? 'en' : ''} — tippe zum Synchronisieren`,
    },
    cookieBanner: {
      message:
        'Wir verwenden Analyse-Cookies, um zu verstehen, wie Truffle genutzt wird, und die Erfahrung zu verbessern.',
      accept: 'Akzeptieren',
      reject: 'Ablehnen',
      privacyLabel: 'Datenschutzerklärung',
    },
    topBar: {
      subtitle: 'Frag mich alles',
      signOut: 'Abmelden',
      settingsLabel: 'Einstellungen',
    },
    chat: {
      holdButton: 'Halte die Taste gedrückt und frag alles.',
      suggestions: [
        'Wie läuft es diesen Monat?',
        'Was habe ich für Essen ausgegeben?',
        'Kann ich mir ein Wochenendtrip leisten?',
      ],
      typePlaceholder: 'Oder tippe deine Frage...',
      stop: 'Stopp',
      mute: 'Ton aus',
      unmute: 'Ton an',
      failedToSend: 'Senden fehlgeschlagen',
      resend: 'Erneut senden',
      offlineMessage: 'Offline — Nachrichten werden beantwortet, wenn du wieder verbunden bist',
      anErrorOccurred: 'Ein Fehler ist aufgetreten.',
    },
    proposals: {
      goal: {
        addToGoals: 'Zu deinen Zielen hinzufügen?',
        noThanks: 'Nein danke',
        yesAddIt: 'Ja, hinzufügen',
        saving: 'Wird gespeichert…',
        error: 'Etwas ist schiefgelaufen — bitte erneut versuchen.',
        addedToGoals: (emoji, name) =>
          `${emoji} ${name} zu deinen Zielen hinzugefügt — zu finden unter Einblicke.`,
      },
      transaction: {
        logThis: 'Diese Transaktion erfassen?',
        noThanks: 'Nein danke',
        add: 'Hinzufügen',
        saving: 'Wird gespeichert…',
        error: 'Etwas ist schiefgelaufen — bitte erneut versuchen.',
      },
      habit: {
        weeklyLabel: 'Wöchentliche Spargewohnheit',
        monthlyLabel: 'Monatliche Spargewohnheit',
        logEachPeriod: (period) => `Du buchst jede ${period} selbst unter Einblicke`,
        notNow: 'Nicht jetzt',
        startSaving: 'Sparen beginnen',
        settingUp: 'Wird eingerichtet…',
        error: 'Etwas ist schiefgelaufen — bitte erneut versuchen.',
      },
    },
    offline: {
      title: 'Du bist offline',
      description:
        'Keine Internetverbindung erkannt. Überprüfe deine Verbindung und versuche es erneut.',
      tryAgain: 'Erneut versuchen',
    },
  },
}

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
}
