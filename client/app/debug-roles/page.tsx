'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

export default function DebugRoles() {
  const { user, checkAuth } = useAuth()
  const [serverUser, setServerUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchServerUser()
  }, [])

  const fetchServerUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setServerUser(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Role Debug Information</h1>
        
        <div className="space-y-6">
          {/* Client-side User (from AuthContext) */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Client-Side User (AuthContext)</h2>
            <pre className="bg-slate-800 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
            <div className="mt-4">
              <p className="text-gray-400 mb-2">Roles:</p>
              <div className="flex gap-2 flex-wrap">
                {user?.roles?.map((role: string) => (
                  <span key={role} className={`px-3 py-1 rounded-full text-sm ${
                    role === 'admin' 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-700 text-gray-300 border border-slate-600'
                  }`}>
                    {role}
                  </span>
                )) || <span className="text-gray-500">No roles</span>}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Has Admin: {user?.roles?.includes('admin') ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>

          {/* Server-side User (from API) */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Server-Side User (API Response)</h2>
            <pre className="bg-slate-800 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(serverUser, null, 2)}
            </pre>
            <div className="mt-4">
              <p className="text-gray-400 mb-2">Roles:</p>
              <div className="flex gap-2 flex-wrap">
                {serverUser?.roles?.map((role: string) => (
                  <span key={role} className={`px-3 py-1 rounded-full text-sm ${
                    role === 'admin' 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-700 text-gray-300 border border-slate-600'
                  }`}>
                    {role}
                  </span>
                )) || <span className="text-gray-500">No roles</span>}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Has Admin: {serverUser?.roles?.includes('admin') ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500/20 rounded-lg border border-yellow-500/30 p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Troubleshooting Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
              <li>Check if "admin" appears in the Server-Side User roles above</li>
              <li>If it doesn't, go back to MongoDB Compass and verify the roles array is: <code className="bg-slate-800 px-2 py-1 rounded">["subscriber", "admin"]</code></li>
              <li>Make sure you clicked "Update" to save the changes in MongoDB Compass</li>
              <li>If Server-Side has admin but Client-Side doesn't, click the button below to refresh</li>
              <li>If both show admin but /admin still redirects, try logging out and back in</li>
            </ol>
            <button
              onClick={() => {
                checkAuth()
                fetchServerUser()
              }}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Refresh User Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

