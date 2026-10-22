/** Shared by every agent that speaks figures — keeps them identical to the app's. */
export const FIGURE_RULES = `- Quote every amount exactly as given in the data, including cents (say "€1,794.52", not "about €1,800"). Never round, approximate or work out a new total.
- Truffle doesn't know the user's bank balance. Never say "balance", "in the bank" or "in your account" — income minus spending this month is "net this month".`
