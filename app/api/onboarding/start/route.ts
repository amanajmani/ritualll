import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { YouTubeAPI } from '@/lib/youtube'
import { insertSubscriptions } from '@/lib/db/subscriptions'

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
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('access_token, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has subscriptions
    const { data: existingSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'User already has subscriptions',
        alreadyOnboarded: true
      })
    }

    // If no access token, we need to get YouTube permissions
    if (!user.access_token) {
      return NextResponse.json({
        success: false,
        needsYouTubeAuth: true,
        message: 'YouTube authorization required'
      })
    }

    try {
      // Fetch subscriptions from YouTube
      console.log(`Fetching YouTube subscriptions for user ${user.email}`)
      const youtube = new YouTubeAPI(user.access_token)
      const subscriptions = await youtube.getAllSubscriptions()

      // Transform subscriptions and prepare for categorization
      const subscriptionData = subscriptions.map((sub) => ({
        id: sub.snippet.resourceId.channelId,
        title: sub.snippet.title,
        thumbnail_url: sub.snippet.thumbnails.high?.url || sub.snippet.thumbnails.medium?.url || '',
        category: 'Other', // Will be updated by categorization
        channel_category: 'Other',
      }))

      // Insert subscriptions first
      const success = await insertSubscriptions(userId, subscriptionData)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to save subscriptions' },
          { status: 500 }
        )
      }

      console.log(`✅ Successfully saved ${subscriptionData.length} subscriptions for user ${user.email}`)

      // Start background processing (don't wait for it)
      setImmediate(async () => {
        try {
          console.log(`🔄 Starting background processing for user ${user.email}`)
          
          // Step 1: Categorize channels
          const { categorizeUserChannels } = await import('@/lib/categorization/channelCategories')
          const categorizedCount = await categorizeUserChannels(userId, user.access_token)
          console.log(`✅ Categorized ${categorizedCount} channels for user ${user.email}`)
          
          // Step 2: Generate initial digest
          const { generateDailyDigest } = await import('@/cron/daily-digest')
          const digestResult = await generateDailyDigest(userId)
          
          if (digestResult.success) {
            console.log(`✅ Generated initial digest with ${digestResult.videoCount} videos`)
            
            // Step 3: Fetch transcripts (in background)
            const { fetchTranscriptsForUser } = await import('@/lib/transcript/fetchAllTranscripts')
            const transcriptCount = await fetchTranscriptsForUser(userId)
            
            // Step 4: Generate summaries
            const { summarizeVideosForUser } = await import('@/lib/summarize/summarizeAllVideos')
            const summaryCount = await summarizeVideosForUser(userId)
            
            // Step 5: Generate highlights
            const { generateHighlights, storeHighlights } = await import('@/lib/highlights')
            const highlights = await generateHighlights(userId)
            if (highlights.length > 0) {
              await storeHighlights(userId, highlights)
            }

            console.log(`✅ Background processing complete for user ${user.email}: ${digestResult.videoCount} videos, ${transcriptCount} transcripts, ${summaryCount} summaries, ${highlights.length} highlights`)
          }
        } catch (error) {
          console.error(`❌ Background processing failed for user ${user.email}:`, error)
        }
      })

      return NextResponse.json({
        success: true,
        subscriptionCount: subscriptionData.length,
        message: 'Onboarding started - your digest will be ready shortly',
        processing: true // Indicate background processing is happening
      })

    } catch (youtubeError) {
      console.error('YouTube API error:', youtubeError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch YouTube subscriptions',
        needsYouTubeAuth: true
      })
    }

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Onboarding failed' },
      { status: 500 }
    )
  }
}