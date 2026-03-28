export interface Transaction {
  id: string
  userId: string
  amount: number // negative = expense, positive = income
  currency: 'EUR' | 'GBP' | 'USD'
  description: string
  category: TransactionCategory
  merchant?: string
  date: string // ISO date string
  isRecurring: boolean
  embedding?: number[] // @xenova/transformers embedding
  createdAt?: string
}

export type TransactionCategory =
  | 'food_groceries'
  | 'food_delivery'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'subscriptions'
  | 'health'
  | 'entertainment'
  | 'shopping'
  | 'income'
  | 'savings'
  | 'other'

export interface MonthlySnapshot {
  month: string // YYYY-MM
  totalIncome: number
  totalExpenses: number
  byCategory: Record<TransactionCategory, number>
  savingsRate: number
  balance: number
}

export interface Anomaly {
  id: string
  transactionId: string
  type: 'unusual_amount' | 'forgotten_subscription' | 'category_spike' | 'new_merchant'
  severity: 'high' | 'medium' | 'low'
  description: string
  detectedAt: string
}

export interface Forecast {
  currentBalance: number
  projectedEndOfMonth: number
  projectedSavings: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
  generatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string
  timestamp: string
}

export interface TruffleState {
  transactions: Transaction[]
  currentMonth: MonthlySnapshot
  anomalies: Anomaly[]
  forecast: Forecast
  chatHistory: ChatMessage[]
  userQuery?: string
  agentResponse?: string
  intent?: QueryIntent
}

export type QueryIntent =
  | 'spending_summary'
  | 'affordability_check'
  | 'anomaly_review'
  | 'forecast_request'
  | 'category_breakdown'
  | 'general_advice'
