import Groq from 'groq-sdk'
import { getSingleVideoPrompt, getBatchVideoPrompt, getDescriptionFallbackPrompt } from '../prompts/summaryPrompt'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export interface VideoToSummarize {
  id: string
  title: string
  transcript: string
  description?: string
}

export async function generateSingleSummary(
  video: VideoToSummarize
): Promise<string | null> {
  try {
    // Check if transcript is missing or too short, use description fallback
    const hasValidTranscript = video.transcript && video.transcript.trim().length > 50
    
    // Detect live streams or breaking news content
    const isLiveContent = video.title.toLowerCase().includes('live') || 
                         video.title.toLowerCase().includes('stream') ||
                         video.title.toLowerCase().includes('breaking') ||
                         (video.description && (
                           video.description.toLowerCase().includes('live stream') ||
                           video.description.toLowerCase().includes('breaking news')
                         ))
    
    let prompt: string
    if (hasValidTranscript && !isLiveContent) {
      prompt = getSingleVideoPrompt(video.transcript, video.title)
    } else if (video.description && video.description.trim().length > 20) {
      console.log(`Using description fallback for video ${video.id}${isLiveContent ? ' (live content)' : ''}`)
      prompt = getDescriptionFallbackPrompt(video.title, video.description)
    } else {
      console.error(`No transcript or description available for video ${video.id}`)
      return null
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1, // Very low temperature to prevent hallucinations
      max_tokens: 150, // Reduce output tokens for single summaries too
    })

    const summary = completion.choices[0]?.message?.content?.trim()
    
    if (!summary) {
      console.error(`No summary generated for video ${video.id}`)
      return null
    }

    // Decode HTML entities if present
    const decodedSummary = summary
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    // Validate 4-line format
    const lines = decodedSummary.split('\n').filter(line => line.trim())
    if (lines.length !== 4) {
      console.warn(`Invalid format for video ${video.id}: expected 4 lines, got ${lines.length}`)
      // Don't regenerate automatically, just log the warning
    }

    return decodedSummary
  } catch (error) {
    console.error(`Error generating summary for video ${video.id}:`, error)
    return null
  }
}

export async function generateBatchSummaries(
  videos: VideoToSummarize[]
): Promise<Record<string, string>> {
  try {
    if (videos.length === 0) return {}
    
    // Aggressive optimization: smaller batches, shorter transcripts
    const batchSize = Math.min(videos.length, 3) // Max 3 videos per batch
    const batch = videos.slice(0, batchSize).map(video => ({
      ...video,
      // Aggressively truncate to 800 characters for batching
      transcript: video.transcript.length > 800 
        ? video.transcript.substring(0, 800) + '...'
        : video.transcript
    }))
    
    const prompt = getBatchVideoPrompt(batch)

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1, // Very low temperature to prevent hallucinations
      max_tokens: 400, // Reduce output tokens for efficiency
    })

    const response = completion.choices[0]?.message?.content?.trim()
    
    if (!response) {
      console.error('No batch summary response generated')
      return {}
    }

    // Parse the batch response back into individual summaries
    const summaries: Record<string, string> = {}
    const lines = response.split('\n')
    
    let currentVideoIndex = 0
    let currentSummary = ''
    
    for (const line of lines) {
      const videoMatch = line.match(/^Video (\d+) Summary:\s*(.*)/)
      
      if (videoMatch) {
        // Save previous summary if exists
        if (currentVideoIndex > 0 && currentSummary && batch[currentVideoIndex - 1]) {
          // Decode HTML entities before saving
          const decodedSummary = currentSummary.trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
          summaries[batch[currentVideoIndex - 1].id] = decodedSummary
        }
        
        // Start new summary
        currentVideoIndex = parseInt(videoMatch[1])
        currentSummary = videoMatch[2] || ''
      } else if (currentVideoIndex > 0 && line.trim()) {
        // Continue current summary
        currentSummary += ' ' + line.trim()
      }
    }
    
    // Save the last summary
    if (currentVideoIndex > 0 && currentSummary && batch[currentVideoIndex - 1]) {
      // Decode HTML entities before saving
      const decodedSummary = currentSummary.trim()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      summaries[batch[currentVideoIndex - 1].id] = decodedSummary
    }

    console.log(`Generated ${Object.keys(summaries).length} summaries from batch of ${batch.length}`)
    return summaries
  } catch (error) {
    console.error('Error generating batch summaries:', error)
    return {}
  }
}

export async function generateSummariesWithFallback(
  videos: VideoToSummarize[]
): Promise<Record<string, string>> {
  const summaries: Record<string, string> = {}
  
  if (videos.length === 0) return summaries

  // Process videos in small batches with aggressive optimization
  console.log(`Processing ${videos.length} videos with aggressive optimization for scaling`)
  
  const batchSize = 3 // Process 3 videos at a time
  
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize)
    
    // Aggressively truncate transcripts to 1000 characters max
    const optimizedBatch = batch.map(video => ({
      ...video,
      transcript: video.transcript.length > 1000 
        ? video.transcript.substring(0, 1000) + '...'
        : video.transcript
    }))
    
    try {
      // Try batch processing first
      const batchSummaries = await generateBatchSummaries(optimizedBatch)
      Object.assign(summaries, batchSummaries)
      
      console.log(`✅ Generated ${Object.keys(batchSummaries).length} summaries in batch ${Math.floor(i/batchSize) + 1}`)
      
      // Process any failed videos individually
      const failedVideos = optimizedBatch.filter(video => !summaries[video.id])
      for (const video of failedVideos) {
        try {
          const summary = await generateSingleSummary(video)
          if (summary) {
            summaries[video.id] = summary
            console.log(`✅ Generated individual summary for video ${video.id}`)
          }
        } catch (error) {
          console.error(`❌ Individual summary failed for video ${video.id}:`, error)
        }
      }
      
      // Rate limiting delay between batches
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed, trying individually:`, error)
      
      // Fallback to individual processing for this batch
      for (const video of optimizedBatch) {
        try {
          const summary = await generateSingleSummary(video)
          if (summary) {
            summaries[video.id] = summary
            console.log(`✅ Generated fallback summary for video ${video.id}`)
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`❌ Fallback summary failed for video ${video.id}:`, error)
        }
      }
    }
  }

  return summaries
}