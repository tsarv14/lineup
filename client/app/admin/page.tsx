'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, checkAuth } = useAuth()

  useEffect(() => {
    // Force refresh user data from server
    if (!authLoading) {
      checkAuth()
    }
  }, [])

  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.includes('admin'))) {
      // Add a small delay to show message
      setTimeout(() => {
        router.push('/')
      }, 1000)
      return
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user || !user.roles?.includes('admin')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400 mb-2">Checking admin access...</p>
          <p className="text-gray-500 text-sm">
            {!user ? 'Not logged in' : `Current roles: ${user.roles?.join(', ') || 'none'}`}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            If you just granted admin access, please log out and log back in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Creator Applications Card */}
          <Link
            href="/admin/applications"
            className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-primary-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center group-hover:bg-primary-600/30 transition-colors">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors">
                  Creator Applications
                </h3>
                <p className="text-gray-400 text-sm">Review and approve creator applications</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
              <span>Manage Applications</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* All Creators Card */}
          <Link
            href="/admin/creators"
            className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-primary-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-green-400 transition-colors">
                  All Creators
                </h3>
                <p className="text-gray-400 text-sm">View and manage all approved creators</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <span>View Creators</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* More admin features can be added here */}
        </div>
      </div>
    </div>
  )
}

