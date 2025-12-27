'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import logger, { logError, logUserAction } from '@/lib/logger'
import { enforceAppLimit, UsageLimitError } from '@/lib/subscription/enforcement'

// Maximum JSON size in bytes (2MB)
const MAX_JSON_SIZE = 2 * 1024 * 1024

// Custom Zod refinement to validate JSON size
const validateJsonSize = (json: string) => {
  const sizeInBytes = new TextEncoder().encode(json).length
  return sizeInBytes <= MAX_JSON_SIZE
}

// Custom Zod refinement to validate JSON structure
const validateJsonStructure = (json: string) => {
  try {
    JSON.parse(json)
    return true
  } catch {
    return false
  }
}

const createAppSchema = z.object({
  name: z.string()
    .min(1, 'App name is required')
    .max(100, 'App name must be less than 100 characters'),
  json: z.string()
    .refine(validateJsonStructure, {
      message: 'Invalid JSON format',
    })
    .refine(validateJsonSize, {
      message: `JSON size must be less than ${MAX_JSON_SIZE / 1024 / 1024}MB`,
    }),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean().default(false),
})

const updateAppSchema = z.object({
  id: z.string().uuid('Invalid app ID'),
  name: z.string()
    .min(1, 'App name is required')
    .max(100, 'App name must be less than 100 characters')
    .optional(),
  json: z.string()
    .refine(validateJsonStructure, {
      message: 'Invalid JSON format',
    })
    .refine(validateJsonSize, {
      message: `JSON size must be less than ${MAX_JSON_SIZE / 1024 / 1024}MB`,
    })
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean().optional(),
  databaseData: z.any().optional(),
})

/**
 * Get all apps for the current user
 */
export async function getUserApps() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      logError(new Error('Unauthorized access attempt to getUserApps'))
      throw new Error('Unauthorized: Please log in to view your apps')
    }

    const apps = await prisma.app.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        json: true,
        description: true,
        isPublic: true,
        version: true,
        databaseData: true,
        publishedAt: true,
        publishedSlug: true,
        viewCount: true,
        lastViewedAt: true,
        showWatermark: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    logger.info('User apps retrieved', {
      userId: session.user.id,
      appCount: apps.length
    })

    return apps
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to get user apps'))
    throw new Error('Failed to retrieve apps. Please try again later.')
  }
}

/**
 * Get a specific app by ID
 */
export async function getApp(id: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      logError(new Error('Unauthorized access attempt to getApp'))
      throw new Error('Unauthorized: Please log in to view this app')
    }

    const app = await prisma.app.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!app) {
      logger.warn('App not found', { appId: id, userId: session.user.id })
      throw new Error('App not found or you do not have access to this app')
    }

    logger.info('App retrieved', { appId: id, userId: session.user.id })

    return app
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Unauthorized') || error.message.startsWith('App not found'))) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to get app'), { appId: id })
    throw new Error('Failed to retrieve app. Please try again later.')
  }
}

/**
 * Create a new app
 */
export async function createApp(data: z.infer<typeof createAppSchema>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      logError(new Error('Unauthorized access attempt to createApp'))
      throw new Error('Unauthorized: Please log in to create an app')
    }

    // Check usage limits before creating app
    await enforceAppLimit()

    const validated = createAppSchema.parse(data)

    const app = await prisma.app.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    })

    logUserAction('create_app', session.user.id, {
      appId: app.id,
      appName: app.name
    })

    revalidatePath('/dashboard')

    return app
  } catch (error) {
    if (error instanceof UsageLimitError) {
      // Re-throw usage limit errors to be handled by UI
      throw error
    }
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      logger.warn('App validation failed', { error: firstError })
      throw new Error(firstError.message)
    }
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to create app'))
    throw new Error('Failed to create app. Please try again later.')
  }
}

/**
 * Update an existing app
 */
export async function updateApp(data: z.infer<typeof updateAppSchema>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      logError(new Error('Unauthorized access attempt to updateApp'))
      throw new Error('Unauthorized: Please log in to update this app')
    }

    const { id, ...updateData } = updateAppSchema.parse(data)

    // Verify ownership
    const existing = await prisma.app.findUnique({
      where: { id },
      select: { userId: true, name: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      logger.warn('Unauthorized app update attempt', { appId: id, userId: session.user.id })
      throw new Error('App not found or you do not have permission to update this app')
    }

    const app = await prisma.app.update({
      where: { id },
      data: updateData,
    })

    logUserAction('update_app', session.user.id, {
      appId: app.id,
      appName: app.name
    })

    revalidatePath('/dashboard')

    return app
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      logger.warn('App update validation failed', { error: firstError })
      throw new Error(firstError.message)
    }
    if (error instanceof Error && (error.message.startsWith('Unauthorized') || error.message.startsWith('App not found'))) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to update app'))
    throw new Error('Failed to update app. Please try again later.')
  }
}

/**
 * Delete an app
 */
export async function deleteApp(id: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      logError(new Error('Unauthorized access attempt to deleteApp'))
      throw new Error('Unauthorized: Please log in to delete this app')
    }

    // Verify ownership
    const existing = await prisma.app.findUnique({
      where: { id },
      select: { userId: true, name: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      logger.warn('Unauthorized app delete attempt', { appId: id, userId: session.user.id })
      throw new Error('App not found or you do not have permission to delete this app')
    }

    await prisma.app.delete({
      where: { id },
    })

    logUserAction('delete_app', session.user.id, {
      appId: id,
      appName: existing.name
    })

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Unauthorized') || error.message.startsWith('App not found'))) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to delete app'), { appId: id })
    throw new Error('Failed to delete app. Please try again later.')
  }
}

/**
 * Update app's database data (for the dynamic database feature)
 */
export async function updateAppDatabaseData(id: string, databaseData: any) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      logError(new Error('Unauthorized access attempt to updateAppDatabaseData'))
      throw new Error('Unauthorized: Please log in to update app data')
    }

    // Verify ownership
    const existing = await prisma.app.findUnique({
      where: { id },
      select: { userId: true, name: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      logger.warn('Unauthorized app database data update attempt', { appId: id, userId: session.user.id })
      throw new Error('App not found or you do not have permission to update this app')
    }

    const app = await prisma.app.update({
      where: { id },
      data: { databaseData },
    })

    logUserAction('update_app_database_data', session.user.id, {
      appId: id,
      appName: existing.name
    })

    return app
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Unauthorized') || error.message.startsWith('App not found'))) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to update app database data'), { appId: id })
    throw new Error('Failed to update app data. Please try again later.')
  }
}

// ============================================
// Publishing & Deployment Actions
// ============================================

const publishAppSchema = z.object({
  appId: z.string().uuid('Invalid app ID'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

/**
 * Publish an app to make it publicly accessible
 */
export async function publishApp(data: z.infer<typeof publishAppSchema>) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized: Please log in to publish apps')
    }

    const validated = publishAppSchema.parse(data)

    // Verify ownership
    const app = await prisma.app.findUnique({
      where: { id: validated.appId },
      select: {
        userId: true,
        name: true,
        isPublic: true,
        publishedSlug: true,
      },
    })

    if (!app || app.userId !== session.user.id) {
      throw new Error('App not found or you do not have permission to publish this app')
    }

    // Generate slug if not provided
    let slug = validated.slug
    if (!slug) {
      // Auto-generate from app name
      slug = app.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)

      // Ensure uniqueness by adding random suffix if needed
      const existing = await prisma.app.findUnique({
        where: { publishedSlug: slug },
      })

      if (existing && existing.id !== validated.appId) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
      }
    } else {
      // Check if slug is already taken by another app
      const existing = await prisma.app.findUnique({
        where: { publishedSlug: slug },
      })

      if (existing && existing.id !== validated.appId) {
        throw new Error('This slug is already taken. Please choose a different one.')
      }
    }

    // Get user's plan to determine watermark visibility
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { planTier: true },
    })

    const showWatermark = user?.planTier === 'FREE'

    // Update app to published state
    const updatedApp = await prisma.app.update({
      where: { id: validated.appId },
      data: {
        isPublic: true,
        publishedAt: app.isPublic ? undefined : new Date(), // Only set if not already published
        publishedSlug: slug,
        showWatermark,
      },
    })

    logUserAction('publish_app', session.user.id, {
      appId: validated.appId,
      appName: app.name,
      slug,
      planTier: user?.planTier,
    })

    revalidatePath('/dashboard')
    revalidatePath(`/published/${slug}`)

    return {
      success: true,
      slug,
      url: `/published/${slug}`,
      app: updatedApp,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    if (error instanceof Error && error.message.includes('already taken')) {
      throw error
    }
    logError(error instanceof Error ? error : new Error('Failed to publish app'))
    throw new Error('Failed to publish app. Please try again later.')
  }
}

/**
 * Unpublish an app (make it private)
 */
export async function unpublishApp(appId: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized: Please log in to unpublish apps')
    }

    // Verify ownership
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { userId: true, name: true, publishedSlug: true },
    })

    if (!app || app.userId !== session.user.id) {
      throw new Error('App not found or you do not have permission to unpublish this app')
    }

    // Update app to private state
    await prisma.app.update({
      where: { id: appId },
      data: {
        isPublic: false,
        // Keep publishedSlug for potential re-publishing
      },
    })

    logUserAction('unpublish_app', session.user.id, {
      appId,
      appName: app.name,
    })

    revalidatePath('/dashboard')
    if (app.publishedSlug) {
      revalidatePath(`/published/${app.publishedSlug}`)
    }

    return { success: true }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to unpublish app'))
    throw new Error('Failed to unpublish app. Please try again later.')
  }
}

/**
 * Get published app by slug (public endpoint - no auth required)
 */
export async function getPublishedApp(slug: string) {
  try {
    const app = await prisma.app.findUnique({
      where: {
        publishedSlug: slug,
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        json: true,
        description: true,
        databaseData: true,
        showWatermark: true,
        viewCount: true,
        publishedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!app) {
      return null
    }

    // Increment view count (async, don't wait)
    prisma.app.update({
      where: { id: app.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    }).catch((err) => {
      logError(err instanceof Error ? err : new Error('Failed to increment view count'))
    })

    return app
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get published app'))
    return null
  }
}

/**
 * Track a view for a published app
 */
export async function trackAppView(appId: string, metadata: {
  visitorIp?: string
  userAgent?: string
  referrer?: string
  sessionId?: string
}) {
  try {
    // Hash IP for privacy
    const hashedIp = metadata.visitorIp
      ? Buffer.from(metadata.visitorIp).toString('base64')
      : undefined

    await prisma.appView.create({
      data: {
        appId,
        visitorIp: hashedIp,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
        sessionId: metadata.sessionId,
      },
    })
  } catch (error) {
    // Silent fail - don't break app viewing if analytics fails
    logError(error instanceof Error ? error : new Error('Failed to track app view'))
  }
}

/**
 * Get analytics for a published app (owner only)
 */
export async function getAppAnalytics(appId: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new Error('Unauthorized: Please log in to view analytics')
    }

    // Verify ownership
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { userId: true },
    })

    if (!app || app.userId !== session.user.id) {
      throw new Error('App not found or you do not have permission to view analytics')
    }

    const [totalViews, last30Days, last7Days, today] = await Promise.all([
      // Total views
      prisma.appView.count({
        where: { appId },
      }),
      // Last 30 days
      prisma.appView.count({
        where: {
          appId,
          viewedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Last 7 days
      prisma.appView.count({
        where: {
          appId,
          viewedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Today
      prisma.appView.count({
        where: {
          appId,
          viewedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    return {
      totalViews,
      last30Days,
      last7Days,
      today,
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to get app analytics'))
    throw new Error('Failed to load analytics. Please try again later.')
  }
}
