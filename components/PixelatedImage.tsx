'use client'

import { useState, useEffect } from 'react'
import { getPixelatedThumbnailProps, pixelateImageOnCanvas } from '@/lib/pixelation'

interface PixelatedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  pixelSize?: number
  className?: string
  useCanvas?: boolean
}

export function PixelatedImage({
  src,
  alt,
  width = 96,
  height = 54,
  pixelSize = 6,
  className = '',
  useCanvas = false
}: PixelatedImageProps) {
  const [pixelatedSrc, setPixelatedSrc] = useState<string>(src)
  const [isLoading, setIsLoading] = useState(useCanvas)

  useEffect(() => {
    if (!useCanvas) {
      setPixelatedSrc(src)
      setIsLoading(false)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const pixelated = pixelateImageOnCanvas(img, pixelSize)
        setPixelatedSrc(pixelated)
      } catch (error) {
        console.warn('Failed to pixelate image, using CSS fallback:', error)
        setPixelatedSrc(src)
      } finally {
        setIsLoading(false)
      }
    }

    img.onerror = () => {
      setPixelatedSrc(src)
      setIsLoading(false)
    }

    img.src = src
  }, [src, pixelSize, useCanvas])

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 border-2 border-black animate-pulse ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-full flex items-center justify-center text-8bit text-xs">
          LOADING...
        </div>
      </div>
    )
  }

  if (useCanvas) {
    return (
      <img
        src={pixelatedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`pixelated-thumb border-2 border-black ${className}`}
        loading="lazy"
      />
    )
  }

  // CSS-based pixelation (faster, no canvas required)
  return (
    <div 
      className={`overflow-hidden border-2 border-black ${className}`}
      style={{ width, height }}
    >
      <img
        src={src}
        alt={alt}
        className="pixelated-thumb w-full h-full object-cover"
        loading="lazy"
        style={{
          imageRendering: 'pixelated',
          filter: 'contrast(1.2) saturate(0.8)',
        }}
      />
    </div>
  )
}

// Simpler version for thumbnails
export function PixelatedThumbnail({
  src,
  alt,
  className = ''
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <PixelatedImage
      src={src}
      alt={alt}
      width={96}
      height={54}
      pixelSize={4}
      className={className}
      useCanvas={false}
    />
  )
}