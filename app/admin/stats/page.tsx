import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDailyStats } from '@/lib/analytics/trackUsage'
import { supabaseAdmin } from '@/lib/supabase'

// Simple admin check - in production, implement proper admin authentication
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()
    
    // Add your admin emails here
    const adminEmails = ['your-admin-email@example.com']
    return adminEmails.includes(user?.email || '')
  } catch {
    return false
  }
}

export default async function AdminStatsPage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    redirect('/login')
  }

  const isUserAdmin = await isAdmin(userId)
  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  // Get stats for today and yesterday
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const [todayStats, yesterdayStats] = await Promise.all([
    getDailyStats(today),
    getDailyStats(yesterday),
  ])

  // Get recent errors
  const { data: recentErrors } = await supabaseAdmin
    .from('summary_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ritualll Admin Dashboard
          </h1>
          <p className="text-gray-600">System performance and usage statistics</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Stats */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Today's Stats ({today})
            </h2>
            {todayStats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="font-medium">{todayStats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Videos:</span>
                  <span className="font-medium">{todayStats.totalVideos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Summaries Generated:</span>
                  <span className="font-medium">{todayStats.totalSummaries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">{todayStats.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Duration:</span>
                  <span className="font-medium">{todayStats.avgDurationSeconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Errors:</span>
                  <span className="font-medium">{todayStats.totalErrors}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No data available for today</p>
            )}
          </div>

          {/* Yesterday's Stats */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Yesterday's Stats ({yesterday})
            </h2>
            {yesterdayStats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="font-medium">{yesterdayStats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Videos:</span>
                  <span className="font-medium">{yesterdayStats.totalVideos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Summaries Generated:</span>
                  <span className="font-medium">{yesterdayStats.totalSummaries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">{yesterdayStats.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Duration:</span>
                  <span className="font-medium">{yesterdayStats.avgDurationSeconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Errors:</span>
                  <span className="font-medium">{yesterdayStats.totalErrors}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No data available for yesterday</p>
            )}
          </div>
        </div>

        {/* Error Breakdown */}
        {todayStats?.errorsByType && Object.keys(todayStats.errorsByType).length > 0 && (
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Today's Error Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(todayStats.errorsByType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-red-600">{count as number}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {recentErrors && recentErrors.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Errors (Last 10)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Video ID</th>
                    <th className="text-left py-2">Error Type</th>
                    <th className="text-left py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {recentErrors.map((error) => (
                    <tr key={error.id} className="border-b">
                      <td className="py-2">
                        {new Date(error.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 font-mono text-xs">{error.video_id}</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          {error.error_type}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">
                        {error.error_message || 'No message'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}