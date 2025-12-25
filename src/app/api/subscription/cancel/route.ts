import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

/**
 * POST /api/subscription/cancel
 * Cancels user's subscription (at period end)
 */
export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'TRIALING']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const subscription = user.subscriptions[0]

    // Cancel at period end via Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
