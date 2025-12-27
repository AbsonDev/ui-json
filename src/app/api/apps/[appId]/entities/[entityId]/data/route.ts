import { NextRequest, NextResponse } from 'next/server';
import { getEntityData, createEntityData } from '@/actions/entity-data';
import { getOptionalAuthContext } from '@/lib/auth-middleware';
import type { CreateEntityDataRequest, QueryEntityDataRequest } from '@/types';

/**
 * GET /api/apps/[appId]/entities/[entityId]/data
 * Get all data records for an entity with optional filtering and pagination
 *
 * Query params:
 * - limit: number (default 50)
 * - offset: number (default 0)
 * - includeDeleted: boolean (default false)
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (filters data by authenticated user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query: QueryEntityDataRequest = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    };

    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    const result = await getEntityData(params.entityId, query, appUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({
      data: result.data,
      pagination: result.pagination,
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
 * POST /api/apps/[appId]/entities/[entityId]/data
 * Create a new data record
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (assigns ownership to authenticated user)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string } }
) {
  try {
    const body: CreateEntityDataRequest = await request.json();

    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    const result = await createEntityData(params.entityId, body, appUserId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          validationErrors: (result as any).validationErrors,
        },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json(
      { record: result.record },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
