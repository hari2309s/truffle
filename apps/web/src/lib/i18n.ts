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
    next: string
    skip: string
    later: string
    sayItTitle: string
    sayItBody: string
    sample: { youSaid: string; quote: string; line: string; today: string }
    receiptsTitle: string
    receiptsBody: string
    receiptsScan: string
    receiptsScanDesc: string
    receiptsCsv: string
    receiptsCsvDesc: string
    receiptsFresh: string
    receiptsFreshDesc: string
    receiptsDone: (n: number) => string
    private: string
    privateNote: string
    budgetsTitle: string
    budgetsBody: string
    budgetsBodyFromData: string
    limitsLabel: string
    suggested: string
    lastMonth: (amount: string) => string
    lower: (category: string) => string
    raise: (category: string) => string
    total: string
    perMonth: (amount: string) => string
    headsUpNote: string
    printFirst: string
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
    exportCsv: string
    exportJson: string
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
    netThisMonth: string
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
    cancel: string
    saving: string
  }
  offline: {
    offline: string
    waiting: (n: number) => string
    slips: (n: number) => string
    retry: string
    queuedTitle: string
    storedHere: string
    dropped: (n: number) => string
    dismiss: string
  }
  recap: {
    title: (week: number) => string
    readBy: (name: string) => string
    hi: (name: string) => string
    spent: (amount: string) => string
    spentVsUsual: (amount: string, diff: string, less: boolean) => string
    busyLine: (category: string, amount: string, count: number, weekday: string) => string
    income: (amount: string) => string
    goal: (name: string, pct: number) => string
    habit: (name: string, streak: number) => string
    closing: string
    cardSpent: (amount: string) => string
    cardSpentVsUsual: (amount: string, diff: string, less: boolean) => string
    cardBusy: (category: string) => string
    spentLabel: string
    vsUsual: string
    play: string
    pause: string
    previousLine: string
    nextLine: string
    speed: string
    holdToAsk: string
    askPrefix: (question: string) => string
  }
  entryDetail: {
    title: (code: string) => string
    view: string
    edit: string
    ask: string
    askAbout: string
    askQuestion: (name: string) => string
    charged: string
    received: string
    currency: string
    recurring: string
    yes: string
    total: string
    budget: string
    swipeToTear: string
    delete: string
    tapAgain: string
    deleting: string
    deleteError: string
    split: string
    receipt: string
    attach: string
    working: string
    note: string
    openFull: string
    removeReceipt: string
    receiptError: string
  }
  split: {
    title: string
    part: (n: number) => string
    remove: (n: number) => string
    addPart: string
    left: string
    over: string
    balanced: string
    save: (n: number) => string
    error: string
  }
  goalDetail: {
    title: string
    edit: string
    target: (amount: string) => string
    toGo: (amount: string) => string
    weeksAt: (weeks: number, amount: string) => string
    notePace: (perWeek: string, deadline: string) => string
    noteNoDeadline: string
    noteDone: string
    deposits: string
    noDeposits: string
    deposit: string
    withdrawal: string
    addDeposit: string
    withdraw: string
    available: (amount: string) => string
    confirmDeposit: (amount: string) => string
    confirmWithdraw: (amount: string) => string
    saveChanges: string
    error: string
  }
  habitDetail: {
    title: string
    edit: string
    save: string
    since: (date: string) => string
    inARow: (period: string) => string
    totalSaved: string
    history: string
    noHistory: string
    week: (n: number) => string
    logThis: (period: string, amount: string) => string
    loggedThis: (period: string) => string
    icon: string
    name: string
    amountPer: (period: string) => string
    stop: string
    stopNote: string
    error: string
  }
  budgetEdit: {
    title: string
    open: (category: string) => string
    ofLimit: (spent: string, limit: string) => string
    monthlyLimit: string
    decrease: string
    increase: string
    atLimit: (limit: string, pct: number) => string
    lastThree: string
    soFar: (month: string) => string
    headsUpAt: string
    off: string
    rollover: string
    save: (amount: string) => string
    error: string
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
    holdTalk: string
    backspace: string
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
    loadingMonth: string
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
    matchesFor: (query: string) => string
    noMatchesHint: string
    notePlaceholder: string
    saveError: string
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
    skip: string
    mapColumn: (header: string) => string
    needFields: (fields: string) => string
    dup: string
    duplicatesSkipped: string
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
    torch: string
    mode: string
    receipt: string
    pdf: string
    lineUp: string
    startingCamera: string
    blurryTitle: string
    blurryBody: (total: string) => string
    saveTotal: string
    totalOnly: string
    keepPhoto: string
    attachFailed: string
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
    itsMine: string
    notMe: string
    notMePrompt: (label: string, amount: string) => string
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
    rolledOver: (amount: string) => string
    alertsOff: string
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
    notices: string
    newCount: (n: number) => string
    speaking: (name: string) => string
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
      next: 'Next →',
      skip: 'Skip',
      later: 'Later',
      sayItTitle: 'Say it.\nTruffle prints it.',
      sayItBody:
        'Hold the key and say what you spent. You’ll get a slip to check before anything is saved.',
      sample: {
        youSaid: 'You said',
        quote: 'Forty-five at Lidl, groceries',
        line: 'Lidl · Groceries',
        today: 'Today',
      },
      receiptsTitle: 'Bring your old receipts.',
      receiptsBody: 'Pick how to start. You can always add more later.',
      receiptsScan: 'Scan a PDF statement',
      receiptsScanDesc: 'Any bank. We read the lines for you.',
      receiptsCsv: 'Import a CSV',
      receiptsCsvDesc: 'Exports from Revolut, AIB, Monzo, N26…',
      receiptsFresh: 'Start fresh',
      receiptsFreshDesc: 'Just talk. Your first slip prints today.',
      receiptsDone: (n) => `${n} entr${n !== 1 ? 'ies' : 'y'} on your statement`,
      private: 'Private',
      privateNote: 'No bank login needed',
      budgetsTitle: 'Set a soft limit or two.',
      budgetsBody: 'A starting point to nudge. Change anything that feels off.',
      budgetsBodyFromData: 'Based on your last month, here’s a starting point. Nudge anything that feels off.',
      limitsLabel: 'Monthly limits · suggested',
      suggested: 'Suggested',
      lastMonth: (amount) => `Last month: ${amount}`,
      lower: (category) => `Lower ${category} limit`,
      raise: (category) => `Raise ${category} limit`,
      total: 'Total',
      perMonth: (amount) => `${amount} / mo`,
      headsUpNote: 'Gentle heads-up at 80%. Never a scolding.',
      printFirst: 'Print my first statement',
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
      exportFormat: 'CSV / JSON →',
      exportCsv: 'Transactions · CSV',
      exportJson: 'Everything · JSON',
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
      balance: 'Balance',
      netThisMonth: 'Net this month',
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
      cancel: 'Cancel',
      saving: 'Saving…',
    },
    offline: {
      offline: 'Offline',
      waiting: (n) => `${n} slip${n !== 1 ? 's' : ''} waiting`,
      slips: (n) => `${n} slip${n !== 1 ? 's' : ''} waiting`,
      retry: 'Retry',
      queuedTitle: 'Queued · saves when back online',
      storedHere: 'Stored on this phone',
      dropped: (n) => `${n} queued slip${n !== 1 ? 's' : ''} couldn’t be saved`,
      dismiss: 'Dismiss',
    },
    recap: {
      title: (week) => `Week ${week} recap`,
      readBy: (name) => `Read by ${name}`,
      hi: (name) => (name ? `Hi ${name}. Here’s your week.` : 'Here’s your week.'),
      spent: (amount) => `You spent ${amount} this week.`,
      spentVsUsual: (amount, diff, less) =>
        `You spent ${amount}, about ${diff} ${less ? 'less' : 'more'} than a usual week.`,
      busyLine: (category, amount, count, weekday) =>
        `${category} was the busy line: ${amount} across ${count} ${count === 1 ? 'entry' : 'entries'}, mostly ${weekday}.`,
      income: (amount) => `${amount} came in.`,
      goal: (name, pct) => `${name} is at ${pct}%.`,
      habit: (name, streak) => `${name} is on ${streak} in a row.`,
      closing: 'That’s the week. Hold the key if you want to dig in.',
      cardSpent: (amount) => `${amount} spent this week.`,
      cardSpentVsUsual: (amount, diff, less) =>
        `${amount} spent, ${diff} ${less ? 'under' : 'over'} a usual week.`,
      cardBusy: (category) => `${category} was the busy line.`,
      spentLabel: 'Spent',
      vsUsual: 'vs usual',
      play: 'Play',
      pause: 'Pause',
      previousLine: 'Previous line',
      nextLine: 'Next line',
      speed: 'Reading speed',
      holdToAsk: 'Hold to ask about this week',
      askPrefix: (question) => `About my week: ${question}`,
    },
    entryDetail: {
      title: (code) => `Entry #${code}`,
      view: 'View entry',
      edit: 'Edit',
      ask: 'Ask',
      askAbout: 'Ask about this',
      askQuestion: (name) => `How much have I spent at ${name} this year?`,
      charged: 'Charged',
      received: 'Received',
      currency: 'Currency',
      recurring: 'Recurring',
      yes: 'Yes',
      total: 'Total',
      budget: 'Budget',
      swipeToTear: 'Swipe to tear off',
      delete: 'Delete entry',
      tapAgain: 'Tap again to tear off',
      deleting: 'Tearing off…',
      deleteError: 'Couldn’t delete that. Please try again.',
      split: 'Split',
      receipt: 'Receipt',
      attach: 'Attach',
      working: 'Working…',
      note: 'Note',
      openFull: 'Open full size',
      removeReceipt: 'Remove',
      receiptError: 'Couldn’t handle the receipt. Please try again.',
    },
    split: {
      title: 'Split entry',
      part: (n) => `Part ${n}`,
      remove: (n) => `Remove part ${n}`,
      addPart: 'Add part',
      left: 'Left to split',
      over: 'Over by',
      balanced: 'Balanced',
      save: (n) => `Split into ${n}`,
      error: 'Couldn’t split that. Please try again.',
    },
    goalDetail: {
      title: 'Goal',
      edit: 'Edit',
      target: (amount) => `Target ${amount}`,
      toGo: (amount) => `${amount} to go`,
      weeksAt: (weeks, amount) => `≈ ${weeks} week${weeks !== 1 ? 's' : ''} at ${amount}`,
      notePace: (perWeek, deadline) => `To land by ${deadline}, put away about ${perWeek} a week.`,
      noteNoDeadline: 'No deadline yet. Add one and Truffle works out the weekly amount.',
      noteDone: 'Goal reached. Lovely work.',
      deposits: 'Deposits',
      noDeposits: 'Nothing saved yet. Your first deposit prints here.',
      deposit: 'Deposit',
      withdrawal: 'Withdrawn',
      addDeposit: 'Add deposit',
      withdraw: 'Withdraw',
      available: (amount) => `${amount} available`,
      confirmDeposit: (amount) => `Save ${amount}`,
      confirmWithdraw: (amount) => `Withdraw ${amount}`,
      saveChanges: 'Save changes',
      error: 'Couldn’t update the goal. Please try again.',
    },
    habitDetail: {
      title: 'Habit',
      edit: 'Edit',
      save: 'Save habit',
      since: (date) => `Since ${date}`,
      inARow: (period) => `${period}s in a row`,
      totalSaved: 'Total saved',
      history: 'Recent saves',
      noHistory: 'No saves logged yet.',
      week: (n) => `Week ${n}`,
      logThis: (period, amount) => `Log this ${period} · ${amount}`,
      loggedThis: (period) => `Logged this ${period}`,
      icon: 'Habit icon',
      name: 'Habit name',
      amountPer: (period) => `Amount each ${period}`,
      stop: 'Stop habit',
      stopNote: 'Stopping keeps everything you’ve saved; it just stops the reminders and the streak.',
      error: 'Couldn’t update the habit. Please try again.',
    },
    budgetEdit: {
      title: 'Budget',
      open: (category) => `Edit ${category} budget`,
      ofLimit: (spent, limit) => `${spent} of ${limit}`,
      monthlyLimit: 'Monthly limit',
      decrease: 'Lower the limit',
      increase: 'Raise the limit',
      atLimit: (limit, pct) => `At ${limit} you’d be at ${pct}%`,
      lastThree: 'Last 3 months',
      soFar: (month) => `${month} so far`,
      headsUpAt: 'Heads-up at',
      off: 'Off',
      rollover: 'Roll unused into next month',
      save: (amount) => `Save ${amount} limit`,
      error: 'Couldn’t save the limit. Please try again.',
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
      holdTalk: 'Hold talk',
      backspace: 'Delete last digit',
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
      loadingMonth: 'Printing…',
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
      matchesFor: (query) => `Matches for “${query}”`,
      noMatchesHint: 'Nothing here. Try another month, or ask Truffle out loud.',
      notePlaceholder: 'Note (optional)',
      saveError: 'Couldn’t save that. Please try again.',
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
      skip: 'Skip',
      mapColumn: (header) => `Truffle field for column ${header}`,
      needFields: (fields) => `Map ${fields} to continue`,
      dup: 'already logged',
      duplicatesSkipped: 'Duplicates skipped',
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
      torch: 'Torch',
      mode: 'Scan type',
      receipt: 'Receipt',
      pdf: 'PDF',
      lineUp: 'Hold steady · line it up in the frame',
      startingCamera: 'Starting the camera…',
      blurryTitle: 'Scan · too blurry',
      blurryBody: (total) =>
        `I could read the total (${total}) but not the items. Save just the total, or retake it in better light?`,
      saveTotal: 'Save total',
      totalOnly: 'Total only',
      keepPhoto: 'Keep the photo with this entry (you can remove it any time)',
      attachFailed: 'photo not attached',
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
      itsMine: 'It’s mine',
      notMe: 'Not me',
      notMePrompt: (label, amount) =>
        `I don’t recognise the ${amount ? `${amount} ` : ''}charge at ${label}. What should I do?`,
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
      rolledOver: (amount) => `↻ ${amount} rolled over`,
      alertsOff: 'Heads-up off',
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
      notices: 'Notices',
      newCount: (n) => `${n} new`,
      speaking: (name) => `${name} · speaking`,
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
