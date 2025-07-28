import { NextRequest, NextResponse } from 'next/server'
import { generateDailyDigest } from '@/cron/daily-digest'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log(`🧪 Manually generating digest for user ${userId}`)

    // Generate digest for this user
    const result = await generateDailyDigest(userId)

    return NextResponse.json({
      success: result.success,
      message: `Digest generation ${result.success ? 'completed' : 'failed'}`,
      videoCount: result.videoCount,
      duration: result.duration,
    })

  } catch (error) {
    console.error('Manual digest generation error:', error)
    return NextResponse.json(
      { error: 'Digest generation failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Manual digest generation endpoint - use POST to trigger',
    timestamp: new Date().toISOString(),
  })
}