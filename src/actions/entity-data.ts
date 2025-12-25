'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  CreateEntityDataRequest,
  UpdateEntityDataRequest,
  QueryEntityDataRequest,
  EntityDataResponse,
  PaginatedResponse,
  EntityField,
} from '@/types';
import { z } from 'zod';

// ============================================
// Helper Functions
// ============================================

function formatEntityDataResponse(record: any): EntityDataResponse {
  return {
    id: record.id,
    data: record.data as Record<string, any>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt?.toISOString() || null,
  };
}

async function verifyEntityOwnership(entityId: string, userId: string) {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    include: {
      app: { select: { userId: true } },
    },
  });

  if (!entity) {
    throw new Error('Entity not found');
  }

  if (entity.app.userId !== userId) {
    throw new Error('Unauthorized: You do not own this entity');
  }

  return entity;
}

/**
 * Validate data against entity field definitions
 */
function validateEntityData(data: Record<string, any>, fields: EntityField[]) {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = data[field.name];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.name] = `${field.displayName || field.name} is required`;
      continue;
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
      case 'text':
        if (typeof value !== 'string') {
          errors[field.name] = `${field.displayName || field.name} must be a string`;
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors[field.name] = `${field.displayName || field.name} must be a number`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors[field.name] = `${field.displayName || field.name} must be a boolean`;
        }
        break;

      case 'date':
      case 'datetime':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[field.name] = `${field.displayName || field.name} must be a valid date`;
        }
        break;

      case 'json':
        if (typeof value !== 'object') {
          errors[field.name] = `${field.displayName || field.name} must be a JSON object`;
        }
        break;
    }

    // Email validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field.name] = `${field.displayName || field.name} must be a valid email`;
      }
    }

    // URL validation
    if (field.type === 'url') {
      try {
        new URL(value);
      } catch {
        errors[field.name] = `${field.displayName || field.name} must be a valid URL`;
      }
    }

    // Custom validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case 'min':
            if (typeof value === 'number' && value < rule.value) {
              errors[field.name] = rule.message || `${field.displayName || field.name} must be at least ${rule.value}`;
            } else if (typeof value === 'string' && value.length < rule.value) {
              errors[field.name] = rule.message || `${field.displayName || field.name} must be at least ${rule.value} characters`;
            }
            break;

          case 'max':
            if (typeof value === 'number' && value > rule.value) {
              errors[field.name] = rule.message || `${field.displayName || field.name} must be at most ${rule.value}`;
            } else if (typeof value === 'string' && value.length > rule.value) {
              errors[field.name] = rule.message || `${field.displayName || field.name} must be at most ${rule.value} characters`;
            }
            break;

          case 'pattern':
            if (typeof value === 'string') {
              const regex = new RegExp(rule.value);
              if (!regex.test(value)) {
                errors[field.name] = rule.message || `${field.displayName || field.name} format is invalid`;
              }
            }
            break;
        }
      }
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Apply default values to data
 */
function applyDefaults(data: Record<string, any>, fields: EntityField[]): Record<string, any> {
  const result = { ...data };

  for (const field of fields) {
    if (result[field.name] === undefined && field.defaultValue !== undefined) {
      result[field.name] = field.defaultValue;
    }
  }

  return result;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get all data records for an entity with optional filtering and pagination
 */
export async function getEntityData(entityId: string, query?: QueryEntityDataRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const entity = await verifyEntityOwnership(entityId, session.user.id);

    const limit = query?.limit || 50;
    const offset = query?.offset || 0;
    const includeDeleted = query?.includeDeleted || false;

    // Build where clause
    const where: any = { entityId };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Get total count
    const total = await prisma.entityData.count({ where });

    // Get records
    const records = await prisma.entityData.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const response: PaginatedResponse<EntityDataResponse> = {
      data: records.map(formatEntityDataResponse),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + records.length < total,
      },
    };

    return {
      success: true,
      ...response,
    };
  } catch (error: any) {
    console.error('Error getting entity data:', error);
    return {
      success: false,
      error: error.message || 'Failed to get entity data',
    };
  }
}

/**
 * Get a single data record by ID
 */
export async function getEntityDataById(recordId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const record = await prisma.entityData.findUnique({
      where: { id: recordId },
      include: {
        entity: {
          include: {
            app: { select: { userId: true } },
          },
        },
      },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    // Verify ownership
    if (record.entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      record: formatEntityDataResponse(record),
    };
  } catch (error: any) {
    console.error('Error getting entity data by ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to get record',
    };
  }
}

/**
 * Create a new data record
 */
export async function createEntityData(entityId: string, request: CreateEntityDataRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and get entity
    const entity = await verifyEntityOwnership(entityId, session.user.id);
    const fields = entity.fields as EntityField[];

    // Apply defaults
    let data = applyDefaults(request.data, fields);

    // Validate data
    const validation = validateEntityData(data, fields);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
      };
    }

    // Check unique constraints
    for (const field of fields) {
      if (field.unique && data[field.name] !== undefined) {
        const existing = await prisma.entityData.findFirst({
          where: {
            entityId,
            deletedAt: null,
            data: {
              path: [field.name],
              equals: data[field.name],
            },
          },
        });

        if (existing) {
          return {
            success: false,
            error: `${field.displayName || field.name} must be unique. This value already exists.`,
          };
        }
      }
    }

    // Create record
    const record = await prisma.entityData.create({
      data: {
        entityId,
        data: data as any,
      },
    });

    return {
      success: true,
      record: formatEntityDataResponse(record),
    };
  } catch (error: any) {
    console.error('Error creating entity data:', error);
    return {
      success: false,
      error: error.message || 'Failed to create record',
    };
  }
}

/**
 * Update a data record
 */
export async function updateEntityData(recordId: string, request: UpdateEntityDataRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get record and verify ownership
    const record = await prisma.entityData.findUnique({
      where: { id: recordId },
      include: {
        entity: {
          include: {
            app: { select: { userId: true } },
          },
        },
      },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    if (record.entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const fields = record.entity.fields as EntityField[];

    // Merge with existing data
    const mergedData = {
      ...(record.data as Record<string, any>),
      ...request.data,
    };

    // Validate data
    const validation = validateEntityData(mergedData, fields);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
      };
    }

    // Check unique constraints (excluding current record)
    for (const field of fields) {
      if (field.unique && mergedData[field.name] !== undefined) {
        const existing = await prisma.entityData.findFirst({
          where: {
            entityId: record.entityId,
            deletedAt: null,
            id: { not: recordId },
            data: {
              path: [field.name],
              equals: mergedData[field.name],
            },
          },
        });

        if (existing) {
          return {
            success: false,
            error: `${field.displayName || field.name} must be unique. This value already exists.`,
          };
        }
      }
    }

    // Update record
    const updated = await prisma.entityData.update({
      where: { id: recordId },
      data: {
        data: mergedData as any,
      },
    });

    return {
      success: true,
      record: formatEntityDataResponse(updated),
    };
  } catch (error: any) {
    console.error('Error updating entity data:', error);
    return {
      success: false,
      error: error.message || 'Failed to update record',
    };
  }
}

/**
 * Delete a data record (hard delete or soft delete based on entity settings)
 */
export async function deleteEntityData(recordId: string, hardDelete: boolean = false) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get record and verify ownership
    const record = await prisma.entityData.findUnique({
      where: { id: recordId },
      include: {
        entity: {
          include: {
            app: { select: { userId: true } },
          },
        },
      },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    if (record.entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Determine delete type
    const useSoftDelete = record.entity.softDelete && !hardDelete;

    if (useSoftDelete) {
      // Soft delete
      await prisma.entityData.update({
        where: { id: recordId },
        data: { deletedAt: new Date() },
      });
    } else {
      // Hard delete
      await prisma.entityData.delete({
        where: { id: recordId },
      });
    }

    return {
      success: true,
      message: 'Record deleted successfully',
      deletedType: useSoftDelete ? 'soft' : 'hard',
    };
  } catch (error: any) {
    console.error('Error deleting entity data:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete record',
    };
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreEntityData(recordId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get record and verify ownership
    const record = await prisma.entityData.findUnique({
      where: { id: recordId },
      include: {
        entity: {
          include: {
            app: { select: { userId: true } },
          },
        },
      },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    if (record.entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!record.deletedAt) {
      return { success: false, error: 'Record is not deleted' };
    }

    // Restore record
    const restored = await prisma.entityData.update({
      where: { id: recordId },
      data: { deletedAt: null },
    });

    return {
      success: true,
      record: formatEntityDataResponse(restored),
      message: 'Record restored successfully',
    };
  } catch (error: any) {
    console.error('Error restoring entity data:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore record',
    };
  }
}
