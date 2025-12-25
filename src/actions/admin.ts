'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Check if current user is admin
 */
export async function isUserAdmin() {
  const session = await auth()

  if (!session?.user?.id) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  return user?.isAdmin || false
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { apps: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return users
}

/**
 * Get all apps (admin only)
 */
export async function getAllApps() {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const apps = await prisma.app.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return apps
}

/**
 * Get platform statistics (admin only)
 */
export async function getPlatformStats() {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const [totalUsers, totalApps, publicApps, usersToday] = await Promise.all([
    prisma.user.count(),
    prisma.app.count(),
    prisma.app.count({ where: { isPublic: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  // Get apps created per day for the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentApps = await prisma.app.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
  })

  // Group by day
  const appsByDay: Record<string, number> = {}
  recentApps.forEach((app) => {
    const day = app.createdAt.toISOString().split('T')[0]
    appsByDay[day] = (appsByDay[day] || 0) + 1
  })

  return {
    totalUsers,
    totalApps,
    publicApps,
    usersToday,
    appsPerDay: appsByDay,
  }
}

/**
 * Toggle user admin status (admin only)
 */
export async function toggleUserAdmin(userId: string) {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const session = await auth()

  // Prevent self-demotion
  if (userId === session?.user?.id) {
    throw new Error('Cannot modify your own admin status')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: !user.isAdmin },
  })

  revalidatePath('/admin')

  return updated
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string) {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const session = await auth()

  // Prevent self-deletion
  if (userId === session?.user?.id) {
    throw new Error('Cannot delete your own account')
  }

  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath('/admin')

  return { success: true }
}
