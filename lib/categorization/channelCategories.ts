import { YouTubeAPI } from '../youtube'
import { supabaseAdmin } from '../supabase'

// Mapping of YouTube topic categories to our simplified categories
const TOPIC_CATEGORY_MAP: Record<string, string> = {
  // Technology & Science
  'https://en.wikipedia.org/wiki/Technology': 'Technology',
  'https://en.wikipedia.org/wiki/Science': 'Technology',
  'https://en.wikipedia.org/wiki/Computer_science': 'Technology',
  'https://en.wikipedia.org/wiki/Software': 'Technology',
  
  // Education
  'https://en.wikipedia.org/wiki/Education': 'Education',
  'https://en.wikipedia.org/wiki/Tutorial': 'Education',
  'https://en.wikipedia.org/wiki/How-to': 'Education',
  
  // Entertainment
  'https://en.wikipedia.org/wiki/Entertainment': 'Entertainment',
  'https://en.wikipedia.org/wiki/Comedy': 'Entertainment',
  'https://en.wikipedia.org/wiki/Film': 'Entertainment',
  'https://en.wikipedia.org/wiki/Television': 'Entertainment',
  
  // Music
  'https://en.wikipedia.org/wiki/Music': 'Music',
  'https://en.wikipedia.org/wiki/Song': 'Music',
  'https://en.wikipedia.org/wiki/Album': 'Music',
  
  // Gaming
  'https://en.wikipedia.org/wiki/Video_game': 'Gaming',
  'https://en.wikipedia.org/wiki/Gaming': 'Gaming',
  'https://en.wikipedia.org/wiki/Esports': 'Gaming',
  
  // News & Politics
  'https://en.wikipedia.org/wiki/News': 'News',
  'https://en.wikipedia.org/wiki/Politics': 'News',
  'https://en.wikipedia.org/wiki/Current_events': 'News',
  
  // Sports
  'https://en.wikipedia.org/wiki/Sport': 'Sports',
  'https://en.wikipedia.org/wiki/Football': 'Sports',
  'https://en.wikipedia.org/wiki/Basketball': 'Sports',
  
  // Lifestyle
  'https://en.wikipedia.org/wiki/Lifestyle_(sociology)': 'Lifestyle',
  'https://en.wikipedia.org/wiki/Fashion': 'Lifestyle',
  'https://en.wikipedia.org/wiki/Food': 'Lifestyle',
  'https://en.wikipedia.org/wiki/Travel': 'Lifestyle',
  
  // Business
  'https://en.wikipedia.org/wiki/Business': 'Business',
  'https://en.wikipedia.org/wiki/Finance': 'Business',
  'https://en.wikipedia.org/wiki/Entrepreneurship': 'Business',
}

export function normalizeCategory(topicCategories: string[]): string {
  if (!topicCategories || topicCategories.length === 0) {
    return 'Other'
  }

  // Check for exact matches first
  for (const topic of topicCategories) {
    if (TOPIC_CATEGORY_MAP[topic]) {
      return TOPIC_CATEGORY_MAP[topic]
    }
  }

  // Fallback to keyword matching
  const topicsString = topicCategories.join(' ').toLowerCase()
  
  if (topicsString.includes('technology') || topicsString.includes('science') || topicsString.includes('tech')) {
    return 'Technology'
  }
  if (topicsString.includes('music') || topicsString.includes('song')) {
    return 'Music'
  }
  if (topicsString.includes('game') || topicsString.includes('gaming')) {
    return 'Gaming'
  }
  if (topicsString.includes('education') || topicsString.includes('tutorial') || topicsString.includes('learn')) {
    return 'Education'
  }
  if (topicsString.includes('news') || topicsString.includes('politics')) {
    return 'News'
  }
  if (topicsString.includes('sport') || topicsString.includes('football') || topicsString.includes('basketball')) {
    return 'Sports'
  }
  if (topicsString.includes('entertainment') || topicsString.includes('comedy') || topicsString.includes('film')) {
    return 'Entertainment'
  }
  if (topicsString.includes('business') || topicsString.includes('finance')) {
    return 'Business'
  }
  if (topicsString.includes('lifestyle') || topicsString.includes('fashion') || topicsString.includes('food')) {
    return 'Lifestyle'
  }

  return 'Other'
}

export function inferCategoryFromContent(channelTitle: string, description?: string): string {
  const text = `${channelTitle} ${description || ''}`.toLowerCase()
  
  // Technology & Science patterns
  if (text.match(/\b(tech|technology|science|engineering|programming|coding|software|hardware|innovation|review|gadget|electronics|computer|ai|artificial intelligence)\b/)) {
    return 'Technology'
  }
  
  // Music patterns
  if (text.match(/\b(music|song|album|artist|record|label|official|vevo|audio|sound|track|melody|lyrics|band|singer|musician)\b/) || 
      channelTitle.match(/\b(records|music|official|vevo)\b/i)) {
    return 'Music'
  }
  
  // Gaming patterns
  if (text.match(/\b(game|gaming|gamer|gameplay|playthrough|walkthrough|stream|twitch|esports|console|xbox|playstation|nintendo|pc gaming)\b/)) {
    return 'Gaming'
  }
  
  // Education patterns
  if (text.match(/\b(education|tutorial|learn|teach|course|academy|university|school|lesson|how.?to|explain|study|knowledge)\b/)) {
    return 'Education'
  }
  
  // Entertainment patterns
  if (text.match(/\b(entertainment|comedy|funny|humor|sketch|show|tv|movie|film|celebrity|actor|actress|drama|series)\b/)) {
    return 'Entertainment'
  }
  
  // Sports patterns
  if (text.match(/\b(sport|sports|football|basketball|soccer|baseball|tennis|golf|hockey|olympics|athlete|team|game|match|tournament)\b/)) {
    return 'Sports'
  }
  
  // News patterns
  if (text.match(/\b(news|breaking|current events|politics|political|journalist|reporter|media|press|broadcast)\b/)) {
    return 'News'
  }
  
  // Lifestyle patterns
  if (text.match(/\b(lifestyle|fashion|beauty|health|fitness|food|cooking|recipe|travel|vlog|daily|routine|tips|advice)\b/)) {
    return 'Lifestyle'
  }
  
  // Business patterns
  if (text.match(/\b(business|entrepreneur|finance|money|investment|startup|marketing|sales|career|success)\b/)) {
    return 'Business'
  }
  
  return 'Other'
}

async function categorizeWithAI(channelTitle: string, description?: string): Promise<string> {
  try {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    })

    const prompt = `Categorize this YouTube channel into ONE of these categories: Technology, Education, Entertainment, News, Music, Gaming, Lifestyle, Business, Sports, Other.

Channel: ${channelTitle}
Description: ${description || 'No description available'}

Based on the channel name and description, what category does this belong to? Respond with ONLY the category name.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1, // Low temperature for consistent categorization
      max_tokens: 20,
    })

    const category = completion.choices[0]?.message?.content?.trim()
    
    // Validate the response is one of our allowed categories
    const validCategories = ['Technology', 'Education', 'Entertainment', 'News', 'Music', 'Gaming', 'Lifestyle', 'Business', 'Sports', 'Other']
    if (category && validCategories.includes(category)) {
      return category
    }
    
    return 'Other'
  } catch (error) {
    console.error('AI categorization failed:', error)
    return 'Other'
  }
}

// Legacy function - now uses the improved inferCategoryFromContent
export function inferCategoryFromTitle(channelTitle: string): string {
  return inferCategoryFromContent(channelTitle)
}

// Batch fetch multiple channels in a single API call to save quota
async function batchFetchAndCategorizeChannels(
  channelIds: string[], 
  channelTitles: string[], 
  accessToken: string
): Promise<Array<{ channelId: string; category: string }>> {
  try {
    const ids = channelIds.join(',')
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,topicDetails&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout for batch
      }
    )

    if (!response.ok) {
      throw new Error(`YouTube API batch error: ${response.status}`)
    }

    const data = await response.json()
    const results: Array<{ channelId: string; category: string }> = []

    for (let i = 0; i < channelIds.length; i++) {
      const channelId = channelIds[i]
      const channelTitle = channelTitles[i]
      
      // Find the corresponding channel data from API response
      const channelData = data.items?.find((item: any) => item.id === channelId)
      
      let category = 'Other'
      
      if (channelData) {
        // Try YouTube's topic categories first
        if (channelData.topicDetails?.topicCategories) {
          category = normalizeCategory(channelData.topicDetails.topicCategories)
        }
        
        // Fallback to content-based categorization
        if (category === 'Other') {
          category = inferCategoryFromContent(
            channelData.snippet?.title || channelTitle,
            channelData.snippet?.description
          )
        }
      } else {
        // Channel not found in API response, use title-based categorization
        category = inferCategoryFromContent(channelTitle)
      }
      
      results.push({ channelId, category })
    }

    return results
  } catch (error) {
    console.error('Batch categorization failed:', error)
    // Fallback: categorize based on titles only
    return channelIds.map((channelId, index) => ({
      channelId,
      category: inferCategoryFromContent(channelTitles[index])
    }))
  }
}

export async function fetchAndCategorizeChannel(channelId: string, accessToken: string): Promise<string> {
  try {
    // Fetch channel details including topic categories and recent videos
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,topicDetails,statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    )

    if (!response.ok) {
      console.warn(`YouTube API error for channel ${channelId}: ${response.status}`)
      return 'Other'
    }

    const data = await response.json()
    const channel = data.items?.[0]

    if (!channel) {
      return 'Other'
    }

    // Step 1: Try to get category from YouTube's official topic details
    if (channel.topicDetails?.topicCategories && channel.topicDetails.topicCategories.length > 0) {
      const category = normalizeCategory(channel.topicDetails.topicCategories)
      if (category !== 'Other') {
        console.log(`📍 Found topic category for ${channel.snippet?.title}: ${category}`)
        return category
      }
    }

    // Step 2: Use intelligent content-based categorization
    if (channel.snippet?.title) {
      const titleCategory = inferCategoryFromContent(channel.snippet.title, channel.snippet?.description)
      if (titleCategory !== 'Other') {
        console.log(`🧠 Inferred category for ${channel.snippet.title}: ${titleCategory}`)
        return titleCategory
      }
    }

    // Step 3: If we still can't categorize, use AI-based categorization
    if (channel.snippet?.title) {
      const aiCategory = await categorizeWithAI(channel.snippet.title, channel.snippet?.description)
      if (aiCategory !== 'Other') {
        console.log(`🤖 AI categorized ${channel.snippet.title}: ${aiCategory}`)
        return aiCategory
      }
    }

    console.log(`❓ Could not categorize ${channel.snippet?.title}, defaulting to Other`)
    return 'Other'
  } catch (error) {
    console.error(`Error categorizing channel ${channelId}:`, error)
    return 'Other'
  }
}

export async function updateChannelCategory(channelId: string, userId: string, category: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({ channel_category: category })
      .eq('id', channelId)
      .eq('user_id', userId)

    if (error) {
      console.error(`Error updating channel category for ${channelId}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error updating channel category for ${channelId}:`, error)
    return false
  }
}

export async function categorizeUserChannels(userId: string, accessToken: string): Promise<number> {
  try {
    // Get all channels for the user (we'll categorize all, not just "Other")
    const { data: channels, error } = await supabaseAdmin
      .from('subscriptions')
      .select('id, title')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching channels for categorization:', error)
      return 0
    }

    if (!channels || channels.length === 0) {
      return 0
    }

    let categorizedCount = 0

    // Batch API calls to save quota - up to 50 channels per API call
    const apiBatchSize = 50
    for (let i = 0; i < channels.length; i += apiBatchSize) {
      const batch = channels.slice(i, i + apiBatchSize)
      
      try {
        const categorizedChannels = await batchFetchAndCategorizeChannels(
          batch.map(c => c.id), 
          batch.map(c => c.title),
          accessToken
        )
        
        // Update database in parallel
        await Promise.all(categorizedChannels.map(async ({ channelId, category }) => {
          const success = await updateChannelCategory(channelId, userId, category)
          if (success) {
            categorizedCount++
            const channel = batch.find(c => c.id === channelId)
            console.log(`✅ Categorized ${channel?.title} as ${category}`)
          }
        }))
        
      } catch (error) {
        console.error(`Error categorizing batch:`, error)
        // Fallback to individual categorization for this batch
        for (const channel of batch) {
          try {
            const category = inferCategoryFromContent(channel.title)
            await updateChannelCategory(channel.id, userId, category)
            categorizedCount++
          } catch (err) {
            console.error(`Error with fallback categorization for ${channel.id}:`, err)
          }
        }
      }

      // Brief delay between API batches
      if (i + apiBatchSize < channels.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return categorizedCount
  } catch (error) {
    console.error('Error in categorizeUserChannels:', error)
    return 0
  }
}