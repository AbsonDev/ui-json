import { PlanTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface PlanLimits {
  maxApps: number
  maxBuilds: number
  maxExports: number
  maxTemplates: number
  maxApiCalls: number
  maxStorageMB: number
  features: {
    customDomain: boolean
    prioritySupport: boolean
    removeWatermark: boolean
    teamCollaboration: boolean
    analytics: boolean
    versionHistory: boolean
    aiAssistant: boolean
  }
}

/**
 * Get plan limits configuration for a specific tier
 */
export async function getPlanLimits(planTier: PlanTier): Promise<PlanLimits> {
  const config = await prisma.planConfig.findUnique({
    where: { planTier }
  })

  if (!config) {
    throw new Error(`Plan config not found for tier: ${planTier}`)
  }

  return {
    maxApps: config.maxApps,
    maxBuilds: config.maxBuilds,
    maxExports: config.maxExports,
    maxTemplates: config.maxTemplates,
    maxApiCalls: config.maxApiCalls,
    maxStorageMB: config.maxStorageMB,
    features: {
      customDomain: config.customDomain,
      prioritySupport: config.prioritySupport,
      removeWatermark: config.removeWatermark,
      teamCollaboration: config.teamCollaboration,
      analytics: config.analytics,
      versionHistory: config.versionHistory,
      aiAssistant: config.aiAssistant,
    }
  }
}

/**
 * Check if user can create a new app
 */
export async function checkAppLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { apps: true }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)

  // -1 means unlimited
  if (limits.maxApps === -1) return true

  return user.apps.length < limits.maxApps
}

/**
 * Check if user can create a new build (monthly limit)
 */
export async function checkBuildLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)

  // -1 means unlimited
  if (limits.maxBuilds === -1) return true

  // Get builds count for current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const buildsThisMonth = await prisma.build.count({
    where: {
      app: { userId },
      createdAt: { gte: firstDayOfMonth }
    }
  })

  return buildsThisMonth < limits.maxBuilds
}

/**
 * Check if user can create a new export (monthly limit)
 */
export async function checkExportLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)

  // -1 means unlimited
  if (limits.maxExports === -1) return true

  // Get current month's usage metrics
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const usageMetric = await prisma.usageMetric.findFirst({
    where: {
      userId,
      periodStart: { gte: firstDayOfMonth },
      periodEnd: { lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
    }
  })

  const exportsThisMonth = usageMetric?.exportsCount || 0

  return exportsThisMonth < limits.maxExports
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanLimits['features']
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) return false

  const limits = await getPlanLimits(user.planTier)
  return limits.features[feature]
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { apps: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const limits = await getPlanLimits(user.planTier)

  // Get current month stats
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [buildsThisMonth, usageMetric] = await Promise.all([
    prisma.build.count({
      where: {
        app: { userId },
        createdAt: { gte: firstDayOfMonth }
      }
    }),
    prisma.usageMetric.findFirst({
      where: {
        userId,
        periodStart: { gte: firstDayOfMonth }
      }
    })
  ])

  return {
    apps: {
      current: user.apps.length,
      limit: limits.maxApps,
      percentage: limits.maxApps === -1 ? 0 : (user.apps.length / limits.maxApps) * 100
    },
    builds: {
      current: buildsThisMonth,
      limit: limits.maxBuilds,
      percentage: limits.maxBuilds === -1 ? 0 : (buildsThisMonth / limits.maxBuilds) * 100
    },
    exports: {
      current: usageMetric?.exportsCount || 0,
      limit: limits.maxExports,
      percentage: limits.maxExports === -1 ? 0 : ((usageMetric?.exportsCount || 0) / limits.maxExports) * 100
    }
  }
}
