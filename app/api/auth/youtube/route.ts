import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value
    const { accessToken, refreshToken } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    // Update user with YouTube tokens
    const updateData: any = { access_token: accessToken }
    if (refreshToken) {
      updateData.refresh_token = refreshToken
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user tokens:', error)
      return NextResponse.json(
        { error: 'Failed to save tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('YouTube auth error:', error)
    return NextResponse.json(
      { error: 'Failed to save YouTube authorization' },
      { status: 500 }
    )
  }
}