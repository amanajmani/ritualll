import { supabaseAdmin } from '../supabase'
import { fetchTranscriptWithRetry } from './fetchTranscript'
import { updateVideoTranscript } from '../db/updateTranscript'

export async function fetchTranscriptsForUser(userId: string): Promise<number> {
  try {
    // Get all videos for user that don't have transcripts yet
    const { data: videos, error } = await supabaseAdmin
      .from('videos')
      .select('id, title')
      .eq('user_id', userId)
      .is('transcript', null)

    if (error) {
      console.error('Error fetching videos without transcripts:', error)
      return 0
    }

    if (!videos || videos.length === 0) {
      console.log(`No videos need transcript fetching for user ${userId}`)
      return 0
    }

    console.log(`Fetching transcripts for ${videos.length} videos for user ${userId}`)

    let successCount = 0
    const batchSize = 8 // Increased batch size for better performance

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize)
      
      // Process batch in parallel
      const transcriptPromises = batch.map(async (video) => {
        const transcript = await fetchTranscriptWithRetry(video.id)
        
        if (transcript) {
          const success = await updateVideoTranscript(video.id, userId, transcript)
          if (success) {
            console.log(`✅ Transcript fetched for: ${video.title}`)
            return 1
          }
        } else {
          // Mark as unavailable so we don't try again
          await updateVideoTranscript(video.id, userId, null)
          console.log(`❌ No transcript available for: ${video.title}`)
        }
        
        return 0
      })

      const batchResults = await Promise.all(transcriptPromises)
      successCount += batchResults.reduce<number>((sum, result) => sum + (result as number), 0)

      // Small delay between batches
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 300)) // Reduced from 1000ms
      }
    }

    console.log(`Transcript fetching complete for user ${userId}: ${successCount}/${videos.length} successful`)
    return successCount
  } catch (error) {
    console.error(`Error in fetchTranscriptsForUser for ${userId}:`, error)
    return 0
  }
}

export async function fetchTranscriptsForAllUsers(): Promise<void> {
  try {
    // Get all users who have videos without transcripts
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id')

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    for (const user of users || []) {
      await fetchTranscriptsForUser(user.id)
    }
  } catch (error) {
    console.error('Error in fetchTranscriptsForAllUsers:', error)
  }
}