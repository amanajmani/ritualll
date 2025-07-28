import { NextRequest, NextResponse } from 'next/server'
import { fetchVideoTranscript } from '@/lib/transcript/fetchTranscript'

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing transcript fetch for video: ${videoId}`)
    
    const transcript = await fetchVideoTranscript(videoId)

    return NextResponse.json({
      success: transcript !== null,
      videoId,
      transcript: transcript ? transcript.substring(0, 500) + '...' : null,
      length: transcript ? transcript.length : 0,
    })

  } catch (error) {
    console.error('Test transcript error:', error)
    return NextResponse.json(
      { error: 'Transcript test failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test single transcript endpoint - use POST with videoId',
    example: { videoId: 'dQw4w9WgXcQ' }
  })
}