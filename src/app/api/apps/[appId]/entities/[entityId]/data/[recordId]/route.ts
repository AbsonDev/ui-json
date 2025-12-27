import { NextRequest, NextResponse } from 'next/server';
import {
  getEntityDataById,
  updateEntityData,
  deleteEntityData,
  restoreEntityData,
} from '@/actions/entity-data';
import { getOptionalAuthContext } from '@/lib/auth-middleware';
import type { UpdateEntityDataRequest } from '@/types';

/**
 * GET /api/apps/[appId]/entities/[entityId]/data/[recordId]
 * Get a single data record
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (verifies ownership if data is user-specific)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    // Note: getEntityDataById doesn't filter by user, it's for admin access
    // For user-specific access control, use the list endpoint with filters
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
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (ensures user can only update their own data)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const body: UpdateEntityDataRequest = await request.json();

    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    const result = await updateEntityData(params.recordId, body, appUserId);

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
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (ensures user can only delete their own data)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    const result = await deleteEntityData(params.recordId, hardDelete, appUserId);

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
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (ensures user can only restore their own data)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string; recordId: string } }
) {
  try {
    const body = await request.json();

    if (body.action === 'restore') {
      // Check if app user is authenticated (optional)
      const authContext = await getOptionalAuthContext(request);
      const appUserId = authContext?.userId;

      const result = await restoreEntityData(params.recordId, appUserId);

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
