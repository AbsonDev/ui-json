import { NextRequest, NextResponse } from 'next/server';
import { getEntities, createEntity } from '@/actions/entities';
import type { CreateEntityRequest } from '@/types';

/**
 * GET /api/apps/[appId]/entities
 * Get all entities for an app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const result = await getEntities(params.appId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({
      entities: result.entities,
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
 * POST /api/apps/[appId]/entities
 * Create a new entity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const body: CreateEntityRequest = await request.json();
    const result = await createEntity(params.appId, body);

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

    return NextResponse.json(
      { entity: result.entity },
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
