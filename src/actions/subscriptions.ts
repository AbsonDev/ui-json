'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanLimits, getUserUsageStats } from '@/lib/subscription/limits'
import { logError, logUserAction } from '@/lib/logger'

/**
 * Get current active subscription for the user
 */
export async function getCurrentSubscription() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    return subscription
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get subscription'))
    throw new Error('Failed to retrieve subscription')
  }
}

/**
 * Get user's plan details including limits and current usage
 */
export async function getUserPlanDetails() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIALING'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        apps: true,
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const limits = await getPlanLimits(user.planTier)
    const currentUsage = await getUserUsageStats(user.id)

    return {
      planTier: user.planTier,
      limits,
      currentUsage,
      subscription: user.subscriptions[0] || null
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get plan details'))
    throw new Error('Failed to retrieve plan details')
  }
}

/**
 * Get usage metrics for the current user
 */
export async function getUsageMetrics() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const stats = await getUserUsageStats(session.user.id)

    return stats
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get usage metrics'))
    throw new Error('Failed to retrieve usage metrics')
  }
}

/**
 * Get all user's invoices
 */
export async function getUserInvoices() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20 // Last 20 invoices
    })

    return invoices
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get invoices'))
    throw new Error('Failed to retrieve invoices')
  }
}

/**
 * Cancel subscription (at end of billing period)
 */
export async function cancelSubscription() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) {
      throw new Error('No active subscription found')
    }

    // This will be handled via Stripe API in the actual implementation
    // For now, just log the action
    logUserAction('cancel_subscription_request', session.user.id, {
      subscriptionId: subscription.id
    })

    return { success: true, message: 'Subscription will be canceled at the end of the billing period' }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No active')) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to cancel subscription'))
    throw new Error('Failed to cancel subscription')
  }
}
