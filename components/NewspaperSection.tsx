import { DigestBrief } from './DigestBrief'
import type { DigestVideo } from '@/lib/data/getDigestForUser'

interface NewspaperSectionProps {
  category: string
  videos: DigestVideo[]
}

// Dynamic emoji selection based on category
function getCategoryEmoji(category: string): string {
  // Use universal emojis that work across all cultures
  const emojiMap: Record<string, string> = {
    'Technology': '🔧',
    'Sports': '⚽', // Universal soccer ball instead of US football
    'Entertainment': '🎭',
    'Gaming': '🎮',
    'Music': '🎵',
    'Education': '📖',
    'News': '📢',
    'Business': '💼',
    'Lifestyle': '🌟',
    'Other': '📝',
  }
  
  return emojiMap[category] || '📄'
}

export function NewspaperSection({ category, videos }: NewspaperSectionProps) {
  if (videos.length === 0) return null

  const emoji = getCategoryEmoji(category)

  return (
    <section className="mb-12">
      {/* Category header */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
          {emoji} {category}
        </h2>
        <div className="border-b border-gray-300 pb-1">
          <p className="text-sm text-gray-500 font-sans">
            {videos.length} new {videos.length === 1 ? 'story' : 'stories'}
          </p>
        </div>
      </div>
      
      {/* Articles */}
      <div className="space-y-0">
        {videos.map((video) => (
          <DigestBrief key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

export function EmptyNewspaper() {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">📰</div>
        
        <h3 className="text-xl font-serif font-semibold text-gray-900 mb-3">
          No News Today
        </h3>
        
        <p className="text-gray-600 font-serif leading-relaxed mb-4">
          None of your subscribed channels published new content in the last 24 hours.
        </p>
        
        <p className="text-sm text-gray-500 font-sans">
          Your next edition will be ready tomorrow at 8 AM
        </p>
      </div>
    </div>
  )
}