import { supabaseAdmin } from '../supabase'

export async function updateVideoTranscript(
  videoId: string,
  userId: string,
  transcript: string | null
): Promise<boolean> {
  try {
    const updateData: any = { transcript }
    
    if (transcript === null || transcript === 'UNAVAILABLE') {
      updateData.transcript_unavailable = true
      updateData.summary_status = 'transcript_missing'
    } else {
      updateData.transcript_unavailable = false
      updateData.summary_status = 'processing'
    }

    const { error } = await supabaseAdmin
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .eq('user_id', userId)

    if (error) {
      console.error(`Error updating transcript for video ${videoId}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error updating transcript for video ${videoId}:`, error)
    return false
  }
}

export async function getVideosWithoutTranscripts(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('id, title, channel_id')
      .eq('user_id', userId)
      .is('transcript', null)

    if (error) {
      console.error('Error fetching videos without transcripts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching videos without transcripts:', error)
    return []
  }
}

export async function getVideosWithTranscripts(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('id, title, transcript')
      .eq('user_id', userId)
      .not('transcript', 'is', null)
      .neq('transcript', 'UNAVAILABLE')

    if (error) {
      console.error('Error fetching videos with transcripts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching videos with transcripts:', error)
    return []
  }
}