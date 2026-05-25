import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { getUserPlan, getReceiptScanCountThisMonth, FREE_RECEIPT_LIMIT } from '@/lib/entitlements'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const [plan, receiptScansUsed] = await Promise.all([
    getUserPlan(userId),
    getReceiptScanCountThisMonth(userId),
  ])

  return NextResponse.json({
    plan,
    receiptScansUsed,
    receiptScanLimit: plan === 'pro' ? null : FREE_RECEIPT_LIMIT,
  })
}
