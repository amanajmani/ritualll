'use client'

interface RetroThumbnailProps {
  src: string
  alt: string
  category: string
  videoId: string
}

const categoryBadges: Record<string, string> = {
  'Technology': '💻',
  'Gaming': '🕹',
  'Entertainment': '📺',
  'Music': '🎵',
  'Sports': '🏈',
  'Education': '📚',
  'News': '📰',
  'Business': '💼',
  'Lifestyle': '✨',
  'Other': '📺',
}

const categoryColors: Record<string, string> = {
  'Technology': '#00e2d5', // Teal
  'Gaming': '#00ff00', // Green
  'Entertainment': '#ffda3e', // Yellow
  'Music': '#ff6b9d', // Pink
  'Sports': '#ff4757', // Red
  'Education': '#5352ed', // Blue
  'News': '#ff4757', // Red
  'Business': '#ffa502', // Orange
  'Lifestyle': '#ff6b9d', // Pink
  'Other': '#ffda3e', // Yellow
}

export function RetroThumbnail({ src, alt, category, videoId }: RetroThumbnailProps) {
  const badge = categoryBadges[category] || '📺'
  const borderColor = categoryColors[category] || '#ffda3e'
  
  return (
    <div className="relative inline-block group">
      {/* 8-bit pixel border container */}
      <div 
        className="
          relative w-[160px] h-[90px] 
          border-2 border-dotted 
          bg-black 
          pixelated
          transition-all duration-300
          hover:shadow-lg
        "
        style={{
          borderColor: borderColor,
          boxShadow: `0 0 0 1px ${borderColor}40`,
        }}
      >
        {/* Main thumbnail - full color with pixelation */}
        <img 
          src={src}
          alt={alt}
          className="
            w-full h-full 
            object-cover 
            pixelated
            transition-all duration-300
          "
          style={{
            imageRendering: 'pixelated',
            filter: 'brightness(110%) saturate(125%) contrast(1.1)',
          }}
        />
        
        {/* Corner badge with pixel frame */}
        <div 
          className="
            absolute top-1 left-1 
            text-xs 
            bg-black text-white 
            px-1 py-0.5 
            border border-white
            font-mono
            shadow-sm
          "
          style={{
            borderColor: borderColor,
            backgroundColor: '#000',
            color: borderColor,
          }}
        >
          {badge} CLIP
        </div>
        
        {/* CRT scanline overlay */}
        <div 
          className="
            absolute inset-0 
            pointer-events-none
            opacity-0 group-hover:opacity-30
            transition-opacity duration-300
          " 
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                ${borderColor}20 2px,
                ${borderColor}20 4px
              )
            `,
          }} 
        />
        
        {/* Shine effect on hover */}
        <div className="
          absolute inset-0 
          pointer-events-none
          opacity-0 group-hover:opacity-40
          transition-opacity duration-500
          bg-gradient-to-r 
          from-transparent 
          via-white 
          to-transparent
          transform -skew-x-12
          animate-pulse
        " />
      </div>
    </div>
  )
}

export function RetroThumbnailLarge({ src, alt, category, videoId }: RetroThumbnailProps) {
  const badge = categoryBadges[category] || '📺'
  
  return (
    <div className="relative inline-block">
      {/* Larger thumbnail for featured content */}
      <img 
        src={src}
        alt={alt}
        className="
          w-[240px] h-[135px] 
          grayscale 
          border-2 border-gray-900 
          rounded-sm 
          shadow-lg 
          pixelated
          transition-all duration-300
          hover:grayscale-0 hover:shadow-xl
        "
        style={{
          imageRendering: 'pixelated',
          filter: 'grayscale(100%) contrast(1.2) brightness(0.85) sepia(10%)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'grayscale(0%) contrast(1.1) brightness(1.0) sepia(0%)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'grayscale(100%) contrast(1.2) brightness(0.85) sepia(10%)'
        }}
      />
      
      {/* Category badge - larger */}
      <div className="
        absolute -top-2 -right-2 
        bg-gray-900 text-white 
        w-8 h-8 
        flex items-center justify-center 
        text-sm
        border-2 border-gray-600
        rounded-sm
        shadow-md
        retro-badge
      ">
        {badge}
      </div>
      
      {/* Enhanced scan lines for larger thumbnail */}
      <div className="
        absolute inset-0 
        pointer-events-none
        opacity-15
        bg-gradient-to-b 
        from-transparent 
        via-gray-900 
        to-transparent
      " 
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)',
      }} />
      
      {/* Corner glow effect */}
      <div className="
        absolute inset-0 
        pointer-events-none
        opacity-0 hover:opacity-30
        transition-opacity duration-300
        bg-gradient-radial 
        from-blue-400 
        via-transparent 
        to-transparent
      " />
    </div>
  )
}