export interface YouTubeSubscription {
  kind: string
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelTitle: string
    title: string
    description: string
    resourceId: {
      kind: string
      channelId: string
    }
    channelId: string
    thumbnails: {
      default: { url: string; width: number; height: number }
      medium: { url: string; width: number; height: number }
      high: { url: string; width: number; height: number }
    }
  }
}

export interface YouTubeSubscriptionsResponse {
  kind: string
  etag: string
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: YouTubeSubscription[]
}

export interface YouTubeVideo {
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: { url: string; width: number; height: number }
      medium: { url: string; width: number; height: number }
      high: { url: string; width: number; height: number }
    }
    channelTitle: string
  }
  statistics?: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
}