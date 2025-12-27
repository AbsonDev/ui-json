import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'

// Convert secret to Uint8Array
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  userId: string
  appId: string
  email: string
  sessionId: string
}

/**
 * Generate JWT token for app user
 */
export async function generateToken(payload: JWTPayload, expiresIn: string = '7d'): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)

  return token
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)

    return {
      userId: payload.userId as string,
      appId: payload.appId as string,
      email: payload.email as string,
      sessionId: payload.sessionId as string,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Calculate expiration date from duration string
 */
export function getExpirationDate(duration: string = '7d'): Date {
  const now = new Date()

  // Parse duration (e.g., "7d", "24h", "30m")
  const match = duration.match(/^(\d+)([dhm])$/)
  if (!match) {
    throw new Error('Invalid duration format. Use format like: 7d, 24h, 30m')
  }

  const [, amount, unit] = match
  const value = parseInt(amount)

  switch (unit) {
    case 'd':
      now.setDate(now.getDate() + value)
      break
    case 'h':
      now.setHours(now.getHours() + value)
      break
    case 'm':
      now.setMinutes(now.getMinutes() + value)
      break
  }

  return now
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Support both "Bearer token" and just "token"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return authHeader
}
