import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'
import { createUser, getUserByGoogleId } from '@/lib/auth'

interface GoogleJWTPayload {
  sub: string
  email: string
  name: string
  picture: string
}

export async function POST(request: NextRequest) {
  try {
    const { credential, timezone } = await request.json()

    if (!credential || !timezone) {
      return NextResponse.json(
        { error: 'Missing credential or timezone' },
        { status: 400 }
      )
    }

    // Decode the JWT token from Google
    const decoded = jwtDecode<GoogleJWTPayload>(credential)
    const { sub: googleId, email } = decoded

    // Check if user already exists
    let user = await getUserByGoogleId(googleId)

    if (!user) {
      // Create new user
      user = await createUser({
        email,
        google_id: googleId,
        access_token: '', // Will be set during onboarding
        timezone,
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }
    }

    // Set session cookie (simple approach for now)
    const response = NextResponse.json({ success: true, user })
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}