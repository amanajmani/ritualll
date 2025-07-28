import * as ct from 'countries-and-timezones'

/**
 * Timezone utilities for digest generation
 */

/**
 * Check if it's currently 5:30 PM in the user's timezone
 */
export function isDigestTime(userTimezone: string): boolean {
  try {
    const now = new Date()
    
    // Use Intl.DateTimeFormat for accurate timezone conversion
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const parts = formatter.formatToParts(now)
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    
    // Check if it's 5:30 PM (17:30) in user's timezone
    return hours === 17 && minutes >= 30 && minutes < 60
  } catch (error) {
    console.error(`Error checking digest time for timezone ${userTimezone}:`, error)
    // Default to UTC if timezone is invalid
    const utcTime = new Date()
    return utcTime.getUTCHours() === 17 && utcTime.getUTCMinutes() >= 30 && utcTime.getUTCMinutes() < 60
  }
}

/**
 * Get videos from the last 24 hours based on user's timezone
 */
export function getVideosTimeWindow(userTimezone: string): Date {
  try {
    const now = new Date()
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }))
    
    // Get 24 hours ago in user's timezone
    const yesterday = new Date(userTime.getTime() - 24 * 60 * 60 * 1000)
    
    return yesterday
  } catch (error) {
    console.error(`Error calculating time window for timezone ${userTimezone}:`, error)
    // Fallback to 24 hours ago in UTC
    return new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
}

/**
 * Check if user should receive digest today (hasn't received one in last 20 hours)
 */
export function shouldProcessUser(lastBriefingDate: string | null, userTimezone: string): boolean {
  if (!lastBriefingDate) return true
  
  try {
    const lastBriefing = new Date(lastBriefingDate)
    const now = new Date()
    
    // Calculate hours since last briefing using UTC time (more reliable)
    const hoursSinceLastBriefing = (now.getTime() - lastBriefing.getTime()) / (1000 * 60 * 60)
    
    // Allow digest if more than 20 hours have passed (gives buffer for timezone differences)
    return hoursSinceLastBriefing >= 20
  } catch (error) {
    console.error(`Error checking if user should be processed:`, error)
    return true // Process user if we can't determine
  }
}

/**
 * Format current time in user's timezone for logging
 */
export function formatUserTime(userTimezone: string): string {
  try {
    const now = new Date()
    return now.toLocaleString("en-US", { 
      timeZone: userTimezone,
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch (error) {
    return new Date().toISOString()
  }
}

/**
 * Get location and formatted date from timezone using library
 */
export function getLocationFromTimezone(timezone: string): { location: string; date: string } {
  try {
    const now = new Date()
    
    // Get formatted date in user's timezone
    const date = now.toLocaleDateString("en-US", { 
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    // Use countries-and-timezones library to get location info
    const timezoneInfo = ct.getTimezone(timezone)
    const country = ct.getCountryForTimezone(timezone)
    
    let location = 'GLOBAL EDITION'
    
    if (timezoneInfo && country) {
      // Extract city name from timezone (e.g., "America/New_York" -> "NEW YORK")
      const parts = timezone.split('/')
      if (parts.length >= 2) {
        const cityName = parts[parts.length - 1]
          .replace(/_/g, ' ')
          .toUpperCase()
        
        // Format as "CITY, COUNTRY"
        location = `${cityName}, ${country.name}`
      } else {
        // Just use country name if no city can be extracted
        location = country.name.toUpperCase()
      }
    } else {
      // Fallback: extract from timezone string
      const parts = timezone.split('/')
      if (parts.length >= 2) {
        const cityOrRegion = parts[parts.length - 1]
          .replace(/_/g, ' ')
          .toUpperCase()
        location = `${cityOrRegion} EDITION`
      }
    }
    
    return { location, date }
  } catch (error) {
    console.error(`Error getting location from timezone ${timezone}:`, error)
    return { 
      location: 'GLOBAL EDITION',
      date: new Date().toLocaleDateString("en-US", { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }
}