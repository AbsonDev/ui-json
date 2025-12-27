import { NextRequest, NextResponse } from 'next/server';
import { changeAppUserPassword } from '@/actions/app-auth';
import { extractTokenFromHeader } from '@/lib/jwt';
import type { ChangePasswordRequest } from '@/types';

/**
 * PUT /api/apps/[appId]/auth/password
 * Change user password
 *
 * Headers:
 * Authorization: Bearer {token}
 */
export async function PUT(
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

    const body: ChangePasswordRequest = await request.json();
    const result = await changeAppUserPassword(token, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
