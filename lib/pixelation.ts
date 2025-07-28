/**
 * Client-side pixelation utilities for 8-bit aesthetic
 */

import { useState, useEffect } from 'react'

export interface PixelationOptions {
  pixelSize?: number
  contrast?: number
  saturation?: number
}

/**
 * Apply pixelation effect to an image using CSS filters and transforms
 */
export function getPixelatedImageStyle(options: PixelationOptions = {}) {
  const {
    pixelSize = 4,
    contrast = 1.2,
    saturation = 0.8
  } = options

  return {
    imageRendering: 'pixelated' as const,
    filter: `contrast(${contrast}) saturate(${saturation})`,
    transform: `scale(${1 / pixelSize})`,
    transformOrigin: 'top left',
    width: `${pixelSize * 100}%`,
    height: `${pixelSize * 100}%`,
  }
}

/**
 * CSS class names for different pixelation levels
 */
export const pixelationClasses = {
  light: 'pixelated-light',
  medium: 'pixelated-medium', 
  heavy: 'pixelated-heavy',
  thumb: 'pixelated-thumb'
}

/**
 * Generate a pixelated thumbnail URL using CSS transforms
 * This is a client-side approach that doesn't require server processing
 */
export function getPixelatedThumbnailProps(
  src: string, 
  alt: string,
  options: PixelationOptions = {}
) {
  return {
    src,
    alt,
    className: `${pixelationClasses.thumb} border-2 border-black`,
    style: getPixelatedImageStyle(options),
    loading: 'lazy' as const,
  }
}

/**
 * Canvas-based pixelation for more authentic 8-bit effect
 * This runs client-side and creates a true pixelated image
 */
export function pixelateImageOnCanvas(
  imageElement: HTMLImageElement,
  pixelSize: number = 8
): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return imageElement.src

  // Set canvas size to original image size
  canvas.width = imageElement.naturalWidth
  canvas.height = imageElement.naturalHeight

  // Disable image smoothing for pixelated effect
  ctx.imageSmoothingEnabled = false

  // Draw image scaled down then scaled up for pixelation
  const scaledWidth = Math.floor(canvas.width / pixelSize)
  const scaledHeight = Math.floor(canvas.height / pixelSize)

  // Draw small version
  ctx.drawImage(imageElement, 0, 0, scaledWidth, scaledHeight)
  
  // Scale back up with no smoothing
  ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL()
}

/**
 * React hook for pixelated images
 */
export function usePixelatedImage(src: string, pixelSize: number = 8) {
  const [pixelatedSrc, setPixelatedSrc] = useState<string>(src)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const pixelated = pixelateImageOnCanvas(img, pixelSize)
        setPixelatedSrc(pixelated)
      } catch (error) {
        console.warn('Failed to pixelate image, using original:', error)
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
  }, [src, pixelSize])

  return { pixelatedSrc, isLoading }
}

// Note: Import useState and useEffect when using the hook
// import { useState, useEffect } from 'react'