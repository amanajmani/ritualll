/**
 * UI Configuration - Enterprise-grade configurable constants
 * All UI behavior should be driven by these values, not hardcoded
 */

export const UI_CONFIG = {
  // Creator Stats Header
  CREATOR_STATS: {
    MAX_VISIBLE_AVATARS: {
      MOBILE: 6,
      TABLET: 8,
      DESKTOP: 12,
    },
    AVATAR_OVERLAP_PX: -8,
    AVATAR_SIZE_PX: 28,
  },
  
  // Video Duration Formatting
  DURATION: {
    SHOW_HOURS: true,
    COMPACT_FORMAT: true, // 1:23:45 vs 1h 23m 45s
  },
  
  // View Count Formatting
  VIEWS: {
    COMPACT_THRESHOLDS: {
      THOUSAND: 1000,
      MILLION: 1000000,
      BILLION: 1000000000,
    },
    DECIMAL_PLACES: 1,
  },
  
  // Interactive Highlights
  HIGHLIGHTS: {
    SCROLL_BEHAVIOR: 'smooth' as ScrollBehavior,
    SCROLL_OFFSET_PX: 80, // Account for any fixed headers
  },
  
  // Responsive Breakpoints (should match CSS)
  BREAKPOINTS: {
    MOBILE_MAX: 767,
    TABLET_MIN: 768,
    TABLET_MAX: 1023,
    DESKTOP_MIN: 1024,
  },
  
  // Unified geometric category icons - all use Hopeful Cyan for discipline
  VINTAGE_CATEGORY_ICONS: {
    'Technology': { library: 'gi', icon: 'GiCpuShot', color: '#0BC5EA', bgColor: 'transparent' },
    'Education': { library: 'gi', icon: 'GiGraduateCap', color: '#0BC5EA', bgColor: 'transparent' },
    'Entertainment': { library: 'gi', icon: 'GiTheater', color: '#0BC5EA', bgColor: 'transparent' },
    'News': { library: 'gi', icon: 'GiNewspaper', color: '#0BC5EA', bgColor: 'transparent' },
    'Music': { library: 'gi', icon: 'GiMusicalNote', color: '#0BC5EA', bgColor: 'transparent' },
    'Gaming': { library: 'gi', icon: 'GiJoystick', color: '#0BC5EA', bgColor: 'transparent' },
    'Lifestyle': { library: 'gi', icon: 'GiDiamondRing', color: '#0BC5EA', bgColor: 'transparent' },
    'Business': { library: 'gi', icon: 'GiMoneyStack', color: '#0BC5EA', bgColor: 'transparent' },
    'Science': { library: 'gi', icon: 'GiTestTube', color: '#0BC5EA', bgColor: 'transparent' },
    'Sports': { library: 'gi', icon: 'GiTrophy', color: '#0BC5EA', bgColor: 'transparent' },
    'Health': { library: 'gi', icon: 'GiHeartOrgan', color: '#0BC5EA', bgColor: 'transparent' },
    'Travel': { library: 'gi', icon: 'GiCommercialAirplane', color: '#0BC5EA', bgColor: 'transparent' },
    'Food': { library: 'gi', icon: 'GiChefToque', color: '#0BC5EA', bgColor: 'transparent' },
    'Fashion': { library: 'gi', icon: 'GiDress', color: '#0BC5EA', bgColor: 'transparent' },
    'Politics': { library: 'gi', icon: 'GiCapitol', color: '#0BC5EA', bgColor: 'transparent' },
    'Comedy': { library: 'gi', icon: 'GiJesterHat', color: '#0BC5EA', bgColor: 'transparent' },
    'Documentary': { library: 'gi', icon: 'GiFilmProjector', color: '#0BC5EA', bgColor: 'transparent' },
    'Other': { library: 'gi', icon: 'GiRadioTower', color: '#0BC5EA', bgColor: 'transparent' }
  },
} as const

// Helper function to get responsive values
export function getResponsiveValue<T>(
  config: { MOBILE: T; TABLET: T; DESKTOP: T },
  screenWidth?: number
): T {
  if (!screenWidth || typeof window === 'undefined') {
    return config.DESKTOP // Default for SSR
  }
  
  if (screenWidth <= UI_CONFIG.BREAKPOINTS.MOBILE_MAX) {
    return config.MOBILE
  }
  
  if (screenWidth <= UI_CONFIG.BREAKPOINTS.TABLET_MAX) {
    return config.TABLET
  }
  
  return config.DESKTOP
}

// Utility functions for formatting
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0 && UI_CONFIG.DURATION.SHOW_HOURS) {
    return UI_CONFIG.DURATION.COMPACT_FORMAT
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${hours}h ${minutes}m ${secs}s`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatViews(views: number): string {
  if (!views || views <= 0) return '0 views'
  
  const { THOUSAND, MILLION, BILLION } = UI_CONFIG.VIEWS.COMPACT_THRESHOLDS
  const { DECIMAL_PLACES } = UI_CONFIG.VIEWS
  
  if (views >= BILLION) {
    return `${(views / BILLION).toFixed(DECIMAL_PLACES)}B views`
  }
  
  if (views >= MILLION) {
    return `${(views / MILLION).toFixed(DECIMAL_PLACES)}M views`
  }
  
  if (views >= THOUSAND) {
    return `${(views / THOUSAND).toFixed(DECIMAL_PLACES)}K views`
  }
  
  return `${views} views`
}

// Get vintage icon for category
export function getCategoryIcon(category: string): { library: string; icon: string; color: string; bgColor: string } {
  return UI_CONFIG.VINTAGE_CATEGORY_ICONS[category as keyof typeof UI_CONFIG.VINTAGE_CATEGORY_ICONS] || UI_CONFIG.VINTAGE_CATEGORY_ICONS.Other
}