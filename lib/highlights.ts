/**
 * Highlights Generator - Creates trending topics and key insights
 * This is the signature MOAT feature that makes the digest unique
 */

import { supabaseAdmin } from './supabase'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export interface Highlight {
  title: string
  summary: string
  category: string
  videoCount: number
  relatedVideos: string[] // video IDs
}

export interface TrendingTopic {
  topic: string
  description: string
  videoCount: number
  categories: string[]
}

/**
 * Generate highlights from user's daily digest
 */
export async function generateHighlights(userId: string): Promise<Highlight[]> {
  try {
    console.log(`🔥 Generating highlights for user ${userId}`)

    // Get today's videos with summaries AND channel info
    const { data: videos, error } = await supabaseAdmin
      .from('videos')
      .select(`
        id,
        title,
        summary,
        channel_id,
        subscriptions!inner (
          id,
          title,
          channel_category
        )
      `)
      .eq('user_id', userId)
      .eq('subscriptions.user_id', userId)
      .not('summary', 'is', null)
      .neq('summary', '')

    if (error || !videos || videos.length === 0) {
      console.log(`No videos with summaries found for user ${userId}`)
      return []
    }

    // Group videos by category for analysis
    const videosByCategory: Record<string, any[]> = {}
    videos.forEach(video => {
      const subscription = Array.isArray(video.subscriptions) ? video.subscriptions[0] : video.subscriptions
      const category = subscription?.channel_category || 'Other'
      if (!videosByCategory[category]) {
        videosByCategory[category] = []
      }
      videosByCategory[category].push(video)
    })

    const highlights: Highlight[] = []

    // Generate highlights for ALL categories that have videos
    for (const [category, categoryVideos] of Object.entries(videosByCategory)) {
      const highlight = await generateCategoryHighlight(category, categoryVideos)
      if (highlight) {
        highlights.push(highlight)
      }
    }

    console.log(`✅ Generated ${highlights.length} highlights for user ${userId}`)
    return highlights // Return all category highlights

  } catch (error) {
    console.error(`Error generating highlights for user ${userId}:`, error)
    return []
  }
}

/**
 * Generate a highlight for a specific category using editorial style
 */
async function generateCategoryHighlight(category: string, videos: any[]): Promise<Highlight | null> {
  try {
    // Limit to 12 videos per category to maximize token usage
    const limitedVideos = videos.slice(0, 12)
    const summaries = limitedVideos.map(v => {
      const subscription = Array.isArray(v.subscriptions) ? v.subscriptions[0] : v.subscriptions
      return `"${v.title}" by ${subscription?.title || 'Unknown Channel'}: ${v.summary}`
    }).join('\n\n')
    
    const getCategoryEmojis = (category: string): string => {
      const emojiMap: Record<string, string[]> = {
        'Technology': ['⚡', '🔬', '🛠️', '🎯', '🌐', '📡'],
        'Education': ['📚', '🎓', '💡', '🧠', '🔍', '📝'],
        'Entertainment': ['🎭', '🎪', '🎨', '🎬', '🌟', '✨'],
        'News': ['📰', '🗞️', '📺', '🌍', '⏰', '🔔'],
        'Music': ['🎵', '🎶', '🎤', '🎹', '🎸', '🎺'],
        'Gaming': ['🎮', '🕹️', '🎯', '🏆', '⚔️', '🎲'],
        'Lifestyle': ['🌿', '🏡', '☕', '🌸', '🧘', '🍃'],
        'Business': ['💼', '📊', '🎯', '📈', '💰', '🏢'],
        'Science': ['🔬', '🧪', '🌌', '⚗️', '🔭', '🧬'],
        'Sports': ['⚽', '🏀', '🏈', '🎾', '🏐', '🎱'],
        'Other': ['🌟', '✨', '🎪', '🎭', '🎨', '🌈']
      }
      const emojis = emojiMap[category] || emojiMap['Other']
      return emojis[Math.floor(Math.random() * emojis.length)]
    }

    const categoryEmoji = getCategoryEmojis(category)

    const prompt = `Editorial writer for ${category} videos in newspaper-style digest. Create factual bullet points.

FORMATTING:
- **Bold** channel names, creator names, and key specifics
- *Italicize* tone words, emotions, editorial commentary
- Add relevant emojis throughout (not just ${categoryEmoji})
- For Entertainment/Goldmines: mention "classic" or "vintage" films
- Each bullet point must be on its own line starting with •

CONTENT RULES:
- Only describe the actual videos provided below
- Don't invent content not in summaries
- Highlight trends, connections, or interesting contrasts
- Keep factual and direct - NO flowery philosophical language
- NO phrases like "delve into", "spark curiosity", "testament to", "reminder of", "thrill of discovery"
- Write like a news brief, not a philosophical essay
- Each bullet should be concise and scannable

Video summaries:
${summaries}

Output only the bullet points, nothing else:`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1, // Low temperature for factual accuracy
      max_tokens: 350, // Enough for proper formatting and links
    })

    const response = completion.choices[0]?.message?.content?.trim()
    if (!response) return null

    return {
      title: category,
      summary: response,
      category,
      videoCount: limitedVideos.length,
      relatedVideos: limitedVideos.map(v => v.id),
    }

  } catch (error) {
    console.error(`Error generating category highlight for ${category}:`, error)
    return null
  }
}


/**
 * Store highlights in database
 */
export async function storeHighlights(userId: string, highlights: Highlight[]): Promise<boolean> {
  try {
    // Store highlights in the daily_usage table
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabaseAdmin
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        total_videos: 0, // Will be updated by analytics
        total_summaries: 0, // Will be updated by analytics
        highlights: JSON.stringify(highlights),
      }, {
        onConflict: 'user_id,date'
      })

    if (error) {
      console.error('Error storing highlights:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error storing highlights:', error)
    return false
  }
}

/**
 * Get user's channel data for creating links
 */
export async function getUserChannels(userId: string): Promise<Record<string, string>> {
  try {
    const { data: channels } = await supabaseAdmin
      .from('subscriptions')
      .select('id, title')
      .eq('user_id', userId)

    if (!channels) return {}

    // Create a map of channel name -> channel ID for quick lookup
    const channelMap: Record<string, string> = {}
    channels.forEach(channel => {
      channelMap[channel.title] = channel.id
    })
    
    return channelMap
  } catch (error) {
    console.error('Error getting user channels:', error)
    return {}
  }
}

/**
 * Get stored highlights for user
 */
export async function getStoredHighlights(userId: string): Promise<Highlight[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    console.log(`🔍 Looking for highlights for user ${userId} on date ${today}`)
    
    const { data, error } = await supabaseAdmin
      .from('daily_usage')
      .select('highlights, date')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    console.log(`📊 Query result:`, { data, error })

    if (error) {
      console.log(`❌ No highlights found for today (${today}), trying recent highlights`)
      
      // Fallback: get most recent highlights within last 3 days
      const { data: recentData, error: recentError } = await supabaseAdmin
        .from('daily_usage')
        .select('highlights, date')
        .eq('user_id', userId)
        .not('highlights', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .single()
      
      if (recentError || !recentData?.highlights) {
        console.log(`❌ No recent highlights found either`)
        return []
      }
      
      console.log(`✅ Using recent highlights from ${recentData.date}`)
      return JSON.parse(recentData.highlights) as Highlight[]
    }

    if (!data?.highlights) {
      console.log(`❌ Highlights data is null/empty`)
      return []
    }

    console.log(`✅ Found highlights for today:`, data.highlights)
    return JSON.parse(data.highlights) as Highlight[]
  } catch (error) {
    console.error('Error getting stored highlights:', error)
    return []
  }
}