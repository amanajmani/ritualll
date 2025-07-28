import type { DigestVideo } from '@/lib/data/getDigestForUser'

interface VideoCardProps {
  video: DigestVideo
}

export function VideoCard({ video }: VideoCardProps) {
  const publishedDate = new Date(video.published_at)
  const timeAgo = getTimeAgo(publishedDate)
  
  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="font-medium">{video.channel_title}</span>
          <span className="mx-2">•</span>
          <span>{timeAgo}</span>
          {video.views && (
            <>
              <span className="mx-2">•</span>
              <span>{formatViews(video.views)} views</span>
            </>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
          <a
            href={`https://youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700"
          >
            {video.title}
          </a>
        </h3>
        
        {video.summary ? (
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            {video.summary}
          </p>
        ) : (
          <div className="text-gray-600 text-sm leading-relaxed mb-3">
            {video.summary_status === 'transcript_missing' && (
              <p className="text-amber-600 italic mb-2">
                📝 Summary unavailable (no transcript)
              </p>
            )}
            {video.summary_status === 'llm_failed' && (
              <p className="text-amber-600 italic mb-2">
                🤖 Summary could not be generated
              </p>
            )}
            {video.summary_status === 'processing' && (
              <p className="text-blue-600 italic mb-2">
                ⏳ Summary coming soon...
              </p>
            )}
            <p>
              {video.description.length > 150
                ? `${video.description.substring(0, 150)}...`
                : video.description}
            </p>
          </div>
        )}
        
        <a
          href={`https://youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
        >
          Watch on YouTube
        </a>
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

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  } else {
    return views.toString()
  }
}