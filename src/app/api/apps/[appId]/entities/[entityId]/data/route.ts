import { NextRequest, NextResponse } from 'next/server';
import { getEntityData, createEntityData } from '@/actions/entity-data';
import type { CreateEntityDataRequest, QueryEntityDataRequest } from '@/types';

/**
 * GET /api/apps/[appId]/entities/[entityId]/data
 * Get all data records for an entity with optional filtering and pagination
 *
 * Query params:
 * - limit: number (default 50)
 * - offset: number (default 0)
 * - includeDeleted: boolean (default false)
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

    const result = await getEntityData(params.entityId, query);

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
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string; entityId: string } }
) {
  try {
    const body: CreateEntityDataRequest = await request.json();
    const result = await createEntityData(params.entityId, body);

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
