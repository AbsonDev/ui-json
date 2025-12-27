import { auth } from '@/lib/auth'
import {
  checkAppLimit,
  checkBuildLimit,
  checkExportLimit,
  checkFeatureAccess,
  getUserUsageStats
} from './limits'

/**
 * Custom error for usage limit violations
 */
export class UsageLimitError extends Error {
  constructor(
    message: string,
    public limitType: string,
    public currentUsage: number,
    public limit: number,
    public upgradeUrl: string = '/pricing'
  ) {
    super(message)
    this.name = 'UsageLimitError'
  }
}

/**
 * Enforce app creation limit
 * Throws UsageLimitError if limit is exceeded
 */
export async function enforceAppLimit() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const canCreate = await checkAppLimit(session.user.id)

  if (!canCreate) {
    const stats = await getUserUsageStats(session.user.id)

    throw new UsageLimitError(
      'You have reached your app limit. Upgrade to Pro for unlimited apps.',
      'apps',
      stats.apps.current,
      stats.apps.limit,
      '/pricing'
    )
  }
}

/**
 * Enforce build creation limit
 * Throws UsageLimitError if limit is exceeded
 */
export async function enforceBuildLimit() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const canBuild = await checkBuildLimit(session.user.id)

  if (!canBuild) {
    const stats = await getUserUsageStats(session.user.id)

    throw new UsageLimitError(
      'You have reached your monthly build limit. Upgrade to Pro for more builds.',
      'builds',
      stats.builds.current,
      stats.builds.limit,
      '/pricing'
    )
  }
}

/**
 * Enforce export limit
 * Throws UsageLimitError if limit is exceeded
 */
export async function enforceExportLimit() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const canExport = await checkExportLimit(session.user.id)

  if (!canExport) {
    const stats = await getUserUsageStats(session.user.id)

    throw new UsageLimitError(
      'You have reached your monthly export limit. Upgrade to Pro for unlimited exports.',
      'exports',
      stats.exports.current,
      stats.exports.limit,
      '/pricing'
    )
  }
}

/**
 * Enforce feature access
 * Throws Error if user doesn't have access to the feature
 */
export async function enforceFeatureAccess(
  feature: 'customDomain' | 'prioritySupport' | 'removeWatermark' | 'teamCollaboration' | 'analytics' | 'versionHistory' | 'aiAssistant'
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const hasAccess = await checkFeatureAccess(session.user.id, feature)

  if (!hasAccess) {
    const featureNames: Record<string, string> = {
      customDomain: 'Custom Domain',
      prioritySupport: 'Priority Support',
      removeWatermark: 'Remove Watermark',
      teamCollaboration: 'Team Collaboration',
      analytics: 'Analytics Dashboard',
      versionHistory: 'Version History',
      aiAssistant: 'AI Assistant'
    }

    throw new Error(
      `This feature requires a paid plan. Upgrade to access ${featureNames[feature]}.`
    )
  }
}

/**
 * Track export usage
 */
export async function trackExport(userId: string) {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Find or create usage metric for current month
  const usageMetric = await prisma.usageMetric.findFirst({
    where: {
      userId,
      periodStart: { gte: firstDayOfMonth },
      periodEnd: { lte: lastDayOfMonth }
    }
  })

  if (usageMetric) {
    // Update existing metric
    await prisma.usageMetric.update({
      where: { id: usageMetric.id },
      data: {
        exportsCount: { increment: 1 }
      }
    })
  } else {
    // Create new metric for this month
    await prisma.usageMetric.create({
      data: {
        userId,
        periodStart: firstDayOfMonth,
        periodEnd: lastDayOfMonth,
        exportsCount: 1,
        appsCount: await prisma.app.count({ where: { userId } }),
        buildsCount: await prisma.build.count({
          where: {
            app: { userId },
            createdAt: { gte: firstDayOfMonth }
          }
        })
      }
    })
  }
}

import { prisma } from '@/lib/prisma'
