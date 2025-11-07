'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'

interface Pick {
  _id: string
  title: string
  description?: string
  sport?: string
  creator: {
    _id: string
    username: string
    storefront?: {
      handle: string
      displayName: string
    }
  }
  createdAt: string
  eventDate?: string
}

export default function MyPicks() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      fetchPicks()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchPicks = async () => {
    try {
      const response = await api.get('/picks/my-picks')
      setPicks(response.data || [])
    } catch (error) {
      console.error('Error fetching picks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Picks</h1>
              <p className="text-gray-400 mt-1">View all your purchased and subscribed picks</p>
            </div>
          </div>
        </div>

        {picks.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
            <p className="text-gray-400 mb-4">You don't have any picks yet</p>
            <Link
              href="/discover"
              className="inline-block px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
            >
              Browse Creators
            </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {picks.map((pick) => (
              <div key={pick._id} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all relative overflow-hidden group shadow-lg shadow-black/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{pick.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    by{' '}
                    <Link
                      href={`/creator/${pick.creator.storefront?.handle || pick.creator.username}`}
                      className="text-primary-400 hover:text-primary-300"
                    >
                      {pick.creator.storefront?.displayName || pick.creator.username}
                    </Link>
                  </p>
                  {pick.sport && (
                    <span className="px-2 py-1 bg-slate-700 text-gray-300 text-xs rounded">{pick.sport}</span>
                  )}
                </div>
                {pick.description && (
                  <p className="text-gray-400 mb-4 line-clamp-3">{pick.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{new Date(pick.createdAt).toLocaleDateString()}</span>
                  {pick.eventDate && (
                    <span>Event: {new Date(pick.eventDate).toLocaleDateString()}</span>
                  )}
                </div>
                <Link
                  href={`/creator/${pick.creator.storefront?.handle || pick.creator.username}/pick/${pick._id}`}
                  className="block w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 text-center font-semibold"
                >
                  View Pick
                </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

