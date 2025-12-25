import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader, type JWTPayload } from './jwt';
import { prisma } from './prisma';

export interface AuthContext {
  userId: string;
  appId: string;
  email: string;
  sessionId: string;
  appUser: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    emailVerified: boolean;
    appId: string;
  };
}

export interface AuthResult {
  success: true;
  context: AuthContext;
} | {
  success: false;
  error: string;
  statusCode: number;
}

/**
 * Middleware to authenticate app users from JWT token
 *
 * @param request - Next.js request object
 * @param requireAuth - If true, will return error if no token. If false, returns null context when no token.
 * @returns AuthResult with user context or error
 *
 * @example
 * ```typescript
 * // In an API route
 * const auth = await authenticateAppUser(request);
 * if (!auth.success) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
 * }
 * const { context } = auth;
 * // Use context.userId, context.appUser, etc.
 * ```
 */
export async function authenticateAppUser(
  request: NextRequest,
  requireAuth: boolean = true
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      if (!requireAuth) {
        // Allow anonymous access
        return {
          success: false,
          error: 'No token provided',
          statusCode: 401,
        };
      }
      return {
        success: false,
        error: 'No authentication token provided',
        statusCode: 401,
      };
    }

    // Verify JWT token
    const payload = await verifyToken(token);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      };
    }

    // Check if session exists and is valid
    const session = await prisma.appSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        appUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            emailVerified: true,
            appId: true,
          },
        },
      },
    });

    if (!session) {
      return {
        success: false,
        error: 'Session not found or has been invalidated',
        statusCode: 401,
      };
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.appSession.delete({
        where: { id: session.id },
      });
      return {
        success: false,
        error: 'Session has expired',
        statusCode: 401,
      };
    }

    // Update last used timestamp
    await prisma.appSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      success: true,
      context: {
        userId: payload.userId,
        appId: payload.appId,
        email: payload.email,
        sessionId: payload.sessionId,
        appUser: session.appUser,
      },
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500,
    };
  }
}

/**
 * Extract optional authentication context without requiring it
 * Useful for endpoints that support both authenticated and anonymous access
 *
 * @param request - Next.js request object
 * @returns AuthContext or null if not authenticated
 *
 * @example
 * ```typescript
 * const context = await getOptionalAuthContext(request);
 * if (context) {
 *   // Filter data by context.userId
 * } else {
 *   // Return public data only
 * }
 * ```
 */
export async function getOptionalAuthContext(
  request: NextRequest
): Promise<AuthContext | null> {
  const result = await authenticateAppUser(request, false);
  if (result.success) {
    return result.context;
  }
  return null;
}

/**
 * Verify that authenticated user belongs to the specified app
 * Use this for additional security in app-specific endpoints
 *
 * @param context - Auth context from authenticateAppUser
 * @param appId - The app ID to verify against
 * @returns true if user belongs to app, false otherwise
 */
export function verifyAppAccess(context: AuthContext, appId: string): boolean {
  return context.appId === appId;
}
