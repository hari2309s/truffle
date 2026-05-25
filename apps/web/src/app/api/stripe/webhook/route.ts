import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@truffle/db'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

// This route must NOT be wrapped with requireAuth — Stripe calls it without a user session.
// Security comes from the webhook signature verification below.

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = createServerClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId =
          session.metadata?.supabase_uid ??
          (session.subscription_data as { metadata?: { supabase_uid?: string } } | undefined)
            ?.metadata?.supabase_uid

        if (!userId) {
          console.error(
            '[stripe/webhook] checkout.session.completed: missing supabase_uid in metadata'
          )
          break
        }

        await db.from('user_profiles').upsert({
          id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: 'pro',
          plan_expires_at: null,
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_uid
        if (!userId) break

        const isActive = ['active', 'trialing'].includes(sub.status)

        await db
          .from('user_profiles')
          .update({
            plan: isActive ? 'pro' : 'free',
            stripe_subscription_id: sub.id,
            // When cancel_at_period_end is true, the user keeps Pro access until period end
            plan_expires_at:
              sub.cancel_at_period_end && sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await db
          .from('user_profiles')
          .update({
            plan: 'free',
            plan_expires_at: null,
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_failed': {
        // Don't immediately downgrade — Stripe retries automatically.
        // Just log it so we can monitor failed payments.
        const invoice = event.data.object as Stripe.Invoice
        console.warn('[stripe/webhook] payment failed:', invoice.id, 'customer:', invoice.customer)
        break
      }

      default:
        // Return 200 for unhandled events so Stripe doesn't retry them
        break
    }
  } catch (err) {
    console.error('[stripe/webhook] handler error for event', event.type, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
