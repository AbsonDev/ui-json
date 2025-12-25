import { NextRequest, NextResponse } from 'next/server';
import { loginAppUser } from '@/actions/app-auth';
import type { LoginRequest } from '@/types';

/**
 * POST /api/apps/[appId]/auth/login
 * Login user and create session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const body: LoginRequest = await request.json();
    const result = await loginAppUser(params.appId, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
