import { fetchVideoTranscript as fetchInnertubeTranscript } from '../youtube/transcript.server'

export interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

export async function fetchVideoTranscript(videoId: string): Promise<string | null> {
  // Use the new Innertube-based transcript fetcher
  return await fetchInnertubeTranscript(videoId)
}

export async function fetchTranscriptWithRetry(
  videoId: string,
  maxRetries: number = 3
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transcript = await fetchVideoTranscript(videoId)
      return transcript
    } catch (error) {
      console.error(`Attempt ${attempt} failed for video ${videoId}:`, error)
      
      if (attempt === maxRetries) {
        return null
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return null
}