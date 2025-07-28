'use client'

import React from 'react'
import * as HeroIcons from 'react-icons/hi2'
import * as GameIcons from 'react-icons/gi'
import * as FeatherIcons from 'react-icons/fi'

interface VintageIconProps {
  library: string
  iconName: string
  color: string
  size?: number
}

export function VintageIcon({ library, iconName, color, size = 24 }: VintageIconProps) {
  let IconComponent: any = null
  
  // Get the icon from the specified library
  switch (library) {
    case 'hi':
      IconComponent = (HeroIcons as any)[iconName]
      break
    case 'gi':
      IconComponent = (GameIcons as any)[iconName]
      break
    case 'fi':
      IconComponent = (FeatherIcons as any)[iconName]
      break
    default:
      // Fallback to Game Icons radio tower
      IconComponent = GameIcons.GiRadioTower
      break
  }
  
  if (!IconComponent) {
    // Ultimate fallback
    IconComponent = GameIcons.GiRadioTower
  }
  
  return <IconComponent size={size} style={{ color }} />
}