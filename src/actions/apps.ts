'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createAppSchema = z.object({
  name: z.string().min(1),
  json: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

const updateAppSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  json: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  databaseData: z.any().optional(),
})

/**
 * Get all apps for the current user
 */
export async function getUserApps() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
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

  return apps
}

/**
 * Get a specific app by ID
 */
export async function getApp(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const app = await prisma.app.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!app) {
    throw new Error('App not found')
  }

  return app
}

/**
 * Create a new app
 */
export async function createApp(data: z.infer<typeof createAppSchema>) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validated = createAppSchema.parse(data)

  const app = await prisma.app.create({
    data: {
      ...validated,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard')

  return app
}

/**
 * Update an existing app
 */
export async function updateApp(data: z.infer<typeof updateAppSchema>) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const { id, ...updateData } = updateAppSchema.parse(data)

  // Verify ownership
  const existing = await prisma.app.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    throw new Error('App not found or unauthorized')
  }

  const app = await prisma.app.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/dashboard')

  return app
}

/**
 * Delete an app
 */
export async function deleteApp(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await prisma.app.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    throw new Error('App not found or unauthorized')
  }

  await prisma.app.delete({
    where: { id },
  })

  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * Update app's database data (for the dynamic database feature)
 */
export async function updateAppDatabaseData(id: string, databaseData: any) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await prisma.app.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    throw new Error('App not found or unauthorized')
  }

  const app = await prisma.app.update({
    where: { id },
    data: { databaseData },
  })

  return app
}
