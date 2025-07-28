import { NextRequest, NextResponse } from 'next/server'
import { generateHighlights, storeHighlights } from '@/lib/highlights'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔥 Starting highlights generation for all users...')

    // Get all users who have videos today but no highlights yet
    const today = new Date().toISOString().split('T')[0]
    
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const results = {
      totalUsers: users?.length || 0,
      processedUsers: 0,
      highlightsGenerated: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const user of users || []) {
      try {
        console.log(`🔥 Generating highlights for user ${user.email}...`)

        // Generate highlights for this user
        const highlights = await generateHighlights(user.id)
        
        if (highlights.length > 0) {
          // Store highlights
          const success = await storeHighlights(user.id, highlights)
          
          if (success) {
            results.highlightsGenerated += highlights.length
            console.log(`✅ Generated ${highlights.length} highlights for user ${user.email}`)
          } else {
            results.errors.push(`Failed to store highlights for user ${user.email}`)
          }
        } else {
          console.log(`📭 No highlights generated for user ${user.email} (insufficient content)`)
        }

        results.processedUsers++

      } catch (error) {
        console.error(`Error processing highlights for user ${user.email}:`, error)
        results.errors.push(`Error processing user ${user.email}: ${error}`)
      }
    }

    console.log('🎉 Highlights generation completed!')
    console.log(`📊 Results: ${results.processedUsers}/${results.totalUsers} users processed`)
    console.log(`🔥 Generated ${results.highlightsGenerated} total highlights`)
    
    if (results.errors.length > 0) {
      console.log(`❌ Errors: ${results.errors.length}`)
      results.errors.forEach(error => console.error(error))
    }

    return NextResponse.json({
      success: true,
      message: 'Highlights generation completed',
      results,
    })

  } catch (error) {
    console.error('Fatal error in highlights generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow GET for testing purposes
export async function GET() {
  return NextResponse.json({
    message: 'Highlights generation cron endpoint',
    timestamp: new Date().toISOString(),
  })
}