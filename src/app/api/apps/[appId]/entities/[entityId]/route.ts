import { NextRequest, NextResponse } from 'next/server';
import { getEntity, updateEntity, deleteEntity } from '@/actions/entities';
import type { UpdateEntityRequest } from '@/types';

/**
 * GET /api/apps/[appId]/entities/[entityId]
 * Get a single entity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string } }
) {
  try {
    const result = await getEntity(params.entityId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 404 }
      );
    }

    return NextResponse.json({ entity: result.entity });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/apps/[appId]/entities/[entityId]
 * Update an entity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string } }
) {
  try {
    const body: UpdateEntityRequest = await request.json();
    const result = await updateEntity(params.entityId, body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          details: (result as any).details,
          validationErrors: (result as any).validationErrors,
        },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({ entity: result.entity });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[appId]/entities/[entityId]
 * Delete an entity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string } }
) {
  try {
    const result = await deleteEntity(params.entityId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
