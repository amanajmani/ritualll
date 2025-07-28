import { supabaseAdmin } from '../supabase'
import type { Video, Subscription } from '@/types'

export interface DigestVideo extends Video {
  channel_title: string
  channel_thumbnail?: string
  category?: string
  ai_title?: string
}

export interface DigestData {
  videos: DigestVideo[]
  videosByCategory: Record<string, DigestVideo[]>
  totalVideos: number
  lastUpdated: string
}

export async function getDigestForUser(userId: string): Promise<DigestData> {
  try {
    // Get today's videos with channel information
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('videos')
      .select(`
        *,
        subscriptions!inner (
          title,
          thumbnail_url,
          category,
          channel_category
        )
      `)
      .eq('user_id', userId)
      .eq('subscriptions.user_id', userId)
      .order('published_at', { ascending: false })

    if (videosError) {
      console.error('Error fetching digest videos:', videosError)
      return {
        videos: [],
        videosByCategory: {},
        totalVideos: 0,
        lastUpdated: new Date().toISOString(),
      }
    }

    // Transform the data to include channel information
    const digestVideos: DigestVideo[] = (videos || []).map(video => ({
      ...video,
      channel_title: video.subscriptions?.title || 'Unknown Channel',
      channel_thumbnail: video.subscriptions?.thumbnail_url,
      category: video.subscriptions?.channel_category || video.subscriptions?.category || 'Other',
      ai_title: video.ai_title || undefined,
    }))

    // Group videos by category
    const videosByCategory: Record<string, DigestVideo[]> = {}
    
    digestVideos.forEach(video => {
      const category = video.category || 'Other'
      if (!videosByCategory[category]) {
        videosByCategory[category] = []
      }
      videosByCategory[category].push(video)
    })

    // Sort categories by video count (most videos first)
    const sortedCategories = Object.keys(videosByCategory).sort(
      (a, b) => videosByCategory[b].length - videosByCategory[a].length
    )

    const sortedVideosByCategory: Record<string, DigestVideo[]> = {}
    sortedCategories.forEach(category => {
      // Sort videos within each category: videos with summaries first, then without
      const sortedCategoryVideos = videosByCategory[category].sort((a, b) => {
        // Videos with summaries (transcripts) come first
        if (a.summary && !b.summary) return -1
        if (!a.summary && b.summary) return 1
        // If both have or don't have summaries, sort by published date
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      })
      
      sortedVideosByCategory[category] = sortedCategoryVideos
    })

    return {
      videos: digestVideos,
      videosByCategory: sortedVideosByCategory,
      totalVideos: digestVideos.length,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error in getDigestForUser:', error)
    return {
      videos: [],
      videosByCategory: {},
      totalVideos: 0,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export async function getUserFromCookie(userId: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, timezone, last_briefing_date')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}