import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userId = request.cookies.get('user_id')?.value

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/google', '/api/auth/callback']
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If user is not authenticated and trying to access a protected route
  if (!userId && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is authenticated and trying to access login page
  if (userId && pathname === '/login') {
    return NextResponse.redirect(new URL('/loading', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}