import { NextRequest, NextResponse } from 'next/server';
import { logoutAppUser } from '@/actions/app-auth';
import { extractTokenFromHeader } from '@/lib/jwt';

/**
 * POST /api/apps/[appId]/auth/logout
 * Logout user and invalidate session
 *
 * Headers:
 * Authorization: Bearer {token}
 */
export async function POST(
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

    const result = await logoutAppUser(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
