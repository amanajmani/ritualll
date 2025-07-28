export interface User {
  id: string
  email: string
  google_id: string
  access_token: string
  refresh_token?: string
  timezone: string
  last_briefing_date: string | null
  created_at: string
}

export interface Subscription {
  id: string
  title: string
  thumbnail_url: string
  user_id: string
  category?: string
  added_at: string
}

export interface Video {
  id: string
  user_id: string
  channel_id: string
  title: string
  description: string
  published_at: string
  thumbnail_url: string
  summary?: string
  transcript?: string
  transcript_unavailable?: boolean
  summary_status?: 'success' | 'transcript_missing' | 'llm_failed' | 'processing'
  views?: number
  duration?: number // Duration in seconds
  created_at: string
}