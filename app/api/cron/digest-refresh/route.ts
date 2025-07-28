import { NextRequest, NextResponse } from 'next/server'
import { generateDailyDigest } from '@/cron/daily-digest'
import { fetchTranscriptsForUser } from '@/lib/transcript/fetchAllTranscripts'
import { summarizeVideosForUser } from '@/lib/summarize/summarizeAllVideos'
import { trackDailyUsage } from '@/lib/analytics/trackUsage'
import { supabaseAdmin } from '@/lib/supabase'
import { isDigestTime, shouldProcessUser, formatUserTime } from '@/lib/timezone'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Starting timezone-aware digest refresh...')

    // Get all users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, timezone, last_briefing_date')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const results = {
      totalUsers: users?.length || 0,
      eligibleUsers: 0,
      processedUsers: 0,
      skippedUsers: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const user of users || []) {
      try {
        const userTimezone = user.timezone || 'UTC'
        const userTime = formatUserTime(userTimezone)
        
        console.log(`⏰ Checking user ${user.email} (${userTime})...`)

        // Vercel Hobby Plan Limitation: Single daily cron at 12:00 UTC
        // This time works well for: India (5:30 PM), Europe (1-2 PM), some of Asia
        // US users will get digest in morning, which is still reasonable for daily digest

        // Check if user should receive digest today
        if (!shouldProcessUser(user.last_briefing_date, userTimezone)) {
          console.log(`⏭️  Skipping ${user.email} - already received digest recently`)
          results.skippedUsers++
          continue
        }

        results.eligibleUsers++
        console.log(`📺 Processing user ${user.email} at ${userTime}...`)

        // Step 1: Generate daily digest (fetch new videos)
        const digestResult = await generateDailyDigest(user.id, userTimezone)
        if (!digestResult.success) {
          results.errors.push(`Failed to generate digest for user ${user.email}`)
          continue
        }

        // Step 2: Fetch transcripts for new videos
        console.log(`📝 Fetching transcripts for user ${user.email}...`)
        const transcriptCount = await fetchTranscriptsForUser(user.id)
        console.log(`✅ Fetched ${transcriptCount} transcripts for user ${user.email}`)

        // Step 3: Generate summaries
        console.log(`🤖 Generating summaries for user ${user.email}...`)
        const summaryCount = await summarizeVideosForUser(user.id)
        console.log(`✅ Generated ${summaryCount} summaries for user ${user.email}`)

        // Step 4: Track analytics
        await trackDailyUsage({
          userId: user.id,
          date: new Date().toISOString().split('T')[0],
          totalVideos: digestResult.videoCount,
          totalSummaries: summaryCount,
          summaryModel: summaryCount > 0 ? 'groq' : 'none',
          durationSeconds: digestResult.duration,
        })

        results.processedUsers++
        console.log(`✅ Completed processing for user ${user.email}`)

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error)
        results.errors.push(`Error processing user ${user.email}: ${error}`)
      }
    }

    console.log('🎉 Timezone-aware digest refresh completed!')
    console.log(`📊 Results: ${results.processedUsers}/${results.eligibleUsers} eligible users processed (${results.skippedUsers} skipped, ${results.totalUsers} total)`)
    
    if (results.errors.length > 0) {
      console.log(`❌ Errors: ${results.errors.length}`)
      results.errors.forEach(error => console.error(error))
    }

    return NextResponse.json({
      success: true,
      message: 'Timezone-aware digest refresh completed',
      results,
    })

  } catch (error) {
    console.error('Fatal error in digest refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET for testing purposes
export async function GET() {
  return NextResponse.json({
    message: 'Daily digest cron endpoint',
    timestamp: new Date().toISOString(),
  })
}