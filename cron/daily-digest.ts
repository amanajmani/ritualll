import { supabaseAdmin } from '@/lib/supabase'
import { parseYouTubeRSS } from '@/lib/youtube'
import { insertVideos, deleteUserVideos } from '@/lib/db/videos'
import { getUserSubscriptions } from '@/lib/db/subscriptions'
import { isWithinLast24Hours } from '@/lib/utils/timezone'
import { getVideosTimeWindow } from '@/lib/timezone'
import { trackDailyUsage } from '@/lib/analytics/trackUsage'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Filter function to identify YouTube Shorts - Conservative approach
function isYouTubeShort(video: any): boolean {
  const title = video.title?.toLowerCase() || ''
  const description = video.description?.toLowerCase() || ''
  
  // High-confidence Short indicators only
  const definiteShortIndicators = [
    '#shorts',
    '#short ',      // Space after to avoid "shortage", "shortly" etc
    ' shorts',      // Space before to avoid "t-shirts", "undershorts" etc
    '#youtubeshorts',
    '#shortsvideo',
    '#shortsfeed',
  ]
  
  // Check for definite short indicators
  const hasDefiniteShortIndicator = definiteShortIndicators.some(indicator => 
    title.includes(indicator) || description.includes(indicator)
  )
  
  // High-confidence patterns only
  const definiteShortPatterns = [
    /\b(wait for it|watch till end|wait for the end)\b/i,
    /^.{1,15}[!?]{2,}$/,  // Very short titles with multiple exclamation/question marks
  ]
  
  const matchesDefiniteShortPattern = definiteShortPatterns.some(pattern => 
    pattern.test(title.trim())
  )
  
  // Debug logging
  if (hasDefiniteShortIndicator || matchesDefiniteShortPattern) {
    console.log(`🚫 FILTERING SHORT: "${video.title}" - Reason: ${hasDefiniteShortIndicator ? 'hashtag' : 'pattern'}`)
  }
  
  return hasDefiniteShortIndicator || matchesDefiniteShortPattern
}

// Generate AI titles for videos without transcripts
async function generateAITitlesForUser(userId: string): Promise<void> {
  try {
    console.log(`🤖 Generating AI titles for videos without transcripts for user ${userId}`)
    
    // Get videos without summaries (no transcripts)
    const { data: videosWithoutSummary, error } = await supabaseAdmin
      .from('videos')
      .select('id, title')
      .eq('user_id', userId)
      .is('summary', null)
    
    if (error || !videosWithoutSummary || videosWithoutSummary.length === 0) {
      console.log(`📝 No videos without transcripts found for user ${userId}`)
      return
    }
    
    console.log(`🎯 Found ${videosWithoutSummary.length} videos without transcripts`)
    
    // Process videos in batches to respect rate limits
    const batchSize = 5
    for (let i = 0; i < videosWithoutSummary.length; i += batchSize) {
      const batch = videosWithoutSummary.slice(i, i + batchSize)
      
      for (const video of batch) {
        try {
          const prompt = `Create a professional 6-7 word headline from this YouTube title. Remove hashtags, clean up formatting, make it newspaper-style.

Original title: "${video.title}"

Rules:
- 6-7 words maximum
- Professional tone
- No hashtags (#)
- No brackets []
- No "shorts" references
- Clean, readable headline

Headline:`

          const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            temperature: 0.1,
            max_tokens: 50,
          })

          let generatedTitle = completion.choices[0]?.message?.content?.trim()
          if (generatedTitle) {
            // Remove quotes if AI wrapped the title
            generatedTitle = generatedTitle.replace(/^["']|["']$/g, '')
            
            // Update the video with AI-generated title
            await supabaseAdmin
              .from('videos')
              .update({ ai_title: generatedTitle })
              .eq('id', video.id)
            
            console.log(`✅ Generated title for "${video.title}": "${generatedTitle}"`)
          }
          
          // Add delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 2500)) // 2.5s delay = ~24 requests/minute
          
        } catch (error) {
          console.error(`❌ Error generating title for video ${video.id}:`, error)
          // Continue with next video
        }
      }
    }
    
    console.log(`🎉 Completed AI title generation for user ${userId}`)
  } catch (error) {
    console.error(`❌ Error in generateAITitlesForUser for ${userId}:`, error)
  }
}

export async function generateDailyDigest(userId: string, userTimezone?: string): Promise<{ success: boolean; videoCount: number; duration: number }> {
  const startTime = Date.now()
  
  try {
    console.log(`🔄 Starting daily digest generation for user ${userId}`)

    // Delete yesterday's videos first
    console.log(`🗑️ Clearing previous digest for user ${userId}`)
    await deleteUserVideos(userId)

    // Get user's subscriptions
    const subscriptions = await getUserSubscriptions(userId)
    
    if (subscriptions.length === 0) {
      console.log(`📭 No subscriptions found for user ${userId}`)
      
      // Track usage even for users with no subscriptions
      const duration = Math.round((Date.now() - startTime) / 1000)
      await trackDailyUsage({
        userId,
        date: new Date().toISOString().split('T')[0],
        totalVideos: 0,
        totalSummaries: 0,
        summaryModel: 'none',
        durationSeconds: duration,
      })
      
      return { success: true, videoCount: 0, duration }
    }

    console.log(`📺 Found ${subscriptions.length} subscriptions for user ${userId}`)
    const allVideos = []

    // Fetch videos from each subscribed channel
    for (const subscription of subscriptions) {
      try {
        console.log(`🔍 Fetching videos from channel: ${subscription.title}`)
        const videos = await parseYouTubeRSS(subscription.id)
        
        // Filter videos from last 24 hours based on user's timezone and exclude Shorts
        const timeWindow = userTimezone ? getVideosTimeWindow(userTimezone) : new Date(Date.now() - 24 * 60 * 60 * 1000)
        const recentVideos = videos.filter(video => {
          const videoDate = new Date(video.publishedAt)
          return videoDate >= timeWindow && !isYouTubeShort(video)
        })

        console.log(`📹 Found ${recentVideos.length} recent full-length videos from ${subscription.title} (excluding Shorts)`)

        // Transform to our video format
        const transformedVideos = recentVideos.map(video => ({
          id: video.videoId,
          channel_id: subscription.id,
          title: video.title,
          description: video.description || '',
          published_at: video.publishedAt,
          thumbnail_url: video.thumbnailUrl || '',
        }))

        allVideos.push(...transformedVideos)
      } catch (error) {
        console.error(`❌ Error fetching videos for channel ${subscription.id}:`, error)
        // Continue with other channels
      }
    }

    // Insert all videos
    if (allVideos.length > 0) {
      console.log(`💾 Inserting ${allVideos.length} videos for user ${userId}`)
      const success = await insertVideos(userId, allVideos)
      if (!success) {
        console.error(`❌ Failed to insert videos for user ${userId}`)
        return { success: false, videoCount: 0, duration: Math.round((Date.now() - startTime) / 1000) }
      }
      
      // Generate AI titles for videos without transcripts
      await generateAITitlesForUser(userId)
    } else {
      console.log(`📭 No new videos found for user ${userId}`)
    }

    // Update last briefing date
    await supabaseAdmin
      .from('users')
      .update({ last_briefing_date: new Date().toISOString().split('T')[0] })
      .eq('id', userId)

    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`✅ Daily digest generated for user ${userId}: ${allVideos.length} videos in ${duration}s`)
    
    return { success: true, videoCount: allVideos.length, duration }
  } catch (error) {
    console.error(`❌ Error generating daily digest for user ${userId}:`, error)
    const duration = Math.round((Date.now() - startTime) / 1000)
    return { success: false, videoCount: 0, duration }
  }
}

export async function runDailyDigestForAllUsers(): Promise<void> {
  try {
    // Get all users who need their digest updated
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, timezone, last_briefing_date')

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    for (const user of users || []) {
      // Check if it's 8 AM in user's timezone
      // This is a simplified check - in production you'd use proper timezone handling
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      // TESTING: Comment out daily check to allow 15-minute updates
      // Skip if already updated today
      // if (user.last_briefing_date === today) {
      //   continue
      // }

      // Generate digest for this user
      await generateDailyDigest(user.id)
    }
  } catch (error) {
    console.error('Error running daily digest for all users:', error)
  }
}