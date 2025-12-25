import * as adminActions from '../admin'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    app: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Admin Actions', () => {
  const mockAdminSession = {
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
    },
  }

  const mockRegularSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      isAdmin: false,
    },
  }

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
  }

  const mockRegularUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Regular User',
    isAdmin: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isUserAdmin', () => {
    it('should return true for admin users', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      const result = await adminActions.isUserAdmin()

      expect(result).toBe(true)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-123' },
        select: { isAdmin: true },
      })
    })

    it('should return false for regular users', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      const result = await adminActions.isUserAdmin()

      expect(result).toBe(false)
    })

    it('should return false if not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      const result = await adminActions.isUserAdmin()

      expect(result).toBe(false)
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return false if user not found in database', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await adminActions.isUserAdmin()

      expect(result).toBe(false)
    })
  })

  describe('getAllUsers', () => {
    it('should return all users for admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@example.com',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { apps: 3 },
        },
        {
          id: 'user-2',
          name: 'User 2',
          email: 'user2@example.com',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { apps: 1 },
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

      const result = await adminActions.getAllUsers()

      expect(result).toEqual(mockUsers)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
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
    })

    it('should throw error if user is not admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      await expect(adminActions.getAllUsers()).rejects.toThrow(
        'Unauthorized: Admin access required'
      )

      expect(prisma.user.findMany).not.toHaveBeenCalled()
    })

    it('should throw error if not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await expect(adminActions.getAllUsers()).rejects.toThrow(
        'Unauthorized: Admin access required'
      )
    })
  })

  describe('getAllApps', () => {
    it('should return all apps for admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      const mockApps = [
        {
          id: 'app-1',
          name: 'App 1',
          description: 'Test app',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'User 1',
            email: 'user1@example.com',
          },
        },
      ]

      ;(prisma.app.findMany as jest.Mock).mockResolvedValue(mockApps)

      const result = await adminActions.getAllApps()

      expect(result).toEqual(mockApps)
      expect(prisma.app.findMany).toHaveBeenCalledWith({
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
    })

    it('should throw error if user is not admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      await expect(adminActions.getAllApps()).rejects.toThrow(
        'Unauthorized: Admin access required'
      )
    })
  })

  describe('getPlatformStats', () => {
    it('should return platform statistics for admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      ;(prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(5) // usersToday

      ;(prisma.app.count as jest.Mock)
        .mockResolvedValueOnce(250) // totalApps
        .mockResolvedValueOnce(50) // publicApps

      const mockRecentApps = [
        { createdAt: new Date('2025-12-20') },
        { createdAt: new Date('2025-12-20') },
        { createdAt: new Date('2025-12-21') },
      ]

      ;(prisma.app.findMany as jest.Mock).mockResolvedValue(mockRecentApps)

      const result = await adminActions.getPlatformStats()

      expect(result).toEqual({
        totalUsers: 100,
        totalApps: 250,
        publicApps: 50,
        usersToday: 5,
        appsPerDay: expect.any(Object),
      })

      expect(result.appsPerDay['2025-12-20']).toBe(2)
      expect(result.appsPerDay['2025-12-21']).toBe(1)
    })

    it('should calculate correct date ranges for stats', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.app.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.app.findMany as jest.Mock).mockResolvedValue([])

      await adminActions.getPlatformStats()

      // Check usersToday filter
      const userCountCall = (prisma.user.count as jest.Mock).mock.calls[1][0]
      expect(userCountCall.where.createdAt.gte).toBeInstanceOf(Date)

      // Check recentApps filter (7 days ago)
      const appsCall = (prisma.app.findMany as jest.Mock).mock.calls[0][0]
      expect(appsCall.where.createdAt.gte).toBeInstanceOf(Date)
    })

    it('should throw error if user is not admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      await expect(adminActions.getPlatformStats()).rejects.toThrow(
        'Unauthorized: Admin access required'
      )
    })
  })

  describe('toggleUserAdmin', () => {
    it('should toggle user admin status', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser) // isUserAdmin check
        .mockResolvedValueOnce({ ...mockRegularUser, isAdmin: false }) // target user check

      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockRegularUser,
        isAdmin: true,
      })

      const result = await adminActions.toggleUserAdmin('user-123')

      expect(result.isAdmin).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { isAdmin: true },
      })
    })

    it('should prevent self-demotion', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      await expect(adminActions.toggleUserAdmin('admin-123')).rejects.toThrow(
        'Cannot modify your own admin status'
      )

      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should throw error if target user not found', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(null)

      await expect(adminActions.toggleUserAdmin('invalid-id')).rejects.toThrow('User not found')
    })

    it('should throw error if user is not admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      await expect(adminActions.toggleUserAdmin('user-123')).rejects.toThrow(
        'Unauthorized: Admin access required'
      )
    })

    it('should demote admin users', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce({ ...mockRegularUser, id: 'user-456', isAdmin: true })

      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockRegularUser,
        id: 'user-456',
        isAdmin: false,
      })

      const result = await adminActions.toggleUserAdmin('user-456')

      expect(result.isAdmin).toBe(false)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-456' },
        data: { isAdmin: false },
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      ;(prisma.user.delete as jest.Mock).mockResolvedValue(mockRegularUser)

      const result = await adminActions.deleteUser('user-123')

      expect(result.success).toBe(true)
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })

    it('should prevent self-deletion', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      await expect(adminActions.deleteUser('admin-123')).rejects.toThrow(
        'Cannot delete your own account'
      )

      expect(prisma.user.delete).not.toHaveBeenCalled()
    })

    it('should throw error if user is not admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      await expect(adminActions.deleteUser('user-123')).rejects.toThrow(
        'Unauthorized: Admin access required'
      )
    })

    it('should cascade delete related data', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      ;(prisma.user.delete as jest.Mock).mockResolvedValue(mockRegularUser)

      await adminActions.deleteUser('user-123')

      // Verify delete was called (Prisma handles cascade via onDelete: Cascade in schema)
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })
  })

  describe('Security - Authorization Checks', () => {
    it('should require admin for all admin operations', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      const adminOperations = [
        () => adminActions.getAllUsers(),
        () => adminActions.getAllApps(),
        () => adminActions.getPlatformStats(),
        () => adminActions.toggleUserAdmin('user-123'),
        () => adminActions.deleteUser('user-123'),
      ]

      for (const operation of adminOperations) {
        await expect(operation()).rejects.toThrow('Unauthorized: Admin access required')
      }
    })

    it('should prevent privilege escalation', async () => {
      // Regular user trying to make themselves admin
      ;(auth as jest.Mock).mockResolvedValue(mockRegularSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRegularUser)

      await expect(adminActions.toggleUserAdmin(mockRegularSession.user.id)).rejects.toThrow(
        'Unauthorized: Admin access required'
      )
    })

    it('should validate session exists', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await expect(adminActions.getAllUsers()).rejects.toThrow()
      await expect(adminActions.toggleUserAdmin('user-123')).rejects.toThrow()
      await expect(adminActions.deleteUser('user-123')).rejects.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty user list', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

      const result = await adminActions.getAllUsers()

      expect(result).toEqual([])
    })

    it('should handle empty app list', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)
      ;(prisma.app.findMany as jest.Mock).mockResolvedValue([])

      const result = await adminActions.getAllApps()

      expect(result).toEqual([])
    })

    it('should handle zero stats', async () => {
      ;(auth as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.app.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.app.findMany as jest.Mock).mockResolvedValue([])

      const result = await adminActions.getPlatformStats()

      expect(result.totalUsers).toBe(0)
      expect(result.totalApps).toBe(0)
      expect(result.publicApps).toBe(0)
      expect(result.usersToday).toBe(0)
    })
  })
})
