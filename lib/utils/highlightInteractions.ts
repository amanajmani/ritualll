/**
 * Interactive Highlights - Enterprise-grade entity matching and smooth scrolling
 * Maps highlight text mentions to corresponding story kits on the page
 */

import { UI_CONFIG } from '@/lib/config/ui'
import type { DigestVideo } from '@/lib/data/getDigestForUser'

export interface EntityMatch {
  text: string
  targetVideoId: string
  startIndex: number
  endIndex: number
}

/**
 * Find all entity mentions in highlight text that match available videos
 */
export function findEntityMatches(
  highlightText: string,
  availableVideos: DigestVideo[]
): EntityMatch[] {
  const matches: EntityMatch[] = []
  
  // Create search patterns for channel names and video titles
  const entities = new Map<string, string>()
  
  availableVideos.forEach(video => {
    // Add channel names as searchable entities
    entities.set(video.channel_title.toLowerCase(), video.id)
    
    // Add cleaned video titles as searchable entities
    const cleanTitle = video.title
      .replace(/\|.*$/, '')
      .replace(/\s*-\s*.*$/, '')
      .replace(/^\[.*?\]\s*/, '')
      .replace(/\s*\(.*?\)\s*$/, '')
      .trim()
    
    // Split title into meaningful phrases (3+ words)
    const phrases = extractPhrases(cleanTitle)
    phrases.forEach(phrase => {
      if (phrase.length >= 15) { // Only meaningful phrases, longer threshold for better matches
        entities.set(phrase.toLowerCase(), video.id)
      }
    })
    
    // Also add full cleaned title if it's substantial
    if (cleanTitle.length >= 20) {
      entities.set(cleanTitle.toLowerCase(), video.id)
    }
  })
  
  // Search for entity matches in highlight text
  const lowerHighlight = highlightText.toLowerCase()
  
  entities.forEach((videoId, entityText) => {
    let searchIndex = 0
    let matchIndex = lowerHighlight.indexOf(entityText, searchIndex)
    
    while (matchIndex !== -1) {
      // Ensure we're matching whole words/phrases
      const isWordBoundary = isValidWordBoundary(
        lowerHighlight,
        matchIndex,
        matchIndex + entityText.length
      )
      
      if (isWordBoundary) {
        matches.push({
          text: highlightText.substring(matchIndex, matchIndex + entityText.length),
          targetVideoId: videoId,
          startIndex: matchIndex,
          endIndex: matchIndex + entityText.length
        })
      }
      
      searchIndex = matchIndex + 1
      matchIndex = lowerHighlight.indexOf(entityText, searchIndex)
    }
  })
  
  // Sort by start index and remove overlaps
  return deduplicateMatches(matches)
}

/**
 * Extract meaningful phrases from text
 */
function extractPhrases(text: string): string[] {
  const phrases: string[] = []
  const words = text.split(/\s+/).filter(word => word.length > 0)
  
  // Extract 3-10 word phrases to capture longer video titles
  for (let i = 0; i <= words.length - 3; i++) {
    for (let len = 3; len <= Math.min(10, words.length - i); len++) {
      const phrase = words.slice(i, i + len).join(' ')
      phrases.push(phrase)
    }
  }
  
  return phrases
}

/**
 * Check if match occurs at word boundaries
 */
function isValidWordBoundary(text: string, start: number, end: number): boolean {
  const beforeChar = start > 0 ? text[start - 1] : ' '
  const afterChar = end < text.length ? text[end] : ' '
  
  const wordBoundaryChars = /[\s.,;:!?\-'"()[\]{}]/
  
  return wordBoundaryChars.test(beforeChar) && wordBoundaryChars.test(afterChar)
}

/**
 * Remove overlapping matches, preferring longer ones
 */
function deduplicateMatches(matches: EntityMatch[]): EntityMatch[] {
  const sorted = matches.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex)
  })
  
  const deduplicated: EntityMatch[] = []
  
  for (const match of sorted) {
    const hasOverlap = deduplicated.some(existing => 
      (match.startIndex < existing.endIndex && match.endIndex > existing.startIndex)
    )
    
    if (!hasOverlap) {
      deduplicated.push(match)
    }
  }
  
  return deduplicated
}

/**
 * Smooth scroll to story kit element
 */
export function scrollToStoryKit(videoId: string): void {
  const element = document.querySelector(`[data-story-id="${videoId}"]`)
  
  if (element) {
    const elementTop = element.getBoundingClientRect().top
    const offsetTop = window.pageYOffset + elementTop - UI_CONFIG.HIGHLIGHTS.SCROLL_OFFSET_PX
    
    window.scrollTo({
      top: offsetTop,
      behavior: UI_CONFIG.HIGHLIGHTS.SCROLL_BEHAVIOR
    })
  }
}

/**
 * Process highlight text and wrap entity matches in interactive spans
 */
export function processHighlightText(
  highlightText: string,
  availableVideos: DigestVideo[]
): string {
  const matches = findEntityMatches(highlightText, availableVideos)
  
  if (matches.length === 0) {
    return highlightText
  }
  
  let processedText = ''
  let lastIndex = 0
  
  matches.forEach(match => {
    // Add text before the match
    processedText += highlightText.substring(lastIndex, match.startIndex)
    
    // Add the interactive span
    processedText += `<span class="highlight-link" data-video-id="${match.targetVideoId}">${match.text}</span>`
    
    lastIndex = match.endIndex
  })
  
  // Add remaining text
  processedText += highlightText.substring(lastIndex)
  
  return processedText
}