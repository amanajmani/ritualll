import { NextRequest, NextResponse } from 'next/server'
import { generateHighlights, storeHighlights } from '@/lib/highlights'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log(`🔄 Regenerating highlights for user ${userId}`)
    
    // Generate fresh highlights
    const highlights = await generateHighlights(userId)
    
    if (highlights.length > 0) {
      // Store new highlights
      await storeHighlights(userId, highlights)
      console.log(`✅ Regenerated ${highlights.length} highlights`)
      
      return NextResponse.json({
        success: true,
        highlightCount: highlights.length,
        highlights: highlights.map(h => ({
          category: h.category,
          videoCount: h.videoCount,
          summary: h.summary.substring(0, 100) + '...'
        }))
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No highlights generated'
      })
    }

  } catch (error) {
    console.error('Error regenerating highlights:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate highlights' },
      { status: 500 }
    )
  }
}