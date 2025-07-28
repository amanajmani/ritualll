'use client'

import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    
    if (errorParam) {
      switch (errorParam) {
        case 'oauth_error':
          setError('OAuth authorization was denied or failed.')
          break
        case 'token_exchange':
          setError('Failed to exchange authorization code for tokens.')
          break
        case 'user_info':
          setError('Failed to get user information from Google.')
          break
        case 'user_creation':
          setError('Failed to create user account.')
          break
        case 'timeout':
          setError('Request timed out. Google servers may be temporarily unavailable. Please try again.')
          break
        case 'network':
          setError('Network connection failed. Please check your internet connection and try again.')
          break
        default:
          setError('An error occurred during login. Please try again.')
      }
    }
  }, [])

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true)
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          timezone,
        }),
      })

      if (response.ok) {
        window.location.href = '/loading'
      } else {
        console.error('Login failed')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  const handleYouTubeAuth = () => {
    setIsLoading(true)
    
    // Get client ID from environment
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (!clientId) {
      setError('Google Client ID not configured. Please check environment variables.')
      setIsLoading(false)
      return
    }
    
    // Redirect to Google OAuth with YouTube scope
    const redirectUri = `${window.location.origin}/api/auth/callback`
    const scope = 'openid email profile https://www.googleapis.com/auth/youtube.readonly'
    
    console.log('Redirect URI:', redirectUri) // Debug log
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`
    
    window.location.href = authUrl
  }

  const handleGoogleError = () => {
    console.error('Google login failed')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ritualll
          </h1>
          <p className="text-gray-600 mb-8">
            Your daily YouTube digest, delivered at 5:30 PM
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign in to continue
            </h2>
            <p className="text-gray-600 text-sm">
              We'll access your YouTube subscriptions to create your personalized digest
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-gray-600">Connecting to YouTube...</span>
              </div>
            ) : (
              <button
                onClick={handleYouTubeAuth}
                disabled={isLoading}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google & YouTube
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}