import { NextRequest, NextResponse } from 'next/server';
import { getFileQuota } from '@/actions/files';
import { authenticateAppUser } from '@/lib/auth-middleware';

/**
 * GET /api/apps/[appId]/files/quota
 * Get file storage quota for authenticated app user
 *
 * Headers:
 * - Authorization: Bearer {app_user_token} (required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    // Authenticate app user (required for quota check)
    const auth = await authenticateAppUser(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const { context } = auth;

    // Get quota
    const result = await getFileQuota(params.appId, context.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ quota: result.quota });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
