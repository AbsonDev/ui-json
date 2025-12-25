import { NextRequest, NextResponse } from 'next/server';
import {
  getEntityDataById,
  updateEntityData,
  deleteEntityData,
  restoreEntityData,
} from '@/actions/entity-data';
import type { UpdateEntityDataRequest } from '@/types';

/**
 * GET /api/apps/[appId]/entities/[entityId]/data/[recordId]
 * Get a single data record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const result = await getEntityDataById(params.recordId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 404 }
      );
    }

    return NextResponse.json({ record: result.record });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/apps/[appId]/entities/[entityId]/data/[recordId]
 * Update a data record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const body: UpdateEntityDataRequest = await request.json();
    const result = await updateEntityData(params.recordId, body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          validationErrors: (result as any).validationErrors,
        },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({ record: result.record });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[appId]/entities/[entityId]/data/[recordId]
 * Delete a data record (soft or hard delete)
 *
 * Query params:
 * - hard: boolean (default false) - Force hard delete even if soft delete is enabled
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    const result = await deleteEntityData(params.recordId, hardDelete);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      deletedType: result.deletedType,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/apps/[appId]/entities/[entityId]/data/[recordId]
 * Restore a soft-deleted record
 *
 * Body: { action: "restore" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const body = await request.json();

    if (body.action === 'restore') {
      const result = await restoreEntityData(params.recordId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === 'Unauthorized' ? 401 : 400 }
        );
      }

      return NextResponse.json({
        record: result.record,
        message: result.message,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: restore' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
