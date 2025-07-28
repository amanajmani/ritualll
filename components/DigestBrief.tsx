import type { DigestVideo } from '@/lib/data/getDigestForUser'

interface DigestBriefProps {
  video: DigestVideo
}

export function DigestBrief({ video }: DigestBriefProps) {
  // Parse markdown-style formatting for bold/italic text
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }

  // Check if summary follows the 4-line format
  const is4LineFormat = (summary: string) => {
    if (!summary) return false
    const lines = summary.split('\n').filter(line => line.trim())
    // Must have exactly 4 lines for proper format
    return lines.length === 4 && 
           lines.every(line => line.length > 10) && // Each line should be substantial
           lines[0].includes('[') // First line should have YouTuber name pattern
  }

  // Extract headline - either first line of 4-line format or generated from title
  const getHeadline = (summary: string, title: string) => {
    if (summary && is4LineFormat(summary)) {
      const lines = summary.split('\n').filter(line => line.trim())
      return lines[0].trim()
    }
    return generateHeadline(title, summary)
  }

  // Get body text - either remaining lines or the full summary
  const getBodyText = (summary: string, title: string) => {
    if (!summary) return null
    
    if (is4LineFormat(summary)) {
      // Proper 4-line format: return lines 2-4
      const lines = summary.split('\n').filter(line => line.trim())
      return lines.slice(1).join(' ').trim()
    } else {
      // Single paragraph format: return the full summary since headline is from title
      return summary.trim()
    }
  }

  const headline = getHeadline(video.summary || '', video.title)
  const bodyText = getBodyText(video.summary || '', video.title)
  
  return (
    <article className="mb-8 pb-6 border-b border-gray-400 last:border-b-0">
      {/* Newspaper-style layout */}
      <div className="flex gap-4">
        {/* Vintage thumbnail on the left */}
        <div className="flex-shrink-0">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-32 h-20 object-cover vintage-thumbnail"
          />
        </div>
        
        {/* Text content on the right */}
        <div className="flex-1 min-w-0">
          {/* Newspaper headline */}
          <h3 className="newspaper-headline text-lg leading-tight mb-2">
            {headline}
          </h3>
          
          {/* Summary text with newspaper body styling */}
          <div className="mb-3">
            {video.summary ? (
              <div className="newspaper-body text-sm" style={{ color: '#1A1A1A' }}>
                {(bodyText || '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
              </div>
            ) : (
              <div>
                {video.summary_status === 'transcript_missing' && (
                  <p className="newspaper-meta italic mb-1">
                    Summary unavailable (no transcript)
                  </p>
                )}
                {video.summary_status === 'llm_failed' && (
                  <p className="newspaper-meta italic mb-1">
                    Summary could not be generated
                  </p>
                )}
                {video.summary_status === 'processing' && (
                  <p className="newspaper-meta italic mb-1">
                    Summary coming soon...
                  </p>
                )}
                <p className="newspaper-body text-sm" style={{ color: '#333' }}>
                  {video.description.length > 150
                    ? `${video.description.substring(0, 150)}...`
                    : video.description}
                </p>
              </div>
            )}
          </div>
          
          {/* Byline and link */}
          <div className="flex items-center justify-between">
            <div className="newspaper-byline">
              By {video.channel_title}
            </div>
            <a
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="newspaper-link newspaper-meta"
            >
              Watch Video →
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }
}

function generateHeadline(title: string, summary?: string): string {
  // If we have a summary, try to extract a headline from it
  if (summary) {
    // Take the first sentence of the summary as headline
    const firstSentence = summary.split('.')[0].trim()
    if (firstSentence.length > 10 && firstSentence.length < 80) {
      return firstSentence
    }
  }
  
  // Fallback to cleaning up the YouTube title
  let headline = title
    .replace(/\|.*$/, '') // Remove everything after |
    .replace(/\s*-\s*.*$/, '') // Remove everything after -
    .replace(/^\[.*?\]\s*/, '') // Remove [tags] at start
    .replace(/\s*\(.*?\)\s*$/, '') // Remove (parentheses) at end
    .trim()
  
  // Ensure reasonable length - be more aggressive for long titles
  if (headline.length > 60) {
    headline = headline.substring(0, 57) + '...'
  }
  
  return headline || title
}