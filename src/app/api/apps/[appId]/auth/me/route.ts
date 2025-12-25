import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/actions/app-auth';
import { extractTokenFromHeader } from '@/lib/jwt';

/**
 * GET /api/apps/[appId]/auth/me
 * Get current user from token
 *
 * Headers:
 * Authorization: Bearer {token}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const result = await getCurrentAppUser(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
