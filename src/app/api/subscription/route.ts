import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/subscription
 * Returns current user's subscription details
 */
export async function GET() {
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
              in: ['ACTIVE', 'TRIALING', 'PAST_DUE']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If no active subscription, return FREE plan info
    if (!user.subscriptions || user.subscriptions.length === 0) {
      return NextResponse.json({
        planTier: 'FREE',
        status: 'ACTIVE',
        interval: null,
        amount: 0,
        currency: 'usd',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      })
    }

    const subscription = user.subscriptions[0]

    return NextResponse.json({
      planTier: subscription.planTier,
      status: subscription.status,
      interval: subscription.interval,
      amount: subscription.amount,
      currency: subscription.currency,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
    })
  } catch (error) {
    console.error('Failed to fetch subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
