import * as entityActions from '../entities'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { EntityField } from '@/types'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    entity: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    app: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

describe('Entity Actions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  }

  const mockApp = {
    id: 'app-123',
    userId: 'user-123',
    name: 'Test App',
  }

  const mockFields: EntityField[] = [
    {
      name: 'title',
      type: 'string',
      displayName: 'Title',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      displayName: 'Price',
      required: true,
    },
    {
      name: 'inStock',
      type: 'boolean',
      defaultValue: true,
    },
  ]

  const mockEntity = {
    id: 'entity-123',
    name: 'Product',
    displayName: 'Products',
    description: 'E-commerce products',
    fields: mockFields,
    timestamps: true,
    softDelete: false,
    appId: 'app-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { records: 5 },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('getEntities', () => {
    it('should return all entities for an app', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)
      ;(prisma.entity.findMany as jest.Mock).mockResolvedValue([mockEntity])

      const result = await entityActions.getEntities('app-123')

      expect(prisma.app.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        select: { userId: true },
      })

      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: { appId: 'app-123' },
        include: {
          _count: {
            select: { records: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      expect(result.success).toBe(true)
      expect(result.entities).toHaveLength(1)
      expect(result.entities![0].name).toBe('Product')
      expect(result.entities![0].recordCount).toBe(5)
    })

    it('should return error if user is not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      const result = await entityActions.getEntities('app-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return error if app not found', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityActions.getEntities('app-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('App not found')
    })

    it('should return error if user does not own the app', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue({
        ...mockApp,
        userId: 'other-user',
      })

      const result = await entityActions.getEntities('app-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: You do not own this app')
    })

    it('should return empty array if app has no entities', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)
      ;(prisma.entity.findMany as jest.Mock).mockResolvedValue([])

      const result = await entityActions.getEntities('app-123')

      expect(result.success).toBe(true)
      expect(result.entities).toHaveLength(0)
    })
  })

  describe('getEntity', () => {
    it('should return a single entity', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'user-123' },
      })

      const result = await entityActions.getEntity('entity-123')

      expect(prisma.entity.findUnique).toHaveBeenCalledWith({
        where: { id: 'entity-123' },
        include: {
          app: { select: { userId: true } },
          _count: {
            select: { records: true },
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.entity!.name).toBe('Product')
    })

    it('should return error if entity not found', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityActions.getEntity('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Entity not found')
    })

    it('should return error if user does not own the entity', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'other-user' },
      })

      const result = await entityActions.getEntity('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('createEntity', () => {
    const validEntityData = {
      name: 'Product',
      displayName: 'Products',
      description: 'E-commerce products',
      fields: mockFields,
      timestamps: true,
      softDelete: false,
    }

    it('should create a new entity', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(null) // No existing entity
      ;(prisma.entity.create as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityActions.createEntity('app-123', validEntityData)

      expect(result.success).toBe(true)
      expect(result.entity!.name).toBe('Product')

      expect(prisma.entity.create).toHaveBeenCalledWith({
        data: {
          appId: 'app-123',
          name: 'Product',
          displayName: 'Products',
          description: 'E-commerce products',
          fields: mockFields,
          timestamps: true,
          softDelete: false,
        },
        include: {
          _count: {
            select: { records: true },
          },
        },
      })
    })

    it('should reject invalid entity name (not PascalCase)', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)

      const result = await entityActions.createEntity('app-123', {
        ...validEntityData,
        name: 'product', // lowercase
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should reject entity with duplicate name', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityActions.createEntity('app-123', validEntityData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })

    it('should reject entity with duplicate field names', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityActions.createEntity('app-123', {
        ...validEntityData,
        fields: [
          { name: 'title', type: 'string' },
          { name: 'title', type: 'string' }, // duplicate
        ],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Field names must be unique')
    })

    it('should reject invalid field name (not camelCase)', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)

      const result = await entityActions.createEntity('app-123', {
        ...validEntityData,
        fields: [
          { name: 'Title', type: 'string' }, // PascalCase instead of camelCase
        ],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation error')
    })

    it('should use entity name as displayName if not provided', async () => {
      ;(prisma.app.findUnique as jest.Mock).mockResolvedValue(mockApp)
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.entity.create as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityActions.createEntity('app-123', {
        name: 'Product',
        fields: mockFields,
      })

      expect(result.success).toBe(true)
      expect(prisma.entity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayName: 'Product',
          }),
        })
      )
    })
  })

  describe('updateEntity', () => {
    it('should update an entity', async () => {
      ;(prisma.entity.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          ...mockEntity,
          app: { userId: 'user-123' },
        })

      ;(prisma.entity.update as jest.Mock).mockResolvedValue({
        ...mockEntity,
        displayName: 'Updated Products',
      })

      const result = await entityActions.updateEntity('entity-123', {
        displayName: 'Updated Products',
      })

      expect(result.success).toBe(true)
      expect(prisma.entity.update).toHaveBeenCalled()
    })

    it('should reject update with duplicate field names', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'user-123' },
      })

      const result = await entityActions.updateEntity('entity-123', {
        fields: [
          { name: 'title', type: 'string' },
          { name: 'title', type: 'string' }, // duplicate
        ],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Field names must be unique')
    })

    it('should return error if entity not found', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityActions.updateEntity('entity-123', {
        displayName: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Entity not found')
    })

    it('should return error if user does not own the entity', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'other-user' },
      })

      const result = await entityActions.updateEntity('entity-123', {
        displayName: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('deleteEntity', () => {
    it('should delete an entity with no records', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'user-123' },
        _count: { records: 0 },
      })
      ;(prisma.entity.delete as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityActions.deleteEntity('entity-123')

      expect(result.success).toBe(true)
      expect(prisma.entity.delete).toHaveBeenCalledWith({
        where: { id: 'entity-123' },
      })
    })

    it('should prevent deletion of entity with existing records', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'user-123' },
        _count: { records: 5 },
      })

      const result = await entityActions.deleteEntity('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot delete entity with 5 existing records')
      expect(prisma.entity.delete).not.toHaveBeenCalled()
    })

    it('should return error if entity not found', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityActions.deleteEntity('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Entity not found')
    })

    it('should return error if user does not own the entity', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'other-user' },
        _count: { records: 0 },
      })

      const result = await entityActions.deleteEntity('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })
})
