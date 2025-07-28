'use client'

import React from 'react'
import type { Highlight } from '@/lib/highlights'
import type { DigestVideo } from '@/lib/data/getDigestForUser'
import { processHighlightText, scrollToStoryKit } from '@/lib/utils/highlightInteractions'
import { getCategoryIcon } from '@/lib/config/ui'
import { VintageIcon } from './VintageIcon'

interface HighlightsSectionProps {
  highlights: Highlight[]
  userChannels: Record<string, string> // channel name -> channel ID
  availableVideos: DigestVideo[] // For entity matching
}

export function HighlightsSection({ highlights, userChannels, availableVideos }: HighlightsSectionProps) {
  if (highlights.length === 0) return null

  return (
    <section className="highlights-section newspaper-section">
      {/* Unified Highlights Container */}
      <div className="unified-highlights-container">
        {/* Header inside the container */}
        <div className="highlights-header">
          <h2 className="text-2xl">
            TODAY'S HIGHLIGHTS
          </h2>
          <div className="newspaper-meta mt-1">
            Editorial Analysis • Key Insights from Your Feed
          </div>
        </div>
        
        {/* All summaries inside the same container */}
        <div className="highlights-content">
          {highlights.map((highlight, index) => (
            <EditorialHighlight 
              key={index} 
              highlight={highlight} 
              userChannels={userChannels}
              availableVideos={availableVideos}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface EditorialHighlightProps {
  highlight: Highlight
  userChannels: Record<string, string>
  availableVideos: DigestVideo[]
}

function EditorialHighlight({ highlight, userChannels, availableVideos }: EditorialHighlightProps) {
  // Parse markdown-style formatting, add channel links, and make entities interactive
  const formatText = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/#\w+/g, '') // Remove all hashtags
      .replace(/\s*•\s*/g, '<br/>• ') // Convert bullets to proper line breaks
      .replace(/\s+/g, ' ') // Normalize spaces
    
    // Add channel links using database channel data
    Object.entries(userChannels).forEach(([channelName, channelId]) => {
      // Create a regex to find bolded channel names and replace with links
      const escapedChannelName = channelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const strongChannelRegex = new RegExp(`<strong>(${escapedChannelName})</strong>`, 'gi')
      formatted = formatted.replace(strongChannelRegex, 
        `<strong><a href="https://youtube.com/channel/${channelId}" target="_blank" rel="noopener noreferrer" class="newspaper-link">$1</a></strong>`
      )
    })
    
    // Add interactive entity matching for story navigation
    formatted = processHighlightText(formatted, availableVideos)
    
    return formatted
  }
  
  // Handle click events for interactive highlights
  const handleHighlightClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    const videoId = target.getAttribute('data-video-id')
    
    if (videoId) {
      event.preventDefault()
      scrollToStoryKit(videoId)
    }
  }
  
  const categoryIconData = getCategoryIcon(highlight.title)
  
  return (
    <div className="highlight-category">
      <h3 className="newspaper-headline text-xl mb-3 category-headline">
        <span className="category-icon">
          <VintageIcon 
            library={categoryIconData.library}
            iconName={categoryIconData.icon} 
            color="var(--primary-ink)" 
            size={12} 
          />
        </span>
        <span className="category-title">{highlight.title}</span>
      </h3>
      <div 
        className="newspaper-body text-base leading-relaxed interactive-highlights"
        onClick={handleHighlightClick}
        dangerouslySetInnerHTML={{ __html: formatText(highlight.summary) }}
      />
    </div>
  )
}

export function HighlightsPlaceholder() {
  return (
    <section className="newspaper-section">
      <div className="section-header mb-8">
        <h2 className="text-2xl">
          TODAY'S HIGHLIGHTS
        </h2>
        <div className="newspaper-meta mt-1">
          Generating Editorial Analysis...
        </div>
      </div>
      
      <div className="text-center py-12 border-2 border-dashed" style={{ borderColor: '#999' }}>
        <div className="text-6xl mb-4" style={{ color: '#666' }}>⚡</div>
        <p className="newspaper-body text-base max-w-md mx-auto" style={{ color: '#666' }}>
          Editorial highlights will appear here once we have sufficient content to analyze trends and patterns across your subscribed channels.
        </p>
      </div>
    </section>
  )
}