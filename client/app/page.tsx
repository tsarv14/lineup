'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import api from '@/lib/api'

interface Creator {
  _id: string
  username: string
  storefront?: {
    _id: string
    handle: string
    displayName: string
    description?: string
    logoImage?: string
    bannerImage?: string
  }
  stats?: {
    winRate: number
    roi: number
    totalPicks: number
    wins: number
    losses: number
    totalUnitsWon: number
    totalDollarsWon?: number
    transparencyScore: number
  }
}

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user, loading } = useAuth()
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([])
  const [loadingCreators, setLoadingCreators] = useState(true)

  useEffect(() => {
    fetchFeaturedCreators()
  }, [])

  const fetchFeaturedCreators = async () => {
    try {
      const response = await api.get('/creators')
      const creatorsData = response.data || []
      
      // Get first 3 creators
      const firstThree = creatorsData.slice(0, 3)
      
      // Fetch stats for each creator
      const creatorsWithStats = await Promise.all(
        firstThree.map(async (creator: Creator) => {
          if (creator.storefront?.handle) {
            try {
              const statsResponse = await api.get(`/creators/${creator.storefront.handle}/stats`)
              return { ...creator, stats: statsResponse.data }
            } catch (error) {
              // If stats fail, return creator with zero stats
              return { 
                ...creator, 
                stats: {
                  winRate: 0,
                  roi: 0,
                  totalPicks: 0,
                  wins: 0,
                  losses: 0,
                  totalUnitsWon: 0,
                  transparencyScore: 0
                }
              }
            }
          }
          return { 
            ...creator, 
            stats: {
              winRate: 0,
              roi: 0,
              totalPicks: 0,
              wins: 0,
              losses: 0,
              totalUnitsWon: 0,
              transparencyScore: 0
            }
          }
        })
      )
      
      setFeaturedCreators(creatorsWithStats)
    } catch (error) {
      console.error('Error fetching featured creators:', error)
      setFeaturedCreators([])
    } finally {
      setLoadingCreators(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Lineup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white relative">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Discover the best{' '}
            <span className="text-primary-400 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              sports picks creators
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Browse top creators, subscribe to premium picks, and get access to expert predictions. Free trials available.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/discover')}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/50 transition-all transform hover:scale-105 text-lg font-semibold border border-primary-500/50"
            >
              Browse Creators
            </button>
            <button
              onClick={() => {
                if (isAuthenticated && user?.roles?.includes('creator')) {
                  router.push('/creator/dashboard')
                } else {
                  router.push('/apply')
                }
              }}
              className="px-8 py-4 bg-black/50 backdrop-blur-sm text-white border-2 border-slate-700 rounded-xl hover:border-primary-500/50 hover:bg-black/70 transition-all text-lg font-semibold"
            >
              Apply Now
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-black/50 backdrop-blur-sm text-white border-2 border-slate-700 rounded-xl hover:border-primary-500/50 hover:bg-black/70 transition-all text-lg font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
          {isAuthenticated && user && (
            <div className="text-center mt-6">
              <p className="text-gray-300">
                Welcome back, <span className="text-primary-400 font-semibold">{user.firstName || user.username}</span>!
              </p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Discover Creators</h3>
              <p className="text-gray-400">Browse thousands of verified creators and their track records.</p>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Free Trials</h3>
              <p className="text-gray-400">Try premium picks risk-free with 1, 3, or 7-day free trials.</p>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Real-time Alerts</h3>
              <p className="text-gray-400">Get instant notifications when your creators post new picks.</p>
            </div>
          </div>
        </div>

        {/* Featured Creators Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Featured Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingCreators ? (
              // Loading state
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 animate-pulse">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Display actual creators */}
                {featuredCreators.map((creator, index) => (
                  <Link
                    key={creator._id}
                    href={`/creator/${creator.storefront?.handle}`}
                    className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all cursor-pointer hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-4 mb-4">
                        {creator.storefront?.logoImage ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={creator.storefront.logoImage}
                              alt={creator.storefront.displayName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-glow">
                            {creator.storefront?.displayName?.charAt(0) || creator.username?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-white">{creator.storefront?.displayName || creator.username}</h3>
                          <p className="text-sm text-gray-400">@{creator.storefront?.handle || creator.username}</p>
                        </div>
                      </div>
                      {creator.storefront?.description && (
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{creator.storefront.description}</p>
                      )}
                      {/* Stats */}
                      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                        <p className="text-white font-semibold text-xs text-center">
                          ${(creator.stats?.totalDollarsWon || creator.stats?.totalUnitsWon * 100 || 0) >= 0 ? '+' : ''}{(creator.stats?.totalDollarsWon || creator.stats?.totalUnitsWon * 100 || 0).toFixed(2)} w/l | {(creator.stats?.totalUnitsWon || 0) >= 0 ? '+' : ''}{(creator.stats?.totalUnitsWon || 0).toFixed(2)} units w/l | {(creator.stats?.roi || 0) >= 0 ? '+' : ''}{(creator.stats?.roi || 0).toFixed(1)}% roi
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary-400 font-semibold text-sm">View Profile</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(`/creator/${creator.storefront?.handle}`)
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow transition-all text-sm border border-primary-500/50"
                        >
                          View Store
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Fill remaining slots with "Coming Soon" */}
                {Array.from({ length: Math.max(0, 3 - featuredCreators.length) }).map((_, i) => (
                  <div key={`coming-soon-${i}`} className="bg-black/20 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 opacity-50">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-600 font-bold text-lg">
                        ?
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-500">Coming Soon</h3>
                        <p className="text-sm text-gray-600">More creators</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">More creators will be available soon.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-semibold text-sm">Coming Soon</span>
                      <button disabled className="px-4 py-2 bg-slate-900 border border-slate-800 text-gray-600 rounded-lg cursor-not-allowed text-sm">
                        View Store
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
