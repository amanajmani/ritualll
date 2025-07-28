import React from 'react'
import type { DigestVideo } from '@/lib/data/getDigestForUser'
import { StoryKit } from './StoryKit'

interface NewspaperSectionalGridProps {
  category: string
  videos: DigestVideo[]
}

export function NewspaperSectionalGrid({ category, videos }: NewspaperSectionalGridProps) {
  if (videos.length === 0) return null

  // Determine the layout strategy based on number of videos
  const getStoryVariant = (index: number, totalVideos: number): 'lead' | 'secondary' | 'horizontal' => {
    // Single story gets horizontal layout
    if (totalVideos === 1) {
      return 'horizontal'
    }
    
    // Multiple stories: first is lead, rest are secondary
    return index === 0 ? 'lead' : 'secondary'
  }

  return (
    <section className="newspaper-section">
      {/* Section header */}
      <div className="section-header mb-6">
        <h2 className="text-2xl">
          {category.toUpperCase()}
        </h2>
        <div className="newspaper-meta mt-1">
          {videos.length} {videos.length === 1 ? 'Story' : 'Stories'} • Today's Coverage
        </div>
      </div>
      
      {/* Newspaper page - tetris layout places story kits in shortest columns */}
      <div className="newspaper-page tetris-layout">
        {videos.map((video, index) => {
          const variant = getStoryVariant(index, videos.length)
          
          return (
            <StoryKit
              key={video.id}
              video={video}
              variant={variant}
            />
          )
        })}
      </div>
    </section>
  )
}