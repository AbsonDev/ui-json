import { Pool } from 'pg'
import * as dbActions from '../database-connections'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/encryption'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    databaseConnection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    end: jest.fn(),
  }
  return { Pool: jest.fn(() => mockPool) }
})

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Database Connections Actions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  }

  const mockConnection = {
    id: 'conn-123',
    name: 'Test DB',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    username: 'testuser',
    password: encrypt('testpassword'),
    ssl: false,
    isActive: true,
    lastTestedAt: new Date(),
    lastTestStatus: 'success',
    lastTestError: null,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { apps: 0 },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('getUserDatabaseConnections', () => {
    it('should return all user database connections', async () => {
      const mockConnections = [mockConnection]
      ;(prisma.databaseConnection.findMany as jest.Mock).mockResolvedValue(mockConnections)

      const result = await dbActions.getUserDatabaseConnections()

      expect(prisma.databaseConnection.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          _count: {
            select: { apps: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      expect(result).toHaveLength(1)
      // Password should be masked
      expect(result[0].password).not.toBe('testpassword')
      expect(result[0].password).toContain('••')
    })

    it('should throw error if user is not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.getUserDatabaseConnections()).rejects.toThrow('Unauthorized')
    })

    it('should return empty array if user has no connections', async () => {
      ;(prisma.databaseConnection.findMany as jest.Mock).mockResolvedValue([])

      const result = await dbActions.getUserDatabaseConnections()

      expect(result).toEqual([])
    })
  })

  describe('getDatabaseConnection', () => {
    it('should return a specific database connection', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)

      const result = await dbActions.getDatabaseConnection('conn-123')

      expect(prisma.databaseConnection.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'conn-123',
          userId: 'user-123',
        },
        include: {
          _count: {
            select: { apps: true },
          },
        },
      })

      expect(result).toBeDefined()
      expect(result!.id).toBe('conn-123')
    })

    it('should throw error if connection not found', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.getDatabaseConnection('invalid-id')).rejects.toThrow(
        'Database connection not found'
      )
    })

    it('should prevent access to other users connections', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.getDatabaseConnection('other-user-conn')).rejects.toThrow(
        'Database connection not found'
      )
    })
  })

  describe('createDatabaseConnection', () => {
    const validConnectionData = {
      name: 'New DB',
      host: 'localhost',
      port: 5432,
      database: 'newdb',
      username: 'newuser',
      password: 'newpassword',
      ssl: false,
    }

    it('should create a new database connection', async () => {
      ;(prisma.databaseConnection.create as jest.Mock).mockResolvedValue({
        ...mockConnection,
        name: 'New DB',
      })

      const result = await dbActions.createDatabaseConnection(validConnectionData)

      expect(prisma.databaseConnection.create).toHaveBeenCalled()

      const createCall = (prisma.databaseConnection.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.name).toBe('New DB')
      expect(createCall.data.userId).toBe('user-123')

      // Password should be encrypted
      expect(createCall.data.password).not.toBe('newpassword')
      expect(decrypt(createCall.data.password)).toBe('newpassword')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        host: 'localhost',
        port: 5432,
        database: 'db',
        username: 'user',
        password: 'pass',
        ssl: false,
      }

      await expect(dbActions.createDatabaseConnection(invalidData)).rejects.toThrow()
    })

    it('should validate port number', async () => {
      const invalidPortData = {
        ...validConnectionData,
        port: -1,
      }

      await expect(dbActions.createDatabaseConnection(invalidPortData)).rejects.toThrow()
    })

    it('should handle creation errors', async () => {
      ;(prisma.databaseConnection.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      await expect(dbActions.createDatabaseConnection(validConnectionData)).rejects.toThrow()
    })
  })

  describe('updateDatabaseConnection', () => {
    const updateData = {
      id: 'conn-123',
      name: 'Updated DB',
      host: 'new-host',
      port: 3306,
      database: 'updated-db',
      username: 'updated-user',
      password: 'updated-password',
      ssl: true,
    }

    it('should update an existing database connection', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.update as jest.Mock).mockResolvedValue({
        ...mockConnection,
        ...updateData,
      })

      const result = await dbActions.updateDatabaseConnection(updateData)

      expect(prisma.databaseConnection.update).toHaveBeenCalled()

      const updateCall = (prisma.databaseConnection.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.where.id).toBe('conn-123')
      expect(updateCall.data.name).toBe('Updated DB')
    })

    it('should throw error if connection not found', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.updateDatabaseConnection(updateData)).rejects.toThrow(
        'Database connection not found'
      )
    })

    it('should prevent updating other users connections', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue({
        ...mockConnection,
        userId: 'other-user',
      })

      await expect(dbActions.updateDatabaseConnection(updateData)).rejects.toThrow(
        'Database connection not found or unauthorized'
      )
    })

    it('should not update password if not provided', async () => {
      const updateWithoutPassword = {
        id: 'conn-123',
        name: 'Updated Name',
      }

      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.update as jest.Mock).mockResolvedValue(mockConnection)

      await dbActions.updateDatabaseConnection(updateWithoutPassword)

      const updateCall = (prisma.databaseConnection.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.password).toBeUndefined()
    })

    it('should encrypt new password if provided', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.update as jest.Mock).mockResolvedValue(mockConnection)

      await dbActions.updateDatabaseConnection(updateData)

      const updateCall = (prisma.databaseConnection.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.password).not.toBe('updated-password')
      expect(decrypt(updateCall.data.password)).toBe('updated-password')
    })
  })

  describe('deleteDatabaseConnection', () => {
    it('should delete a database connection', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.delete as jest.Mock).mockResolvedValue(mockConnection)

      const result = await dbActions.deleteDatabaseConnection('conn-123')

      expect(prisma.databaseConnection.delete).toHaveBeenCalledWith({
        where: { id: 'conn-123' },
      })

      expect(result.success).toBe(true)
    })

    it('should throw error if connection not found', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.deleteDatabaseConnection('invalid-id')).rejects.toThrow(
        'Database connection not found'
      )
    })

    it('should prevent deleting other users connections', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue({
        ...mockConnection,
        userId: 'other-user',
      })

      await expect(dbActions.deleteDatabaseConnection('conn-123')).rejects.toThrow(
        'Database connection not found or unauthorized'
      )
    })
  })

  describe('testDatabaseConnection', () => {
    it('should successfully test a valid connection', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      }

      const mockPoolInstance = {
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
      }

      ;(Pool as unknown as jest.Mock).mockImplementation(() => mockPoolInstance)

      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.update as jest.Mock).mockResolvedValue({
        ...mockConnection,
        lastTestStatus: 'success',
      })

      const result = await dbActions.testDatabaseConnection('conn-123')

      expect(result.success).toBe(true)
      expect(mockPoolInstance.connect).toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1')
      expect(mockClient.release).toHaveBeenCalled()
      expect(mockPoolInstance.end).toHaveBeenCalled()
    })

    it('should handle connection failures', async () => {
      const mockPoolInstance = {
        connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
        end: jest.fn(),
      }

      ;(Pool as unknown as jest.Mock).mockImplementation(() => mockPoolInstance)

      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.update as jest.Mock).mockResolvedValue({
        ...mockConnection,
        lastTestStatus: 'failed',
      })

      const result = await dbActions.testDatabaseConnection('conn-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Connection refused')
      expect(mockPoolInstance.end).toHaveBeenCalled()
    })

    it('should throw error if connection not found', async () => {
      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.testDatabaseConnection('invalid-id')).rejects.toThrow(
        'Database connection not found'
      )
    })

    it('should update lastTestedAt timestamp on test', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      }

      const mockPoolInstance = {
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
      }

      ;(Pool as unknown as jest.Mock).mockImplementation(() => mockPoolInstance)

      ;(prisma.databaseConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection)
      ;(prisma.databaseConnection.update as jest.Mock).mockResolvedValue(mockConnection)

      await dbActions.testDatabaseConnection('conn-123')

      const updateCall = (prisma.databaseConnection.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data.lastTestedAt).toBeDefined()
      expect(updateCall.data.lastTestStatus).toBe('success')
      expect(updateCall.data.lastTestError).toBeNull()
    })
  })

  describe('testConnectionBeforeCreate', () => {
    const testConnectionData = {
      name: 'Test Connection',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'testuser',
      password: 'testpassword',
      ssl: false,
    }

    it('should successfully test connection before creation', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      }

      const mockPoolInstance = {
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
      }

      ;(Pool as unknown as jest.Mock).mockImplementation(() => mockPoolInstance)

      const result = await dbActions.testConnectionBeforeCreate(testConnectionData)

      expect(result.success).toBe(true)
      expect(mockPoolInstance.connect).toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1')
    })

    it('should return error on connection failure', async () => {
      const mockPoolInstance = {
        connect: jest.fn().mockRejectedValue(new Error('Authentication failed')),
        end: jest.fn(),
      }

      ;(Pool as unknown as jest.Mock).mockImplementation(() => mockPoolInstance)

      const result = await dbActions.testConnectionBeforeCreate(testConnectionData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Authentication failed')
    })

    it('should validate connection data', async () => {
      const invalidData = {
        ...testConnectionData,
        port: -1,
      }

      await expect(dbActions.testConnectionBeforeCreate(invalidData)).rejects.toThrow()
    })
  })

  describe('Authorization', () => {
    it('should require authentication for all operations', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await expect(dbActions.getUserDatabaseConnections()).rejects.toThrow('Unauthorized')
      await expect(dbActions.getDatabaseConnection('conn-123')).rejects.toThrow('Unauthorized')
      await expect(
        dbActions.createDatabaseConnection({
          name: 'Test',
          host: 'localhost',
          port: 5432,
          database: 'test',
          username: 'test',
          password: 'test',
          ssl: false,
        })
      ).rejects.toThrow('Unauthorized')
      await expect(
        dbActions.updateDatabaseConnection({
          id: 'conn-123',
          name: 'Updated',
        })
      ).rejects.toThrow('Unauthorized')
      await expect(dbActions.deleteDatabaseConnection('conn-123')).rejects.toThrow('Unauthorized')
      await expect(dbActions.testDatabaseConnection('conn-123')).rejects.toThrow('Unauthorized')
    })
  })
})
