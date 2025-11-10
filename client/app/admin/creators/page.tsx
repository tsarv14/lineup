'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

interface Creator {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  username: string
  storefront?: {
    _id: string
    handle: string
    displayName: string
    description?: string
    logoImage?: string
    bannerImage?: string
    createdAt: string
  }
  createdAt: string
}

export default function AdminCreatorsPage() {
  const router = useRouter()
  const { user, loading: authLoading, checkAuth } = useAuth()
  const [loading, setLoading] = useState(true)
  const [creators, setCreators] = useState<Creator[]>([])
  const [fixing, setFixing] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      checkAuth()
    }
  }, [])

  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.includes('admin'))) {
      setTimeout(() => {
        router.push('/')
      }, 1000)
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.roles?.includes('admin')) {
      fetchCreators()
    }
  }, [user])

  const fetchCreators = async () => {
    setLoading(true)
    try {
      const response = await api.get('/creators')
      setCreators(response.data || [])
    } catch (error) {
      console.error('Error fetching creators:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixCreator = async (handle: string) => {
    setFixing(handle)
    try {
      await api.post(`/admin/fix-creator/${handle}`)
      toast.success('Creator fixed successfully!')
      await fetchCreators()
    } catch (error: any) {
      console.error('Error fixing creator:', error)
      toast.error(error.response?.data?.message || 'Failed to fix creator')
    } finally {
      setFixing(null)
    }
  }

  if (authLoading || loading) {
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">All Creators</h1>
              <p className="text-gray-400">View and manage all approved creators</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {creators.length === 0 ? (
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-12 text-center">
            <p className="text-gray-400 text-lg">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <div
                key={creator._id}
                className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {creator.storefront?.logoImage ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={creator.storefront.logoImage}
                        alt={creator.storefront.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {creator.storefront?.displayName?.charAt(0) || creator.username?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-1 truncate">
                      {creator.storefront?.displayName || creator.username}
                    </h3>
                    {creator.storefront?.handle && (
                      <p className="text-primary-400 text-sm mb-1">@{creator.storefront.handle}</p>
                    )}
                    <p className="text-gray-400 text-sm truncate">{creator.email}</p>
                  </div>
                </div>

                {creator.storefront?.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {creator.storefront.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-white">
                      {creator.firstName && creator.lastName
                        ? `${creator.firstName} ${creator.lastName}`
                        : creator.username}
                    </span>
                  </div>
                  {creator.storefront && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-white">
                        {new Date(creator.storefront.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {creator.storefront?.handle && (
                  <div className="flex gap-2">
                    <Link
                      href={`/creator/${creator.storefront.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Page
                    </Link>
                    <button
                      onClick={() => fixCreator(creator.storefront!.handle)}
                      disabled={fixing === creator.storefront.handle}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fix creator role and storefront link"
                    >
                      {fixing === creator.storefront.handle ? 'Fixing...' : 'Fix'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

