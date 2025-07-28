/**
 * YouTube Transcript Fetcher using Updated Innertube Protocol (2025)
 * Uses player endpoint with extracted API key
 * Server-side only implementation
 */

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: Array<{
        baseUrl: string
        languageCode: string
        name?: {
          simpleText: string
        }
      }>
    }
  }
}

interface CaptionSegment {
  text: string
  start: number
  dur: number
}

/**
 * Extract INNERTUBE_API_KEY from YouTube video page
 */
async function extractApiKey(videoId: string): Promise<string | null> {
  try {
    console.log(`🔍 Extracting API key for video ${videoId}`)
    
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': '*',
      }
    })

    if (!response.ok) {
      console.log(`❌ Failed to fetch YouTube page for video ${videoId}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
    
    if (!apiKeyMatch) {
      console.log(`❌ Could not extract API key for video ${videoId}`)
      return null
    }

    console.log(`✅ Extracted API key for video ${videoId}`)
    return apiKeyMatch[1]
  } catch (error) {
    console.error(`💥 Error extracting API key for video ${videoId}:`, error)
    return null
  }
}

/**
 * Fetches transcript for a YouTube video using updated Innertube player endpoint
 * @param videoId YouTube video ID
 * @returns Full transcript as plain text string, or null if unavailable
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    console.log(`🔍 Fetching transcript via player endpoint for video: ${videoId}`)

    // Step 1: Extract API key from video page
    const apiKey = await extractApiKey(videoId)
    if (!apiKey) {
      return null
    }

    // Step 2: Call player endpoint with API key
    const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '20.10.38'
          }
        },
        videoId: videoId
      })
    })

    if (!response.ok) {
      console.log(`❌ Player API returned ${response.status} for video ${videoId}`)
      return null
    }

    const data: PlayerResponse = await response.json()
    
    // Step 3: Extract caption tracks
    const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!captionTracks || captionTracks.length === 0) {
      console.log(`❌ No caption tracks found for video ${videoId}`)
      return null
    }

    // Use first available track (any language)
    const track = captionTracks[0]
    if (!track) {
      console.log(`❌ No suitable caption track found for video ${videoId}`)
      return null
    }

    console.log(`✅ Found caption track for video ${videoId}: ${track.languageCode}`)

    // Step 4: Fetch and parse caption XML
    const transcript = await fetchCaptionXml(track.baseUrl, videoId)
    
    if (!transcript) {
      console.log(`❌ Failed to parse caption XML for video ${videoId}`)
      return null
    }

    console.log(`✅ Successfully fetched transcript for ${videoId}: ${transcript.length} characters`)
    return transcript

  } catch (error) {
    console.error(`💥 Error fetching transcript for video ${videoId}:`, error)
    return null
  }
}

/**
 * Fetch and parse caption XML from baseUrl
 */
async function fetchCaptionXml(baseUrl: string, videoId: string): Promise<string | null> {
  try {
    // Remove format parameter to get plain text
    const cleanUrl = baseUrl.replace(/&fmt=\w+$/, '')
    
    console.log(`📝 Fetching caption XML for video ${videoId}`)
    
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })

    if (!response.ok) {
      console.log(`❌ Failed to fetch caption XML: ${response.status}`)
      return null
    }

    const xml = await response.text()
    
    // Parse XML to extract text segments
    const transcript = parseXmlTranscript(xml)
    
    return transcript
  } catch (error) {
    console.error(`💥 Error fetching caption XML:`, error)
    return null
  }
}

/**
 * Parse XML transcript into plain text
 */
function parseXmlTranscript(xml: string): string | null {
  try {
    // Extract text from XML using regex (simple approach)
    const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/g)
    
    if (!textMatches || textMatches.length === 0) {
      return null
    }

    const segments = textMatches.map(match => {
      // Extract text content and decode HTML entities
      const textContent = match.replace(/<text[^>]*>/, '').replace(/<\/text>/, '')
      return textContent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
    })

    // Join all segments into a single transcript
    const fullTranscript = segments
      .filter(segment => segment.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause] etc.
      .trim()

    return fullTranscript || null
  } catch (error) {
    console.error('Error parsing XML transcript:', error)
    return null
  }
}

/**
 * Retry logic with exponential backoff
 */
async function fetchTranscriptWithRetry(videoId: string, attempt: number): Promise<string | null> {
  if (attempt > 3) {
    console.log(`❌ Max retries exceeded for video ${videoId}`)
    return null
  }

  try {
    console.log(`🔄 Retry attempt ${attempt} for video ${videoId}`)
    
    // Exponential backoff: 2s, 4s, 8s
    const delay = Math.pow(2, attempt) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return await fetchTranscript(videoId)
  } catch (error) {
    console.error(`❌ Retry ${attempt} failed for video ${videoId}:`, error)
    return await fetchTranscriptWithRetry(videoId, attempt + 1)
  }
}

/**
 * Main transcript fetcher with fallback strategies
 */
export async function fetchVideoTranscript(videoId: string): Promise<string | null> {
  // Use the updated player endpoint method
  return await fetchTranscript(videoId)
}