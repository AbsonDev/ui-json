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
