import { NextRequest, NextResponse } from 'next/server'
import { generateDailyDigest } from '@/cron/daily-digest'
import { fetchTranscriptsForUser } from '@/lib/transcript/fetchAllTranscripts'
import { summarizeVideosForUser } from '@/lib/summarize/summarizeAllVideos'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log(`🧪 Testing digest generation for user ${userId}`)

    // Step 1: Generate daily digest (fetch new videos)
    console.log('📺 Generating daily digest...')
    const digestSuccess = await generateDailyDigest(userId)
    
    if (!digestSuccess) {
      return NextResponse.json(
        { error: 'Failed to generate digest' },
        { status: 500 }
      )
    }

    // Step 2: Fetch transcripts
    console.log('📝 Fetching transcripts...')
    const transcriptCount = await fetchTranscriptsForUser(userId)

    // Step 3: Generate summaries
    console.log('🤖 Generating summaries...')
    const summaryCount = await summarizeVideosForUser(userId)

    console.log('✅ Test digest generation completed!')

    return NextResponse.json({
      success: true,
      message: 'Test digest generation completed',
      results: {
        digestGenerated: digestSuccess,
        transcriptsFetched: transcriptCount,
        summariesGenerated: summaryCount,
      },
    })

  } catch (error) {
    console.error('Test digest error:', error)
    return NextResponse.json(
      { error: 'Test digest failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test digest endpoint - use POST to trigger',
    timestamp: new Date().toISOString(),
  })
}