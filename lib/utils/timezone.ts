import { format, parseISO, addHours } from 'date-fns'

export function getUserLocalTime(timezone: string): Date {
  try {
    // Use proper Intl.DateTimeFormat for accurate timezone handling
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    const parts = formatter.formatToParts(now)
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0')
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1')
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const second = parseInt(parts.find(p => p.type === 'second')?.value || '0')
    
    return new Date(year, month, day, hour, minute, second)
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}, falling back to UTC`)
    return new Date()
  }
}

export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()
    const utc = new Date(now.toISOString().slice(0, -1) + '+00:00')
    const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    return (utc.getTime() - local.getTime()) / (1000 * 60 * 60)
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}, defaulting to UTC`)
    return 0
  }
}

export function is8AMInTimezone(timezone: string): boolean {
  const localTime = getUserLocalTime(timezone)
  return localTime.getHours() === 8
}

export function getNext8AM(timezone: string): Date {
  const now = getUserLocalTime(timezone)
  const next8AM = new Date(now)
  
  next8AM.setHours(8, 0, 0, 0)
  
  // If it's already past 8 AM today, set for tomorrow
  if (now.getHours() >= 8) {
    next8AM.setDate(next8AM.getDate() + 1)
  }
  
  return next8AM
}

export function isWithinLast24Hours(dateString: string): boolean {
  const date = parseISO(dateString)
  const now = new Date()
  // TESTING: Changed from 24 hours to 10 hours for testing
  const tenHoursAgo = addHours(now, -10)
  
  return date >= tenHoursAgo
}