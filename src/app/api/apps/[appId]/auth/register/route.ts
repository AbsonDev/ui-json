import { NextRequest, NextResponse } from 'next/server';
import { registerAppUser } from '@/actions/app-auth';
import type { RegisterRequest } from '@/types';

/**
 * POST /api/apps/[appId]/auth/register
 * Register a new user for the app
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  try {
    const body: RegisterRequest = await request.json();
    const result = await registerAppUser(appId, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
      expiresAt: result.expiresAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
