import { supabaseAdmin } from '../supabase'
import type { Video } from '@/types'

export async function insertVideos(
  userId: string,
  videos: Array<{
    id: string
    channel_id: string
    title: string
    description: string
    published_at: string
    thumbnail_url: string
    views?: number
  }>
): Promise<boolean> {
  try {
    const videoData = videos.map((video) => ({
      ...video,
      user_id: userId,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin
      .from('videos')
      .upsert(videoData, {
        onConflict: 'id,user_id',
      })

    if (error) {
      console.error('Error inserting videos:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error inserting videos:', error)
    return false
  }
}

export async function getUserVideos(userId: string): Promise<Video[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching videos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

export async function deleteUserVideos(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('videos')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting videos:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting videos:', error)
    return false
  }
}

export async function getRecentVideos(
  userId: string,
  hoursAgo: number = 24
): Promise<Video[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo)

    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .gte('published_at', cutoffDate.toISOString())
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching recent videos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching recent videos:', error)
    return []
  }
}