import type { YouTubeSubscriptionsResponse, YouTubeVideo } from '@/types/youtube'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export class YouTubeAPI {
  private apiKey: string
  private accessToken: string

  constructor(accessToken: string, apiKey?: string) {
    this.accessToken = accessToken
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY!
  }

  private async makeRequest(endpoint: string, params: Record<string, string>) {
    const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`)
    
    // Add API key and access token
    params.key = this.apiKey
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getSubscriptions(pageToken?: string): Promise<YouTubeSubscriptionsResponse> {
    const params: Record<string, string> = {
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
    }

    if (pageToken) {
      params.pageToken = pageToken
    }

    return this.makeRequest('/subscriptions', params)
  }

  async getAllSubscriptions() {
    const allSubscriptions = []
    let nextPageToken: string | undefined

    do {
      const response = await this.getSubscriptions(nextPageToken)
      allSubscriptions.push(...response.items)
      nextPageToken = response.nextPageToken
    } while (nextPageToken)

    return allSubscriptions
  }

  async getVideos(videoIds: string[]): Promise<{ items: YouTubeVideo[] }> {
    if (videoIds.length === 0) return { items: [] }

    const params = {
      part: 'snippet,statistics',
      id: videoIds.join(','),
    }

    return this.makeRequest('/videos', params)
  }
}

export async function parseYouTubeRSS(channelId: string): Promise<any[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const response = await fetch(rssUrl)
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`)
    }

    const xmlText = await response.text()
    
    // Basic XML parsing for video entries
    const videoRegex = /<entry>([\s\S]*?)<\/entry>/g
    const videos = []
    let match

    while ((match = videoRegex.exec(xmlText)) !== null) {
      const entryXml = match[1]
      
      // Extract video data using regex (simple approach)
      const videoId = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1]
      const title = entryXml.match(/<title>(.*?)<\/title>/)?.[1]
      const published = entryXml.match(/<published>(.*?)<\/published>/)?.[1]
      const description = entryXml.match(/<media:description>(.*?)<\/media:description>/)?.[1]
      const thumbnail = entryXml.match(/<media:thumbnail url="(.*?)"/)?.[1]

      if (videoId && title && published) {
        videos.push({
          videoId,
          title: title.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
          publishedAt: published,
          description: description || '',
          thumbnailUrl: thumbnail || '',
          channelId,
        })
      }
    }

    return videos
  } catch (error) {
    console.error(`Error parsing RSS for channel ${channelId}:`, error)
    return []
  }
}