import { NextRequest, NextResponse } from 'next/server';
import { updateAppUserProfile } from '@/actions/app-auth';
import { extractTokenFromHeader } from '@/lib/jwt';
import type { UpdateProfileRequest } from '@/types';

/**
 * PUT /api/apps/[appId]/auth/profile
 * Update user profile
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

    const body: UpdateProfileRequest = await request.json();
    const result = await updateAppUserProfile(token, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
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
