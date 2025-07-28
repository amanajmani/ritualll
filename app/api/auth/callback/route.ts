import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByGoogleId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 OAuth callback received:', request.url)
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    console.log('📋 OAuth parameters:', { 
      hasCode: !!code, 
      codeLength: code?.length, 
      error,
      clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'
    })

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging authorization code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${new URL(request.url).origin}/api/auth/callback`,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/login?error=token_exchange', request.url))
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token } = tokens

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!userResponse.ok) {
      console.error('User info fetch failed')
      return NextResponse.redirect(new URL('/login?error=user_info', request.url))
    }

    const userInfo = await userResponse.json()
    const { id: googleId, email } = userInfo

    // Get timezone from browser (we'll set this properly in the loading page)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    // Check if user exists
    let user = await getUserByGoogleId(googleId)

    if (!user) {
      // Create new user
      user = await createUser({
        email,
        google_id: googleId,
        access_token,
        refresh_token,
        timezone,
      })

      if (!user) {
        return NextResponse.redirect(new URL('/login?error=user_creation', request.url))
      }
    } else {
      // Update existing user's tokens
      const { updateUserTokens } = await import('@/lib/auth')
      await updateUserTokens(user.id, access_token, refresh_token)
    }

    // Set session cookie
    const response = NextResponse.redirect(new URL('/loading', request.url))
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Ensure cookie is available for all paths
    })

    console.log(`✅ User ${user.email} authenticated successfully, redirecting to /loading`)
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    
    // Handle specific timeout errors
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.error('Request timed out - Google servers may be unreachable')
      return NextResponse.redirect(new URL('/login?error=timeout', request.url))
    }
    
    // Handle network connection errors
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.error('Network connection failed - check internet connectivity')
      return NextResponse.redirect(new URL('/login?error=network', request.url))
    }
    
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}