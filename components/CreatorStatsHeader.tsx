'use client'

import React from 'react'
import type { DigestVideo } from '@/lib/data/getDigestForUser'
import { UI_CONFIG, getResponsiveValue } from '@/lib/config/ui'

interface CreatorStatsHeaderProps {
  videos: DigestVideo[]
}

interface Creator {
  id: string
  title: string
  thumbnail: string | null
  videoCount: number
  latestVideoTitle?: string
}

export function CreatorStatsHeader({ videos }: CreatorStatsHeaderProps) {
  const [screenWidth, setScreenWidth] = React.useState<number>()
  const [hoveredCreator, setHoveredCreator] = React.useState<string | null>(null)
  
  // Track screen width for responsive behavior
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth)
      
      const handleResize = () => setScreenWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Extract unique creators with statistics from today's videos
  const uniqueCreators = React.useMemo<Creator[]>(() => {
    const creatorMap = new Map<string, Creator>()
    
    videos.forEach(video => {
      const existingCreator = creatorMap.get(video.channel_id)
      
      if (!existingCreator) {
        creatorMap.set(video.channel_id, {
          id: video.channel_id,
          title: video.channel_title,
          thumbnail: video.channel_thumbnail || null,
          videoCount: 1,
          latestVideoTitle: video.title
        })
      } else {
        // Update existing creator stats
        existingCreator.videoCount += 1
        // Keep the most recent video title (assuming videos are ordered by recency)
        existingCreator.latestVideoTitle = video.title
      }
    })
    
    return Array.from(creatorMap.values())
      .sort((a, b) => b.videoCount - a.videoCount) // Sort by video count (highest to lowest)
  }, [videos])

  const totalVideos = videos.length
  const totalCreators = uniqueCreators.length

  // Get responsive max visible avatars
  const maxVisibleAvatars = getResponsiveValue(
    UI_CONFIG.CREATOR_STATS.MAX_VISIBLE_AVATARS,
    screenWidth
  )

  if (totalVideos === 0) return null

  return (
    <div className="creator-stats-header">
      {/* Edition data on the left */}
      <div className="stats-summary">
        <span className="newspaper-meta stats-text">
          {totalCreators} CREATOR{totalCreators !== 1 ? 'S' : ''} • {totalVideos} NEW VIDEO{totalVideos !== 1 ? 'S' : ''} TODAY
        </span>
      </div>
      
      {/* Creator icon wall on the right */}
      <div className="creator-icon-wall">
        {uniqueCreators.slice(0, maxVisibleAvatars).map((creator, index) => (
          <div 
            key={creator.id}
            className="creator-icon"
            style={{ 
              zIndex: uniqueCreators.length - index,
              marginLeft: index > 0 ? `${UI_CONFIG.CREATOR_STATS.AVATAR_OVERLAP_PX}px` : '0'
            }}
            onMouseEnter={() => setHoveredCreator(creator.id)}
            onMouseLeave={() => setHoveredCreator(null)}
          >
            <CreatorAvatar creator={creator} />
            
            {/* Interactive hover tooltip */}
            {hoveredCreator === creator.id && (
              <CreatorTooltip creator={creator} />
            )}
          </div>
        ))}
        
        {/* Overflow indicator if there are more creators */}
        {uniqueCreators.length > maxVisibleAvatars && (
          <div className="creator-icon-overflow">
            <span className="overflow-indicator">+{uniqueCreators.length - maxVisibleAvatars}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Interactive tooltip component with channel statistics
function CreatorTooltip({ creator }: { creator: Creator }) {
  return (
    <div className="creator-tooltip">
      <div className="tooltip-header">
        <h4 className="tooltip-title">{creator.title}</h4>
      </div>
      
      <div className="tooltip-stats">
        <div className="stat-item">
          <span className="stat-label">TODAY'S VIDEOS</span>
          <span className="stat-value">{creator.videoCount}</span>
        </div>
        
        {creator.latestVideoTitle && (
          <div className="stat-item latest-video">
            <span className="stat-label">LATEST VIDEO</span>
            <span className="stat-value latest-title">
              {creator.latestVideoTitle.length > 40 
                ? `${creator.latestVideoTitle.substring(0, 37)}...`
                : creator.latestVideoTitle}
            </span>
          </div>
        )}
      </div>
      
      <div className="tooltip-arrow"></div>
    </div>
  )
}

// Separate component for avatar with proper fallback handling
function CreatorAvatar({ creator }: { creator: Creator }) {
  const [hasError, setHasError] = React.useState(false)
  
  // Generate deterministic fallback based on creator name
  const fallbackAvatar = React.useMemo(() => {
    const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280']
    const colorIndex = creator.title.length % colors.length
    const initials = creator.title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return {
      backgroundColor: colors[colorIndex],
      initials
    }
  }, [creator.title])
  
  if (!creator.thumbnail || hasError) {
    return (
      <div 
        className="creator-avatar-fallback"
        style={{ backgroundColor: fallbackAvatar.backgroundColor }}
        title={creator.title}
      >
        {fallbackAvatar.initials}
      </div>
    )
  }
  
  return (
    <img
      src={creator.thumbnail}
      alt={creator.title}
      className="creator-avatar"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}