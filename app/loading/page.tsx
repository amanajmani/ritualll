'use client'

import { useEffect, useState } from 'react'

export default function LoadingPage() {
  const [status, setStatus] = useState('Curating your newspaper...')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const startOnboarding = async () => {
      try {
        setStatus('Fetching your YouTube subscriptions...')
        setProgress(30)

        // Start the onboarding process
        const response = await fetch('/api/onboarding/start', {
          method: 'POST',
        })

        const data = await response.json()

        if (data.success) {
          if (data.alreadyOnboarded) {
            setStatus('Welcome back! Redirecting to your digest...')
            setProgress(100)
            setTimeout(() => {
              window.location.href = '/'
            }, 1000)
          } else {
            setStatus(`Found ${data.subscriptionCount} subscriptions! Generating your digest...`)
            setProgress(60)
            
            // Show progress for video processing
            setTimeout(() => {
              setStatus('Fetching latest videos from your channels...')
              setProgress(75)
            }, 2000)
            
            setTimeout(() => {
              setStatus('Creating AI summaries...')
              setProgress(90)
            }, 4000)
            
            setTimeout(() => {
              setProgress(100)
              setStatus(`All set! Found ${data.videoCount || 0} new videos. Redirecting...`)
              setTimeout(() => {
                window.location.href = '/'
              }, 1500)
            }, 6000)
          }
        } else if (data.needsYouTubeAuth) {
          setError('YouTube authorization required. Please sign in again with YouTube permissions.')
          setStatus('Authorization needed')
        } else {
          setError(data.error || 'Failed to set up your digest')
          setStatus('Setup failed')
        }
      } catch (error) {
        console.error('Onboarding error:', error)
        setError('Network error. Please check your connection and try again.')
        setStatus('Connection error')
      }
    }

    // Simulate initial progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 25) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 200)

    // Start onboarding after a short delay
    const timer = setTimeout(() => {
      startOnboarding()
    }, 1500)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              {error ? (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status}
            </h1>
            
            {error ? (
              <div className="text-red-600 text-sm mb-4">
                {error}
              </div>
            ) : (
              <p className="text-gray-600 text-sm mb-6">
                We're fetching your YouTube subscriptions and preparing your personalized digest.
              </p>
            )}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                error ? 'bg-red-500' : 'bg-gray-900'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {error ? (
            <button
              onClick={() => window.location.href = '/login'}
              className="btn-primary"
            >
              Try Again
            </button>
          ) : (
            <p className="text-xs text-gray-500">
              This usually takes 10-30 seconds
            </p>
          )}
        </div>
      </div>
    </div>
  )
}