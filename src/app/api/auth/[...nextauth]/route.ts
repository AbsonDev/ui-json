import { handlers } from '@/lib/auth'
import { loginRateLimiter, getClientIdentifier, createRateLimitResponse } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Wrap POST handler with rate limiting for login attempts
const originalPOST = handlers.POST

async function POST(request: NextRequest) {
  // Only rate limit on credentials sign-in (not on other OAuth providers)
  const url = new URL(request.url)
  const isCredentialsSignIn = url.searchParams.get('provider') === 'credentials' ||
                               url.pathname.includes('callback/credentials')

  if (isCredentialsSignIn) {
    // Rate limiting: 5 login attempts per minute per IP
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await loginRateLimiter.check(identifier)

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.resetAt)
    }
  }

  return originalPOST(request)
}

export { GET } from '@/lib/auth'
export { POST }
