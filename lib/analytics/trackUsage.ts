import { supabaseAdmin } from '../supabase'

export interface DailyUsageMetrics {
  userId: string
  date: string
  totalVideos: number
  totalSummaries: number
  summaryModel: string
  durationSeconds: number
}

export interface SummaryError {
  videoId: string
  userId: string
  errorType: 'transcript_missing' | 'llm_timeout' | 'llm_failed' | 'api_quota'
  errorMessage?: string
}

export async function trackDailyUsage(metrics: DailyUsageMetrics): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('daily_usage')
      .upsert({
        user_id: metrics.userId,
        date: metrics.date,
        total_videos: metrics.totalVideos,
        total_summaries: metrics.totalSummaries,
        summary_model: metrics.summaryModel,
        duration_seconds: metrics.durationSeconds,
      }, {
        onConflict: 'user_id,date'
      })

    if (error) {
      console.error('Error tracking daily usage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error tracking daily usage:', error)
    return false
  }
}

export async function trackSummaryError(errorData: SummaryError): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('summary_errors')
      .insert({
        video_id: errorData.videoId,
        user_id: errorData.userId,
        error_type: errorData.errorType,
        error_message: errorData.errorMessage || '',
      })

    if (error) {
      console.error('Error tracking summary error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error tracking summary error:', error)
    return false
  }
}

export async function getDailyStats(date?: string): Promise<any> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('daily_usage')
      .select('*')
      .eq('date', targetDate)

    const { data: errors, error: errorsError } = await supabaseAdmin
      .from('summary_errors')
      .select('*')
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lt('created_at', `${targetDate}T23:59:59Z`)

    if (usageError || errorsError) {
      console.error('Error fetching daily stats:', usageError || errorsError)
      return null
    }

    const totalUsers = usage?.length || 0
    const totalVideos = usage?.reduce((sum, u) => sum + u.total_videos, 0) || 0
    const totalSummaries = usage?.reduce((sum, u) => sum + u.total_summaries, 0) || 0
    const avgDuration = usage?.length > 0 
      ? usage.reduce((sum, u) => sum + u.duration_seconds, 0) / usage.length 
      : 0

    const errorsByType = errors?.reduce((acc, error) => {
      acc[error.error_type] = (acc[error.error_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      date: targetDate,
      totalUsers,
      totalVideos,
      totalSummaries,
      avgDurationSeconds: Math.round(avgDuration),
      successRate: totalVideos > 0 ? ((totalSummaries / totalVideos) * 100).toFixed(1) : '0',
      errorsByType,
      totalErrors: errors?.length || 0,
    }
  } catch (error) {
    console.error('Error getting daily stats:', error)
    return null
  }
}