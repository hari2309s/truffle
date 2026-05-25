import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { stripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe'
import { createServerClient } from '@truffle/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const db = createServerClient()

  const { data: profile } = await db
    .from('user_profiles')
    .select('stripe_customer_id, plan')
    .eq('id', userId)
    .single()

  // Already Pro — redirect to billing portal instead of re-checkout
  if (profile?.plan === 'pro' && profile.stripe_customer_id) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })
    return NextResponse.json({ url: portalSession.url })
  }

  let customerId = profile?.stripe_customer_id ?? null

  if (!customerId) {
    // Get the user's email from Supabase Auth (service role)
    const { data: authUser } = await db.auth.admin.getUserById(userId)
    const customer = await stripe.customers.create({
      email: authUser.user?.email,
      metadata: { supabase_uid: userId },
    })
    customerId = customer.id

    // Persist the customer ID so we don't create duplicate customers
    await db.from('user_profiles').upsert({
      id: userId,
      stripe_customer_id: customerId,
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { supabase_uid: userId },
    },
    // EU VAT compliance
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto' },
  })

  return NextResponse.json({ url: session.url })
}
