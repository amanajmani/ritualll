import { VideoCard } from './VideoCard'
import type { DigestVideo } from '@/lib/data/getDigestForUser'

interface DigestSectionProps {
  category: string
  videos: DigestVideo[]
}

export function DigestSection({ category, videos }: DigestSectionProps) {
  if (videos.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{category}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {videos.length} video{videos.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

export function EmptyDigest() {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No new videos today
        </h3>
        
        <p className="text-gray-600 mb-4">
          None of your subscribed channels uploaded videos in the last 24 hours.
        </p>
        
        <p className="text-sm text-gray-500">
          Check back tomorrow at 8 AM for fresh content!
        </p>
      </div>
    </div>
  )
}