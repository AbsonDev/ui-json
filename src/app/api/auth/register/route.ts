import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
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
