import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getFiles } from '@/actions/files';
import { getOptionalAuthContext } from '@/lib/auth-middleware';

/**
 * POST /api/apps/[appId]/files
 * Upload a new file
 *
 * Body: FormData with 'file' field
 * Optional Fields:
 * - isPublic: boolean (default false)
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (assigns ownership to authenticated user)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    // Get form data
    const formData = await request.formData();

    // Upload file
    const result = await uploadFile(params.appId, formData, appUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { file: result.file },
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

/**
 * GET /api/apps/[appId]/files
 * List files for an app
 *
 * Query params:
 * - limit: number (default 50)
 * - offset: number (default 0)
 * - mimeType: string (e.g., "image/*" or "image/jpeg")
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (filters files by authenticated user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      mimeType: searchParams.get('mimeType') || undefined,
    };

    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    const result = await getFiles(params.appId, query, appUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({
      files: result.files,
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
