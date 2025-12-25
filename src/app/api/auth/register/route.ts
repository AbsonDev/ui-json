import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import { registerRateLimiter, getClientIdentifier, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 registration attempts per minute per IP
    const identifier = getClientIdentifier(request)
    const rateLimitResult = registerRateLimiter.check(identifier)

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.resetAt)
    }

    const body = await request.json()
    const user = await registerUser(body)

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    )
  }
}
