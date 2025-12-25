'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  CreateEntityRequest,
  UpdateEntityRequest,
  EntityResponse,
} from '@/types';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const entityFieldSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  type: z.enum(['string', 'number', 'boolean', 'date', 'datetime', 'email', 'url', 'text', 'json', 'relation']),
  displayName: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.any().optional(),
  validation: z.array(z.object({
    type: z.enum(['required', 'min', 'max', 'pattern', 'email', 'url', 'unique', 'custom']),
    value: z.any().optional(),
    message: z.string().optional(),
  })).optional(),
  relationTo: z.string().optional(),
  relationType: z.enum(['1:1', '1:N', 'N:N']).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  indexed: z.boolean().optional(),
  searchable: z.boolean().optional(),
  sortable: z.boolean().optional(),
});

const createEntitySchema = z.object({
  name: z.string().min(1).max(50).regex(/^[A-Z][a-zA-Z0-9]*$/, 'Entity name must be PascalCase'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(entityFieldSchema).min(1, 'Entity must have at least one field'),
  timestamps: z.boolean().optional().default(true),
  softDelete: z.boolean().optional().default(false),
});

const updateEntitySchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(entityFieldSchema).optional(),
  timestamps: z.boolean().optional(),
  softDelete: z.boolean().optional(),
});

// ============================================
// Helper Functions
// ============================================

function formatEntityResponse(entity: any): EntityResponse {
  return {
    id: entity.id,
    name: entity.name,
    displayName: entity.displayName || entity.name,
    description: entity.description || undefined,
    fields: entity.fields as any,
    timestamps: entity.timestamps,
    softDelete: entity.softDelete,
    recordCount: entity._count?.records,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

async function verifyAppOwnership(appId: string, userId: string) {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { userId: true },
  });

  if (!app) {
    throw new Error('App not found');
  }

  if (app.userId !== userId) {
    throw new Error('Unauthorized: You do not own this app');
  }

  return app;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get all entities for an app
 */
export async function getEntities(appId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    await verifyAppOwnership(appId, session.user.id);

    // Get entities
    const entities = await prisma.entity.findMany({
      where: { appId },
      include: {
        _count: {
          select: { records: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      entities: entities.map(formatEntityResponse),
    };
  } catch (error: any) {
    console.error('Error getting entities:', error);
    return {
      success: false,
      error: error.message || 'Failed to get entities',
    };
  }
}

/**
 * Get a single entity by ID
 */
export async function getEntity(entityId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        app: { select: { userId: true } },
        _count: {
          select: { records: true },
        },
      },
    });

    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }

    // Verify ownership
    if (entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      entity: formatEntityResponse(entity),
    };
  } catch (error: any) {
    console.error('Error getting entity:', error);
    return {
      success: false,
      error: error.message || 'Failed to get entity',
    };
  }
}

/**
 * Create a new entity
 */
export async function createEntity(appId: string, data: CreateEntityRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    await verifyAppOwnership(appId, session.user.id);

    // Validate input
    const validated = createEntitySchema.parse(data);

    // Check if entity name already exists for this app
    const existing = await prisma.entity.findUnique({
      where: {
        appId_name: {
          appId,
          name: validated.name,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Entity with name "${validated.name}" already exists in this app`,
      };
    }

    // Validate field names are unique
    const fieldNames = validated.fields.map((f) => f.name);
    const uniqueFieldNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueFieldNames.size) {
      return {
        success: false,
        error: 'Field names must be unique within an entity',
      };
    }

    // Create entity
    const entity = await prisma.entity.create({
      data: {
        appId,
        name: validated.name,
        displayName: validated.displayName || validated.name,
        description: validated.description,
        fields: validated.fields as any,
        timestamps: validated.timestamps ?? true,
        softDelete: validated.softDelete ?? false,
      },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    return {
      success: true,
      entity: formatEntityResponse(entity),
    };
  } catch (error: any) {
    console.error('Error creating entity:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to create entity',
    };
  }
}

/**
 * Update an entity
 */
export async function updateEntity(entityId: string, data: UpdateEntityRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get entity and verify ownership
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        app: { select: { userId: true } },
      },
    });

    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }

    if (entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validated = updateEntitySchema.parse(data);

    // If updating fields, validate uniqueness
    if (validated.fields) {
      const fieldNames = validated.fields.map((f) => f.name);
      const uniqueFieldNames = new Set(fieldNames);
      if (fieldNames.length !== uniqueFieldNames.size) {
        return {
          success: false,
          error: 'Field names must be unique within an entity',
        };
      }
    }

    // Update entity
    const updated = await prisma.entity.update({
      where: { id: entityId },
      data: {
        displayName: validated.displayName,
        description: validated.description,
        fields: validated.fields as any,
        timestamps: validated.timestamps,
        softDelete: validated.softDelete,
      },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    return {
      success: true,
      entity: formatEntityResponse(updated),
    };
  } catch (error: any) {
    console.error('Error updating entity:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to update entity',
    };
  }
}

/**
 * Delete an entity
 */
export async function deleteEntity(entityId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get entity and verify ownership
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        app: { select: { userId: true } },
        _count: {
          select: { records: true },
        },
      },
    });

    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }

    if (entity.app.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if entity has records
    if (entity._count.records > 0) {
      return {
        success: false,
        error: `Cannot delete entity with ${entity._count.records} existing records. Delete all records first.`,
      };
    }

    // Delete entity
    await prisma.entity.delete({
      where: { id: entityId },
    });

    return {
      success: true,
      message: 'Entity deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting entity:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete entity',
    };
  }
}
