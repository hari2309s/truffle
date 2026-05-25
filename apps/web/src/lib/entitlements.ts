import { createServerClient } from '@truffle/db'

export type Plan = 'free' | 'pro'

export const FREE_RECEIPT_LIMIT = 3 // scans per calendar month

export async function getUserPlan(userId: string): Promise<Plan> {
  const db = createServerClient()
  const { data } = await db
    .from('user_profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()

  if (!data) return 'free'
  if (data.plan !== 'pro') return 'free'
  if (data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) return 'free'
  return 'pro'
}

export async function getReceiptScanCountThisMonth(userId: string): Promise<number> {
  const db = createServerClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await db
    .from('receipt_scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  return count ?? 0
}

export type Feature = 'voice' | 'receipt' | 'insights' | 'chat'

/**
 * Checks whether a user is entitled to use a given feature.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function assertFeature(
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; plan: Plan; reason?: string }> {
  const plan = await getUserPlan(userId)

  // Chat is unlimited on all plans — Groq free tier handles it cost-free
  if (feature === 'chat') {
    return { allowed: true, plan }
  }

  // Receipt scanning: free users get FREE_RECEIPT_LIMIT scans/month
  if (feature === 'receipt') {
    if (plan === 'pro') return { allowed: true, plan }
    const count = await getReceiptScanCountThisMonth(userId)
    if (count >= FREE_RECEIPT_LIMIT) {
      return {
        allowed: false,
        plan,
        reason: `You've used your ${FREE_RECEIPT_LIMIT} free receipt scans this month. Upgrade to Pro for unlimited scanning.`,
      }
    }
    return { allowed: true, plan }
  }

  // voice and insights are Pro-only
  if (plan !== 'pro') {
    const featureNames: Record<Feature, string> = {
      voice: 'Voice transcription',
      receipt: 'Receipt & PDF scanning',
      insights: 'AI spending insights',
      chat: 'AI chat',
    }
    return {
      allowed: false,
      plan,
      reason: `${featureNames[feature]} is a Pro feature. Upgrade to unlock it.`,
    }
  }

  return { allowed: true, plan }
}
