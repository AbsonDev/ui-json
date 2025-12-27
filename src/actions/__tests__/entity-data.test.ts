import * as entityDataActions from '../entity-data'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { EntityField } from '@/types'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    entityData: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    entity: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

describe('Entity Data Actions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
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
      validation: [
        { type: 'min', value: 0, message: 'Price must be positive' },
      ],
    },
    {
      name: 'email',
      type: 'email',
      displayName: 'Email',
      required: false,
    },
    {
      name: 'url',
      type: 'url',
      displayName: 'URL',
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
    fields: mockFields,
    timestamps: true,
    softDelete: false,
    appId: 'app-123',
    app: { userId: 'user-123' },
  }

  const mockRecord = {
    id: 'record-123',
    entityId: 'entity-123',
    data: {
      title: 'iPhone 15 Pro',
      price: 999.99,
      email: 'contact@example.com',
      url: 'https://example.com',
      inStock: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('getEntityData', () => {
    it('should return paginated entity data', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)
      ;(prisma.entityData.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.entityData.findMany as jest.Mock).mockResolvedValue([mockRecord])

      const result = await entityDataActions.getEntityData('entity-123', {
        limit: 5,
        offset: 0,
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.pagination).toEqual({
        total: 10,
        limit: 5,
        offset: 0,
        hasMore: true,
      })

      expect(prisma.entityData.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-123', deletedAt: null },
        take: 5,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should use default limit and offset', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)
      ;(prisma.entityData.count as jest.Mock).mockResolvedValue(5)
      ;(prisma.entityData.findMany as jest.Mock).mockResolvedValue([])

      const result = await entityDataActions.getEntityData('entity-123')

      expect(prisma.entityData.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-123', deletedAt: null },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should include deleted records when requested', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)
      ;(prisma.entityData.count as jest.Mock).mockResolvedValue(5)
      ;(prisma.entityData.findMany as jest.Mock).mockResolvedValue([])

      await entityDataActions.getEntityData('entity-123', {
        includeDeleted: true,
      })

      expect(prisma.entityData.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-123' },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return error if user is not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      const result = await entityDataActions.getEntityData('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return error if user does not own the entity', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        app: { userId: 'other-user' },
      })

      const result = await entityDataActions.getEntityData('entity-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('getEntityDataById', () => {
    it('should return a single record', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: mockEntity,
      })

      const result = await entityDataActions.getEntityDataById('record-123')

      expect(result.success).toBe(true)
      expect(result.record!.data.title).toBe('iPhone 15 Pro')
    })

    it('should return error if record not found', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityDataActions.getEntityDataById('record-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Record not found')
    })
  })

  describe('createEntityData', () => {
    it('should create a new record with valid data', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)
      ;(prisma.entityData.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.entityData.create as jest.Mock).mockResolvedValue(mockRecord)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: {
          title: 'iPhone 15 Pro',
          price: 999.99,
          email: 'contact@example.com',
          url: 'https://example.com',
        },
      })

      expect(result.success).toBe(true)
      expect(result.record!.data.title).toBe('iPhone 15 Pro')
    })

    it('should apply default values', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)
      ;(prisma.entityData.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.entityData.create as jest.Mock).mockResolvedValue({
        ...mockRecord,
        data: { title: 'Test', price: 10, inStock: true },
      })

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { title: 'Test', price: 10 },
      })

      expect(result.success).toBe(true)
      // inStock should be true (default value)
      expect(prisma.entityData.create).toHaveBeenCalledWith({
        data: {
          entityId: 'entity-123',
          data: { title: 'Test', price: 10, inStock: true },
        },
      })
    })

    it('should reject data missing required fields', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { price: 999.99 }, // missing required 'title'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect((result as any).validationErrors.title).toContain('required')
    })

    it('should reject invalid type (string instead of number)', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { title: 'Test', price: 'invalid' as any },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.price).toContain('must be a number')
    })

    it('should reject invalid email format', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: {
          title: 'Test',
          price: 10,
          email: 'not-an-email',
        },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.email).toContain('valid email')
    })

    it('should reject invalid URL format', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: {
          title: 'Test',
          price: 10,
          url: 'not-a-url',
        },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.url).toContain('valid URL')
    })

    it('should validate min value constraint', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { title: 'Test', price: -10 },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.price).toContain('Price must be positive')
    })

    it('should enforce unique constraints', async () => {
      const fieldsWithUnique: EntityField[] = [
        {
          name: 'email',
          type: 'email',
          unique: true,
        },
      ]

      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        fields: fieldsWithUnique,
      })

      // Mock existing record with same email
      ;(prisma.entityData.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-record',
        data: { email: 'test@example.com' },
      })

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { email: 'test@example.com' },
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('must be unique')
    })
  })

  describe('updateEntityData', () => {
    it('should update a record', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: mockEntity,
      })
      ;(prisma.entityData.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.entityData.update as jest.Mock).mockResolvedValue({
        ...mockRecord,
        data: { ...mockRecord.data, price: 899.99 },
      })

      const result = await entityDataActions.updateEntityData('record-123', {
        data: { price: 899.99 },
      })

      expect(result.success).toBe(true)
      expect(result.record!.data.price).toBe(899.99)
      // Should preserve other fields
      expect(result.record!.data.title).toBe('iPhone 15 Pro')
    })

    it('should merge with existing data', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: mockEntity,
      })
      ;(prisma.entityData.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.entityData.update as jest.Mock).mockResolvedValue(mockRecord)

      const result = await entityDataActions.updateEntityData('record-123', {
        data: { price: 899.99 },
      })

      expect(prisma.entityData.update).toHaveBeenCalledWith({
        where: { id: 'record-123' },
        data: {
          data: {
            title: 'iPhone 15 Pro',
            price: 899.99,
            email: 'contact@example.com',
            url: 'https://example.com',
            inStock: true,
          },
        },
      })
    })

    it('should validate merged data', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: mockEntity,
      })

      const result = await entityDataActions.updateEntityData('record-123', {
        data: { price: -10 }, // invalid
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.price).toContain('Price must be positive')
    })

    it('should return error if record not found', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityDataActions.updateEntityData('record-123', {
        data: { price: 899.99 },
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Record not found')
    })
  })

  describe('deleteEntityData', () => {
    it('should soft delete by default when entity has soft delete enabled', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: { ...mockEntity, softDelete: true },
      })
      ;(prisma.entityData.update as jest.Mock).mockResolvedValue({
        ...mockRecord,
        deletedAt: new Date(),
      })

      const result = await entityDataActions.deleteEntityData('record-123')

      expect(result.success).toBe(true)
      expect(result.deletedType).toBe('soft')
      expect(prisma.entityData.update).toHaveBeenCalled()
      expect(prisma.entityData.delete).not.toHaveBeenCalled()
    })

    it('should hard delete when entity has soft delete disabled', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: { ...mockEntity, softDelete: false },
      })
      ;(prisma.entityData.delete as jest.Mock).mockResolvedValue(mockRecord)

      const result = await entityDataActions.deleteEntityData('record-123')

      expect(result.success).toBe(true)
      expect(result.deletedType).toBe('hard')
      expect(prisma.entityData.delete).toHaveBeenCalled()
      expect(prisma.entityData.update).not.toHaveBeenCalled()
    })

    it('should force hard delete when hardDelete=true', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        entity: { ...mockEntity, softDelete: true },
      })
      ;(prisma.entityData.delete as jest.Mock).mockResolvedValue(mockRecord)

      const result = await entityDataActions.deleteEntityData('record-123', true)

      expect(result.success).toBe(true)
      expect(result.deletedType).toBe('hard')
      expect(prisma.entityData.delete).toHaveBeenCalled()
    })

    it('should return error if record not found', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityDataActions.deleteEntityData('record-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Record not found')
    })
  })

  describe('restoreEntityData', () => {
    it('should restore a soft-deleted record', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        deletedAt: new Date(),
        entity: mockEntity,
      })
      ;(prisma.entityData.update as jest.Mock).mockResolvedValue({
        ...mockRecord,
        deletedAt: null,
      })

      const result = await entityDataActions.restoreEntityData('record-123')

      expect(result.success).toBe(true)
      expect(prisma.entityData.update).toHaveBeenCalledWith({
        where: { id: 'record-123' },
        data: { deletedAt: null },
      })
    })

    it('should return error if record is not deleted', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecord,
        deletedAt: null,
        entity: mockEntity,
      })

      const result = await entityDataActions.restoreEntityData('record-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Record is not deleted')
    })

    it('should return error if record not found', async () => {
      ;(prisma.entityData.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await entityDataActions.restoreEntityData('record-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Record not found')
    })
  })

  describe('Data Validation', () => {
    it('should validate string type', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { title: 123 as any, price: 10 },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.title).toContain('must be a string')
    })

    it('should validate boolean type', async () => {
      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue(mockEntity)

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { title: 'Test', price: 10, inStock: 'yes' as any },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.inStock).toContain('must be a boolean')
    })

    it('should validate date type', async () => {
      const fieldsWithDate: EntityField[] = [
        { name: 'date', type: 'date' },
      ]

      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        fields: fieldsWithDate,
      })

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { date: 'not-a-date' },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.date).toContain('valid date')
    })

    it('should validate JSON type', async () => {
      const fieldsWithJson: EntityField[] = [
        { name: 'metadata', type: 'json' },
      ]

      ;(prisma.entity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEntity,
        fields: fieldsWithJson,
      })

      const result = await entityDataActions.createEntityData('entity-123', {
        data: { metadata: 'not-an-object' },
      })

      expect(result.success).toBe(false)
      expect((result as any).validationErrors.metadata).toContain('JSON object')
    })
  })
})
