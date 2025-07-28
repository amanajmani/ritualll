import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value

    if (!userId) {
      return NextResponse.json({ authenticated: false })
    }

    // Verify user exists in database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: { id: user.id, email: user.email }
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}