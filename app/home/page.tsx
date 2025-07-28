import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDigestForUser, getUserFromCookie } from '@/lib/data/getDigestForUser'
import { NewspaperSection, EmptyNewspaper } from '@/components/NewspaperSection'
import { NewspaperSectionalGrid } from '@/components/NewspaperSectionalGrid'
import { NewspaperMasthead } from '@/components/NewspaperMasthead'
import { CreatorStatsHeader } from '@/components/CreatorStatsHeader'
import { HighlightsSection, HighlightsPlaceholder } from '@/components/HighlightsSection'
import { getStoredHighlights, getUserChannels } from '@/lib/highlights'

export default async function HomePage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    redirect('/login')
  }

  // Fetch user, digest data, highlights, and channel data
  const [user, digestData, highlights, userChannels] = await Promise.all([
    getUserFromCookie(userId),
    getDigestForUser(userId),
    getStoredHighlights(userId),
    getUserChannels(userId),
  ])

  if (!user) {
    redirect('/login')
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1EA' }}>
      {/* Newspaper container with vintage styling */}
      <div className="newspaper-spacing">
        <NewspaperMasthead 
          date={formattedDate}
          totalStories={digestData.totalVideos}
          lastUpdated={digestData.lastUpdated}
          userTimezone={user.timezone}
        />

        <main>
          {digestData.totalVideos === 0 ? (
            <EmptyNewspaper />
          ) : (
            <div>
              {/* Creator Stats Header - shows today's activity */}
              <CreatorStatsHeader videos={digestData.videos} />
              
              {/* Highlights section - the signature MOAT feature */}
              {highlights.length > 0 ? (
                <HighlightsSection 
                  highlights={highlights} 
                  userChannels={userChannels}
                  availableVideos={digestData.videos}
                />
              ) : digestData.totalVideos >= 3 ? (
                <HighlightsPlaceholder />
              ) : null}
              
              {/* Videos by Category sections with newspaper sectional grid */}
              {Object.entries(digestData.videosByCategory).map(([category, videos]) => {
                if (videos.length === 0) return null
                
                return (
                  <NewspaperSectionalGrid 
                    key={category} 
                    category={category} 
                    videos={videos} 
                  />
                )
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t-2 border-black text-center">
          <div className="newspaper-meta">
            <div className="mb-2" style={{ color: '#0BC5EA', fontWeight: '600' }}>
              ritualll
            </div>
            Your Personalized Intelligence Briefing • Updated Daily at 5:30 PM Local Time
          </div>
        </footer>
      </div>
    </div>
  )
}