export type Locale = 'en'

export interface Translations {
  auth: {
    tagline: string
    emailPlaceholder: string
    invalidEmail: string
    continueWithEmail: string
    sending: string
    footer: string
    checkEmail: string
    magicLinkSent: (email: string) => string
    demoButton: string
    demoHint: string
    receiptTalk: string
    receiptSee: string
    receiptDread: string
    receiptTotal: string
    receiptCalm: string
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
    voiceLabel: string
    voiceHint: string
    stepOf: (step: number, total: number) => string
    back: string
    voiceHeading: string
    chooseVoice: (name: string) => string
    nowPlaying: (name: string) => string
    tapToHear: string
  }
  tour: {
    steps: Array<{ emoji: string; title: string; body: string }>
    next: string
    letsGo: string
    skip: string
    sample: {
      youSaid: string
      quote: string
      line: string
      today: string
      items: Array<{ name: string; amount: number; meta: string }>
      notices: string
      nudges: Array<{ title: string; body: string; tone: 'warning' | 'accent' }>
    }
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
    voice: string
    voiceDesc: string
    exportFormat: string
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
    statement: string
    balance: string
    spentThisMonth: string
    dailyRate: string
    perDay: string
    forecast: string
    forecastOn: (date: string) => string
    forecastAfter: string
    projectedClose: string
    paceAhead: (month: string) => string
    paceBehind: (month: string) => string
    paceFirst: string
    emptyStatement: string
    welcome: (name: string) => string
    trySaying: string
    trySuggestions: string[]
    scanStatement: string
  }
  voice: {
    holdSpeak: string
    listening: string
    thinking: string
    tapToStop: string
    releaseToPrint: string
    micOff: string
    micOffBody: string
    didntCatch: string
    typeInstead: string
  }
  common: {
    close: string
  }
  nav: {
    home: string
    chat: string
    insights: string
  }
  home: {
    authExpiredError: string
    demoUnavailableError: string
  }
  categories: Record<string, string>
  addTransaction: {
    title: string
    expense: string
    income: string
    descriptionPlaceholder: string
    amountLabel: string
    dateLabel: string
    categoryLabel: string
    saving: string
    add: string
    typeLabel: string
    whatLabel: string
    merchantLabel: string
    optional: string
    more: string
    less: string
    printLog: (amount: string) => string
    overBudget: (category: string, amount: string) => string
    nearBudget: (category: string, pct: number) => string
    error: string
  }
  transactions: {
    noTransactions: string
    noTransactionsHint: string
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
    edit: string
    descriptionPlaceholder: string
    merchantPlaceholder: string
    save: string
    today: string
    credit: string
    editAmount: string
    editCategory: string
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
    rows: (n: number) => string
    mapping: string
    fields: Record<'date' | 'description' | 'amount' | 'category' | 'merchant', string>
    preview: string
    newEntries: string
    skipped: string
    couldntRead: string
    nothingImported: string
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
    resultTitle: string
    retake: string
    total: string
    items: (n: number) => string
    errorTitle: string
    shutter: string
    files: string
  }
  weeklySummary: {
    title: string
    readAloud: string
    playing: string
    spent: (amount: string) => string
    earned: (amount: string) => string
    topCategory: (label: string) => string
    dismiss: string
    weekRecap: (week: number) => string
    stop: string
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
    previousMonth: string
    nextMonth: string
    peak: (day: number, amount: string) => string
    noSpending: string
    low: string
    high: string
    busiest: string
    calEmpty: string
    nothingLogged: string
    sectionsLabel: string
    sections: {
      rev: { code: string; title: string; heading: (n: number) => string }
      cal: { code: string; title: string; heading: string }
      bud: { code: string; title: string; heading: string }
      goal: { code: string; title: string; heading: string }
      hab: { code: string; title: string; heading: string }
      sub: { code: string; title: string; heading: string }
    }
    newItem: string
    monthly: string
    subsEmpty: string
    severity: { high: string; medium: string; low: string }
    anomalyTypes: Record<
      'unusual_amount' | 'forgotten_subscription' | 'category_spike' | 'new_merchant',
      string
    >
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
    remaining: (amount: string) => string
    deleteGoal: string
    deleteConfirm: string
    ofTarget: (saved: string, target: string) => string
    startGoal: string
    noGoalsShort: string
    iconLabel: string
    deadlineLabel: string
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
    streak: (n: number) => string
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
    deleteConfirm: string
    statusOver: string
    statusHeadsUp: string
    statusOnTrack: string
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
    send: string
    stop: string
    mute: string
    unmute: string
    failedToSend: string
    resend: string
    anErrorOccurred: string
    title: string
    voiceLabel: (name: string) => string
    soundOn: string
    soundOff: string
    notice: string
    tallying: string
  }
  proposals: {
    goal: {
      addToGoals: string
      noThanks: string
      yesAddIt: string
      saving: string
      error: string
      addedToGoals: (emoji: string, name: string) => string
      proposed: string
      created: string
      deadline: string
    }
    transaction: {
      logThis: string
      noThanks: string
      add: string
      saving: string
      error: string
      proposed: string
      logged: string
    }
    habit: {
      weeklyLabel: string
      monthlyLabel: string
      logEachPeriod: (period: string) => string
      notNow: string
      startSaving: string
      settingUp: string
      error: string
      proposed: string
      started: string
    }
  }
}

export const translations: Record<Locale, Translations> = {
  en: {
    auth: {
      tagline: 'Your finances, unearthed.',
      emailPlaceholder: 'your@email.com',
      invalidEmail: 'Enter a valid email address.',
      continueWithEmail: 'Continue with email',
      sending: 'Sending...',
      footer: 'Sign in with a magic link · No password needed',
      checkEmail: 'Check your email',
      magicLinkSent: (email) =>
        `We sent a magic link to ${email}. Click it to sign in — no password needed.`,
      demoButton: 'Explore the demo →',
      demoHint: 'A furnished account with sample data. No sign-up.',
      receiptTalk: 'Talk to your money',
      receiptSee: 'See what’s going on',
      receiptDread: 'Dread',
      receiptTotal: 'Total',
      receiptCalm: 'Calm',
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
      voiceLabel: "Truffle's voice",
      voiceHint: 'Tap play to hear each one. You can change this later in Settings.',
      stepOf: (step, total) =>
        `Step ${String(step).padStart(2, '0')} of ${String(total).padStart(2, '0')}`,
      back: 'Back',
      voiceHeading: 'Who reads your receipts out loud?',
      chooseVoice: (name) => `Choose ${name}`,
      nowPlaying: (name) => `Now playing · ${name}`,
      tapToHear: 'Tap ▶ to hear one',
    },
    tour: {
      steps: [
        {
          emoji: '💬',
          title: 'Say it.\nTruffle prints it.',
          body: 'Hold the key and say what you spent, or ask how you’re doing. You’ll get a slip to check before anything is saved.',
        },
        {
          emoji: '💶',
          title: 'Every euro, itemised.',
          body: 'Every transaction is automatically categorised. Add by chat, CSV import, or snap a receipt.',
        },
        {
          emoji: '🔔',
          title: 'Gentle notices. Never a lecture.',
          body: 'Truffle watches for budget overruns, unusual spends, and saving streaks — and tells you before things go sideways.',
        },
      ],
      next: 'Next →',
      letsGo: 'Print my first statement',
      skip: 'Skip',
      sample: {
        youSaid: 'You said',
        quote: 'Forty-five at Lidl, groceries',
        line: 'Lidl · Groceries',
        today: 'Today',
        items: [
          { name: 'Lidl', amount: -45.2, meta: 'Groceries · Today' },
          { name: 'Salary', amount: 3250, meta: 'Income · Mon 20 Oct' },
          { name: 'Leap Card top-up', amount: -20, meta: 'Transport · Mon 20 Oct' },
        ],
        notices: 'Notices',
        nudges: [
          { title: 'Groceries at 80%', body: '€78 left with 10 days to go.', tone: 'warning' },
          { title: '6-week streak', body: 'Save €25 every Friday is still going.', tone: 'accent' },
        ],
      },
    },
    settings: {
      title: 'Preferences',
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
      voice: 'Voice',
      voiceDesc: 'The voice Truffle uses when reading replies aloud.',
      exportFormat: 'JSON →',
    },
    dashboard: {
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      recent: 'Itemised',
      scan: 'Scan / PDF',
      csv: 'Import CSV',
      add: 'Add',
      cancel: 'Cancel',
      signOut: 'Sign out',
      settingsLabel: 'Settings',
      statement: 'Statement',
      balance: 'Net this month',
      spentThisMonth: 'Spent this month',
      dailyRate: 'Daily rate',
      perDay: '/day',
      forecast: 'Forecast',
      forecastOn: (date) => `Forecast ${date}`,
      forecastAfter: 'after 3 days',
      projectedClose: 'Projected close',
      paceAhead: (month) => `That’s a little ahead of ${month}. Nicely done.`,
      paceBehind: (month) => `Running a little above ${month}. Plenty of month left to ease off.`,
      paceFirst: 'Your first month on the statement. It gets sharper as you log.',
      emptyStatement: 'Your statement is blank, and that’s fine. Log one thing and it starts printing.',
      welcome: (name) => (name ? `Welcome, ${name}.` : 'Welcome.'),
      trySaying: 'Try saying',
      trySuggestions: [
        'I spent twelve fifty on lunch',
        'My rent is eleven fifty on the first',
        'How am I doing this month?',
      ],
      scanStatement: 'Scan a statement',
    },
    voice: {
      holdSpeak: 'Hold · Speak',
      listening: 'Listening',
      thinking: 'Thinking',
      tapToStop: 'Tap to stop',
      releaseToPrint: 'Listening · release to print',
      micOff: 'Microphone · off',
      micOffBody: 'I can’t hear you yet. Turn on the mic in your browser settings, or type instead. Everything still works.',
      didntCatch: 'Didn’t quite catch that',
      typeInstead: 'Type instead',
    },
    common: {
      close: 'Close',
    },
    nav: {
      home: 'Home',
      chat: 'Chat',
      insights: 'Insights',
    },
    home: {
      authExpiredError: 'Sign-in link expired or already used. Please request a new one.',
      demoUnavailableError: 'The demo is temporarily unavailable. Please try again in a moment.',
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
      title: 'New entry',
      expense: 'Expense',
      income: 'Income',
      descriptionPlaceholder: 'Coffee, rent…',
      amountLabel: 'Amount',
      dateLabel: 'Date',
      categoryLabel: 'Category',
      saving: 'Saving...',
      add: 'Add Transaction',
      typeLabel: 'Expense or income',
      whatLabel: 'What',
      merchantLabel: 'Merchant',
      optional: 'optional',
      more: '+ More',
      less: '− Less',
      printLog: (amount) => `Print · Log ${amount}`,
      overBudget: (category, amount) => `${category} is over budget · this adds ${amount}`,
      nearBudget: (category, pct) => `${category} would be at ${pct}% of budget`,
      error: 'Couldn’t save that. Please try again.',
    },
    transactions: {
      noTransactions: 'No transactions yet.',
      noTransactionsHint: 'Add one below to get started.',
      filteredCount: (filtered, total) => `${filtered} of ${total} transactions`,
      count: (n) => `${n} transactions`,
      clear: 'Clear',
      exportCSV: 'Export CSV',
      noMatching: 'No matching transactions.',
      noThisMonth: 'No transactions this month yet.',
      loadMonth: (label) => `Load ${label}`,
      deleteConfirm: 'Tear this one off?',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      descriptionPlaceholder: 'Description',
      merchantPlaceholder: 'Merchant (optional)',
      save: 'Save',
      today: 'Today',
      credit: '+ Credit',
      editAmount: 'Amount',
      editCategory: 'Category',
    },
    csvImport: {
      title: 'Import',
      hint: 'date, description, amount',
      tapToSelect: 'Tap to choose a CSV file',
      parseError:
        'Could not parse the CSV. Make sure it has date, description, and amount columns.',
      transactionsFound: (n) =>
        `${n} transaction${n !== 1 ? 's' : ''} found — select which to import`,
      selectedOf: (selected, total) => `${selected} of ${total} selected`,
      showLess: 'Show less',
      showMore: (n) => `+${n} more`,
      cancel: 'Cancel',
      import: (n) => `Import ${n} entr${n !== 1 ? 'ies' : 'y'}`,
      importing: 'Importing…',
      imported: (n) => `${n} transaction${n !== 1 ? 's' : ''} imported`,
      done: 'Done',
      importFailed: 'Import failed. Please try again.',
      rows: (n) => `${n} row${n !== 1 ? 's' : ''}`,
      mapping: 'Your column → Truffle field',
      fields: {
        date: 'Date',
        description: 'Description',
        amount: 'Amount',
        category: 'Category',
        merchant: 'Merchant',
      },
      preview: 'Preview',
      newEntries: 'New entries',
      skipped: 'Not selected',
      couldntRead: 'Import · couldn’t read file',
      nothingImported: 'Nothing was imported.',
    },
    receiptUpload: {
      title: 'Scan',
      hint: 'Receipt photo or PDF statement',
      tapToSelect: 'Tap to choose a receipt or statement',
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
      resultTitle: 'Read from photo',
      retake: 'Retake',
      total: 'Total',
      items: (n) => `${n} item${n !== 1 ? 's' : ''}`,
      errorTitle: 'Scan · couldn’t read',
      shutter: 'Take photo',
      files: 'Files',
    },
    weeklySummary: {
      title: 'Weekly summary',
      readAloud: 'Play',
      playing: 'Playing…',
      spent: (amount) => `This week you spent ${amount}`,
      earned: (amount) => ` and earned ${amount}`,
      topCategory: (label) => `. Most went on ${label}.`,
      dismiss: 'Dismiss',
      weekRecap: (week) => `Week ${week} recap`,
      stop: 'Stop',
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
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      peak: (day, amount) => `Peak ${day} · ${amount}`,
      noSpending: 'no spending',
      low: 'Low',
      high: 'High',
      busiest: 'busiest',
      calEmpty: 'The calendar fills in as you log spending.',
      nothingLogged: 'Nothing logged on this day.',
      sectionsLabel: 'Sections',
      sections: {
        rev: { code: 'Rev', title: 'To review', heading: (n) => `To review (${n})` },
        cal: { code: 'Cal', title: 'Spending calendar', heading: 'By day' },
        bud: { code: 'Bud', title: 'Budgets', heading: 'Budgets' },
        goal: { code: 'Goal', title: 'Savings goals', heading: 'Savings' },
        hab: { code: 'Hab', title: 'Saving habits', heading: 'Habits' },
        sub: { code: 'Sub', title: 'Recurring subscriptions', heading: 'Recurring' },
      },
      newItem: '+ New',
      monthly: 'Monthly',
      subsEmpty: 'I’ll spot subscriptions after the second time they’re charged.',
      severity: { high: 'Check soon', medium: 'Worth a look', low: 'FYI' },
      anomalyTypes: {
        unusual_amount: 'Unusual amount',
        forgotten_subscription: 'Forgotten subscription',
        category_spike: 'Category spike',
        new_merchant: 'New merchant',
      },
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
      remaining: (amount) => `${amount} remaining`,
      deleteGoal: 'Delete goal',
      deleteConfirm: 'Delete this goal?',
      ofTarget: (saved, target) => `${saved} of ${target}`,
      startGoal: '+ Start a goal',
      noGoalsShort: 'No goals yet',
      iconLabel: 'Goal icon',
      deadlineLabel: 'Target date',
    },
    savingsHabits: {
      noHabits: 'No saving habits yet — ask Truffle to set one up',
      periodWeek: 'week',
      periodMonth: 'month',
      totalSaved: (amount) => `${amount} total saved`,
      done: 'Done',
      log: '+ Log',
      frequencyWeekly: 'Weekly',
      frequencyMonthly: 'Monthly',
      streak: (n) => `${n} in a row`,
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
      deleteConfirm: 'Delete this budget?',
      statusOver: 'Over',
      statusHeadsUp: 'Heads-up',
      statusOnTrack: 'On track',
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
      holdButton: 'Hold the key and ask anything. Replies print as slips.',
      suggestions: [
        'How am I doing this month?',
        'What did I spend on food?',
        'Can I afford a weekend trip?',
      ],
      typePlaceholder: 'Or type your question...',
      send: 'Send message',
      stop: 'Stop',
      mute: 'Mute voice',
      unmute: 'Unmute voice',
      failedToSend: 'Failed to send',
      resend: 'Resend',
      anErrorOccurred: 'An error occurred.',
      title: 'Talk to Truffle',
      voiceLabel: (name) => `Voice · ${name}`,
      soundOn: 'Sound on',
      soundOff: 'Sound off',
      notice: 'Notice',
      tallying: 'Tallying',
    },
    proposals: {
      goal: {
        addToGoals: 'Add this to your goals?',
        noThanks: 'Not now',
        yesAddIt: 'Create goal',
        saving: 'Saving…',
        error: 'Something went wrong — please try again.',
        addedToGoals: (emoji, name) =>
          `${emoji} ${name} added to your goals — find it in Insights.`,
        proposed: 'Proposed goal',
        created: 'Goal created',
        deadline: 'By',
      },
      transaction: {
        logThis: 'Log this transaction?',
        noThanks: 'Cancel',
        add: '✓ Log it',
        saving: 'Saving…',
        error: 'Something went wrong — please try again.',
        proposed: 'Proposed entry',
        logged: 'Logged',
      },
      habit: {
        weeklyLabel: 'Weekly saving habit',
        monthlyLabel: 'Monthly saving habit',
        logEachPeriod: (period) => `You log each ${period} yourself in Insights`,
        notNow: 'Not now',
        startSaving: 'Start habit',
        settingUp: 'Setting up…',
        error: 'Something went wrong — please try again.',
        proposed: 'Proposed habit',
        started: 'Habit started',
      },
    },
  },
}

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
}
