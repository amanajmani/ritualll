'use client'

import React from 'react'
import type { DigestVideo } from '@/lib/data/getDigestForUser'
import { formatDuration, formatViews } from '@/lib/config/ui'


interface StoryKitProps {
  video: DigestVideo
  variant: 'lead' | 'secondary' | 'horizontal'
}

export function StoryKit({ video, variant }: StoryKitProps) {
  // Helper function to get headline from summary or title
  const getHeadline = (video: DigestVideo) => {
    if (video.summary) {
      const lines = video.summary.split('\n').filter(line => line.trim())
      if (lines.length >= 4) {
        return cleanHashtagsAndFormatTitle(lines[0].trim())
      }
    }
    
    // Use ai_title if available (generated during cron job), otherwise fallback
    if (video.ai_title) {
      return video.ai_title
    }
    
    // Generate clean newspaper-style headline from title
    return generateCleanHeadline(video.title, video.description)
  }
  
  // Generate a clean, newspaper-style headline
  const generateCleanHeadline = (title: string, description: string) => {
    // Clean the title first
    let cleanTitle = title
      .replace(/\|.*$/, '') // Remove everything after |
      .replace(/\s*-\s*.*$/, '') // Remove everything after -
      .replace(/^\[.*?\]\s*/, '') // Remove [brackets] at start
      .replace(/\s*\(.*?\)\s*$/, '') // Remove (parentheses) at end
      .replace(/#\w+/g, '') // Remove all hashtags
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
    
    // If title is still too long or not descriptive, try to extract key info
    if (cleanTitle.length > 60 || cleanTitle.toLowerCase().includes('shorts')) {
      // Try to extract meaningful content from description or create from title
      const keyWords = extractKeywords(cleanTitle, description)
      if (keyWords.length > 0) {
        cleanTitle = keyWords.slice(0, 6).join(' ')
      }
    }
    
    // Clean up common patterns
    cleanTitle = cleanTitle
      .replace(/\b(shorts?|video|watch|new|latest)\b/gi, '') // Remove filler words
      .replace(/\s+/g, ' ')
      .trim()
    
    // Ensure it starts with capital letter and doesn't end with punctuation
    if (cleanTitle.length > 0) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)
      cleanTitle = cleanTitle.replace(/[.!?]+$/, '')
    }
    
    return cleanTitle || 'Breaking News'
  }
  
  // Extract meaningful keywords from title and description
  const extractKeywords = (title: string, description: string) => {
    const text = (title + ' ' + description.substring(0, 100)).toLowerCase()
    const words = text.split(/\s+/).filter(word => 
      word.length > 3 && 
      !word.match(/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|who|boy|did|she|use|way|what|when|where|will|with|have|this|that|they|been|from|into|your|more|said|each|like|than|them|were|some|time|very|upon|about|after|first|never|these|could|other|should|would|before|right|going|there|their|which|might|think|every|little|great|still|being|during|through|without|another|between|something)$/)
    )
    
    return words.slice(0, 10) // Return up to 10 meaningful words
  }

  // Helper function to get body text
  const getBodyText = (video: DigestVideo) => {
    if (video.summary) {
      const lines = video.summary.split('\n').filter(line => line.trim())
      if (lines.length >= 4) {
        return lines.slice(1).join(' ').trim()
      }
      return video.summary.trim()
    }
    // For videos without transcript, show only disclaimer
    return `*(this video does not have any transcript so making a summary wasn't possible)*`
  }

  // Clean hashtags and format titles
  const cleanHashtagsAndFormatTitle = (text: string) => {
    return text
      .replace(/#\w+/g, '') // Remove all hashtags
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }
  
  // Clean text of markdown formatting and hashtags for display
  const cleanText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#\w+/g, '') // Remove all hashtags
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }

  const headline = getHeadline(video)
  const bodyText = getBodyText(video)

  // Different layouts based on variant
  if (variant === 'horizontal') {
    // Horizontal layout for single stories
    return (
      <div className="story-kit-horizontal" data-story-id={video.id}>
        <div className="story-kit-image">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="vintage-thumbnail"
          />
        </div>
        
        <div className="story-kit-content">
          <h3 className="newspaper-headline story-kit-headline">
            {cleanText(headline)}
          </h3>
          
          <EnhancedByline video={video} />
          
          <div className={`newspaper-body story-summary story-kit-summary ${!video.summary ? 'no-transcript' : ''}`}>
            {cleanText(bodyText)}
          </div>
          
          <div className="story-cta story-kit-cta">
            <a
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch Video →
            </a>
          </div>
          
          {/* Finishing line - marks the end of this story kit */}
          <div className="story-finishing-line"></div>
        </div>
      </div>
    )
  }

  // Vertical layout for lead and secondary stories
  return (
    <div className={`story-kit-vertical ${variant === 'lead' ? 'story-kit-lead' : 'story-kit-secondary'}`} data-story-id={video.id}>
      <img
        src={video.thumbnail_url}
        alt={video.title}
        className="vintage-thumbnail story-kit-image"
      />
      
      <h3 className="newspaper-headline story-kit-headline">
        {cleanText(headline)}
      </h3>
      
      <EnhancedByline video={video} />
      
      <div className={`newspaper-body story-summary story-kit-summary ${!video.summary ? 'no-transcript' : ''}`}>
        {cleanText(bodyText)}
      </div>
      
      <div className="story-cta story-kit-cta">
        <a
          href={`https://youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch Video →
        </a>
      </div>
      
      {/* Finishing line - marks the end of this story kit */}
      <div className="story-finishing-line"></div>
    </div>
  )
}

// Enhanced byline component with avatar and metadata
function EnhancedByline({ video }: { video: DigestVideo }) {
  const [avatarError, setAvatarError] = React.useState(false)
  
  // Generate fallback avatar if needed
  const fallbackAvatar = React.useMemo(() => {
    const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280']
    const colorIndex = video.channel_title.length % colors.length
    const initials = video.channel_title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return {
      backgroundColor: colors[colorIndex],
      initials
    }
  }, [video.channel_title])
  
  return (
    <div className="enhanced-byline">
      {/* Creator info with avatar and name */}
      <div className="creator-info">
        <div className="creator-avatar-container">
          {video.channel_thumbnail && !avatarError ? (
            <img
              src={video.channel_thumbnail}
              alt={video.channel_title}
              className="creator-avatar-small"
              onError={() => setAvatarError(true)}
              loading="lazy"
            />
          ) : (
            <div 
              className="creator-avatar-small-fallback"
              style={{ backgroundColor: fallbackAvatar.backgroundColor }}
            >
              {fallbackAvatar.initials}
            </div>
          )}
        </div>
        
        <div className="creator-text">
          <div className="creator-name">
            {video.channel_title}
          </div>
          
          {/* Video metadata as second line - only show if we have data */}
          {(video.duration || video.views) && (
            <div className="video-metadata">
              {video.duration && (
                <span className="metadata-item">
                  {formatDuration(video.duration)}
                </span>
              )}
              
              {video.duration && video.views && (
                <span className="metadata-separator">·</span>
              )}
              
              {video.views && (
                <span className="metadata-item">
                  {formatViews(video.views)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}