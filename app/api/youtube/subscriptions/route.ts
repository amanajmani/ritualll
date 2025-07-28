import { NextRequest, NextResponse } from 'next/server'
import { YouTubeAPI } from '@/lib/youtube'
import { insertSubscriptions } from '@/lib/db/subscriptions'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's access token
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('access_token')
      .eq('id', userId)
      .single()

    if (error || !user?.access_token) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      )
    }

    // Fetch subscriptions from YouTube
    const youtube = new YouTubeAPI(user.access_token)
    const subscriptions = await youtube.getAllSubscriptions()

    // Transform and insert subscriptions
    const subscriptionData = subscriptions.map((sub) => ({
      id: sub.snippet.resourceId.channelId,
      title: sub.snippet.title,
      thumbnail_url: sub.snippet.thumbnails.high?.url || sub.snippet.thumbnails.medium?.url || '',
    }))

    const success = await insertSubscriptions(userId, subscriptionData)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save subscriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: subscriptionData.length,
    })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}