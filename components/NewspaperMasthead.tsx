import { getLocationFromTimezone } from '@/lib/timezone'

interface NewspaperMastheadProps {
  date: string
  totalStories: number
  lastUpdated: string
  userTimezone?: string
}

export function NewspaperMasthead({ date, totalStories, lastUpdated, userTimezone }: NewspaperMastheadProps) {
  // Get dynamic location and date based on user's timezone
  const getLocationAndDate = () => {
    if (userTimezone) {
      return getLocationFromTimezone(userTimezone)
    }
    
    // Fallback to generic version
    return {
      location: 'GLOBAL EDITION',
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const { location, date: dynamicDate } = getLocationAndDate()

  return (
    <header className="text-center mb-16 pb-8">
      {/* Newspaper dateline */}
      <div className="newspaper-meta mb-6">
        <div className="border-t-2 border-b border-black pt-2 pb-1">
          <div>{location} — {dynamicDate}</div>
        </div>
      </div>
      
      {/* Main masthead title */}
      <h1 className="masthead-title text-6xl mb-4 tracking-wide" style={{ color: '#1A1A1A' }}>
        Your Daily Digest
      </h1>
      
      {/* Subtitle */}
      <div className="newspaper-byline mb-6">
        Personal YouTube Intelligence • Curated Daily
      </div>
      
      {/* Edition info */}
      {totalStories > 0 && (
        <div className="newspaper-meta mb-4">
          <span>Vol. 1, No. {Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 365}</span>
          <span className="mx-4">•</span>
          <span>{totalStories} {totalStories === 1 ? 'Story' : 'Stories'}</span>
          <span className="mx-4">•</span>
          <span>Updated {new Date(lastUpdated).toLocaleTimeString(undefined, { 
            hour: 'numeric', 
            minute: '2-digit'
          })}</span>
        </div>
      )}
      
      {/* Bottom border */}
      <div className="mt-8 border-b-4 border-double border-black"></div>
    </header>
  )
}