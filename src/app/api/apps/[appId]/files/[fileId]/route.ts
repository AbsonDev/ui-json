import { NextRequest, NextResponse } from 'next/server';
import { getFile, deleteFile } from '@/actions/files';
import { getOptionalAuthContext } from '@/lib/auth-middleware';

/**
 * GET /api/apps/[appId]/files/[fileId]
 * Get file metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string; fileId: string } }
) {
  try {
    const result = await getFile(params.fileId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 404 }
      );
    }

    return NextResponse.json({ file: result.file });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[appId]/files/[fileId]
 * Delete a file
 *
 * Optional Headers:
 * - Authorization: Bearer {app_user_token} (ensures user can only delete their own files)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string; fileId: string } }
) {
  try {
    // Check if app user is authenticated (optional)
    const authContext = await getOptionalAuthContext(request);
    const appUserId = authContext?.userId;

    const result = await deleteFile(params.fileId, appUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
