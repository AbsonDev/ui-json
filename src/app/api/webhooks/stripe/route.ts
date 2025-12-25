import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { logError } from '@/lib/logger'
import { PlanTier } from '@prisma/client'
import {
  identifyUser,
  trackEvent,
  trackRevenue,
  setUserProperties
} from '@/lib/analytics/config'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Webhook signature verification failed'))
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logError(error instanceof Error ? error : new Error('Webhook handler error'))
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planTier = session.metadata?.planTier

  if (!userId) {
    throw new Error('No userId in checkout session metadata')
  }

  console.log(`Checkout completed for user ${userId}`)

  // Track checkout completion
  if (planTier && session.amount_total) {
    const interval = session.metadata?.interval || 'monthly'

    trackEvent('Checkout_Completed', {
      userId,
      planTier,
      interval,
      amount: session.amount_total / 100, // Convert cents to dollars
      customerId: session.customer as string,
    })

    // Track revenue
    trackRevenue(session.amount_total / 100, {
      planTier,
      interval,
    })
  }

  // Subscription will be handled by subscription.created event
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const planTier = subscription.metadata?.planTier as 'PRO' | 'TEAM' | 'ENTERPRISE'

  if (!userId || !planTier) {
    throw new Error('Missing metadata in subscription')
  }

  const status = mapStripeStatus(subscription.status)

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeProductId: subscription.items.data[0].price.product as string,
      planTier: planTier as PlanTier,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      amount: subscription.items.data[0].price.unit_amount || 0,
      currency: subscription.items.data[0].price.currency,
      interval: subscription.items.data[0].price.recurring?.interval === 'year' ? 'YEAR' : 'MONTH',
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      userId,
    },
    update: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    }
  })

  // Update user plan tier
  await prisma.user.update({
    where: { id: userId },
    data: { planTier: planTier as PlanTier }
  })

  // Track trial started if in trial period
  if (status === 'TRIALING') {
    trackEvent('Trial_Started', {
      userId,
      planTier,
    })

    setUserProperties({
      planTier,
      trialStartDate: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : new Date().toISOString(),
      isTrialing: true,
    })
  }

  // Track subscription upgrade/activation
  if (status === 'ACTIVE') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true }
    })

    if (user && user.planTier !== planTier) {
      trackEvent('Subscription_Upgraded', {
        userId,
        fromPlan: user.planTier,
        toPlan: planTier,
        newAmount: (subscription.items.data[0].price.unit_amount || 0) / 100,
      })
    }

    setUserProperties({
      planTier,
      isTrialing: false,
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELED' }
  })

  const userId = subscription.metadata?.userId
  const planTier = subscription.metadata?.planTier

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { planTier: 'FREE' }
    })

    // Track subscription cancellation
    const subscriptionData = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { createdAt: true }
    })

    const monthsSubscribed = subscriptionData
      ? Math.floor(
          (Date.now() - subscriptionData.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      : 0

    trackEvent('Subscription_Canceled', {
      userId,
      planTier: planTier || 'UNKNOWN',
      monthsSubscribed,
    })

    setUserProperties({
      planTier: 'FREE',
      canceledDate: new Date().toISOString(),
    })
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId || invoice.customer as string

  if (!userId) return

  // Find user by Stripe customer ID if userId is not in metadata
  let finalUserId = userId
  if (!userId.startsWith('clx') && !userId.startsWith('cuid_')) {
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: userId }
    })
    if (!user) return
    finalUserId = user.id
  }

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'PAID',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      userId: finalUserId,
    },
    update: {
      status: 'PAID',
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
    }
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId

  if (!userId) return

  await prisma.invoice.update({
    where: { stripeInvoiceId: invoice.id },
    data: { status: 'UNCOLLECTIBLE' }
  })

  // Track payment failure
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    select: { planTier: true }
  })

  trackEvent('Payment_Failed', {
    userId,
    planTier: subscription?.planTier || 'UNKNOWN',
    amount: invoice.amount_due / 100,
    reason: invoice.last_finalization_error?.message || 'Unknown',
  })

  // TODO: Send email notification to user
  console.warn(`Payment failed for user ${userId}`)
}

function mapStripeStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'UNPAID' {
  const statusMap: Record<Stripe.Subscription.Status, any> = {
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'trialing': 'TRIALING',
    'unpaid': 'UNPAID',
    'paused': 'CANCELED',
  }

  return statusMap[status]
}
