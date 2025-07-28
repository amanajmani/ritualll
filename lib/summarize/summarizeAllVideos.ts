import { supabaseAdmin } from '../supabase'
import { getVideosWithTranscripts } from '../db/updateTranscript'
import { generateSummariesWithFallback, VideoToSummarize } from './groqSummarize'

export async function updateVideoSummary(
  videoId: string,
  userId: string,
  summary: string | null,
  status: 'success' | 'llm_failed' = 'success'
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('videos')
      .update({ 
        summary,
        summary_status: status
      })
      .eq('id', videoId)
      .eq('user_id', userId)

    if (error) {
      console.error(`Error updating summary for video ${videoId}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error updating summary for video ${videoId}:`, error)
    return false
  }
}

export async function summarizeVideosForUser(userId: string): Promise<number> {
  try {
    // Get videos that have transcripts but no summaries
    const { data: videos, error } = await supabaseAdmin
      .from('videos')
      .select('id, title, transcript')
      .eq('user_id', userId)
      .not('transcript', 'is', null)
      .neq('transcript', 'UNAVAILABLE')
      .is('summary', null)

    if (error) {
      console.error('Error fetching videos for summarization:', error)
      return 0
    }

    if (!videos || videos.length === 0) {
      console.log(`No videos need summarization for user ${userId}`)
      return 0
    }

    console.log(`Summarizing ${videos.length} videos for user ${userId}`)

    const videosToSummarize: VideoToSummarize[] = videos.map(video => ({
      id: video.id,
      title: video.title,
      transcript: video.transcript,
    }))

    let successCount = 0
    const batchSize = 5 // Process in batches to manage API limits

    for (let i = 0; i < videosToSummarize.length; i += batchSize) {
      const batch = videosToSummarize.slice(i, i + batchSize)
      
      try {
        const summaries = await generateSummariesWithFallback(batch)
        
        // Update database with generated summaries
        for (const [videoId, summary] of Object.entries(summaries)) {
          const success = await updateVideoSummary(videoId, userId, summary, 'success')
          if (success) {
            successCount++
            console.log(`✅ Summary generated for video ${videoId}`)
          }
        }
        
        // Mark failed videos
        const failedVideos = batch.filter(video => !summaries[video.id])
        for (const video of failedVideos) {
          await updateVideoSummary(video.id, userId, null, 'llm_failed')
          console.log(`❌ Summary failed for video ${video.id}`)
        }
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error)
      }

      // Rate limiting - small delay between batches
      if (i + batchSize < videosToSummarize.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`Summarization complete for user ${userId}: ${successCount}/${videos.length} successful`)
    return successCount
  } catch (error) {
    console.error(`Error in summarizeVideosForUser for ${userId}:`, error)
    return 0
  }
}

export async function summarizeVideosForAllUsers(): Promise<void> {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id')

    if (error) {
      console.error('Error fetching users for summarization:', error)
      return
    }

    for (const user of users || []) {
      await summarizeVideosForUser(user.id)
    }
  } catch (error) {
    console.error('Error in summarizeVideosForAllUsers:', error)
  }
}