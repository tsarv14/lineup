'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'

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

export default function Discover() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreators()
  }, [])

  const fetchCreators = async () => {
    try {
      const response = await api.get('/creators')
      // All creators returned should have storefronts (API now returns storefronts directly)
      const creatorsData = response.data || []
      
      // Fetch stats for each creator (always return stats, even if zero)
      const creatorsWithStats = await Promise.all(
        creatorsData.map(async (creator: Creator) => {
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
          // If no handle, return with zero stats
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
      
      setCreators(creatorsWithStats)
    } catch (error) {
      console.error('Error fetching creators:', error)
      setCreators([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Creators</h1>
          <p className="text-gray-400 mb-6">
            Browse all approved creators and discover their picks
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : creators.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No creators available yet</p>
            <p className="text-gray-500 text-sm">Check back soon for new creators!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Link
                key={creator._id}
                href={`/creator/${creator.storefront?.handle}`}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-primary-500/50 transition-all group"
              >
                <div className="text-center">
                  {creator.storefront?.logoImage ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src={creator.storefront.logoImage}
                        alt={creator.storefront.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                      {creator.storefront?.displayName?.charAt(0) || creator.username?.charAt(0) || 'C'}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {creator.storefront?.displayName || creator.username}
                  </h2>
                  {creator.storefront?.handle && (
                    <p className="text-primary-400 text-sm mb-3">@{creator.storefront.handle}</p>
                  )}
                  {creator.storefront?.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {creator.storefront.description}
                    </p>
                  )}
                  
                  {/* Stats Section - Always show, even if zero */}
                  <div className="mb-4 p-4 bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-lg border border-slate-700/50 backdrop-blur-sm shadow-lg">
                    {creator.stats ? (
                      <>
                        <div className="space-y-3">
                          {/* Dollar Amount */}
                          <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-gray-400 text-xs font-medium">$ w/l</span>
                            </div>
                            <span className={`font-bold text-sm ${(creator.stats.totalDollarsWon || (creator.stats.totalUnitsWon || 0) * 100 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(creator.stats.totalDollarsWon || (creator.stats.totalUnitsWon || 0) * 100 || 0) >= 0 ? '+' : ''}{(creator.stats.totalDollarsWon || (creator.stats.totalUnitsWon || 0) * 100 || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Units */}
                          <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <span className="text-gray-400 text-xs font-medium">Units w/l</span>
                            </div>
                            <span className={`font-bold text-sm ${(creator.stats.totalUnitsWon || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(creator.stats.totalUnitsWon || 0) >= 0 ? '+' : ''}{(creator.stats.totalUnitsWon || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {/* ROI */}
                          <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <span className="text-gray-400 text-xs font-medium">ROI</span>
                            </div>
                            <span className={`font-bold text-sm ${(creator.stats.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(creator.stats.roi || 0) >= 0 ? '+' : ''}{(creator.stats.roi || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        {creator.stats.transparencyScore > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <p className="text-gray-400 text-xs font-medium">Transparency</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                                  <div 
                                    className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 transition-all shadow-glow shadow-primary-500/30"
                                    style={{ width: `${creator.stats.transparencyScore}%` }}
                                  />
                                </div>
                                <p className="text-white text-xs font-bold min-w-[2.5rem] text-right">{creator.stats.transparencyScore.toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        {/* Dollar Amount - Zero */}
                        <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-slate-700/50 opacity-60">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center border border-slate-600/30">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-gray-500 text-xs font-medium">$ w/l</span>
                          </div>
                          <span className="font-bold text-sm text-gray-500">$0.00</span>
                        </div>
                        
                        {/* Units - Zero */}
                        <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-slate-700/50 opacity-60">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center border border-slate-600/30">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <span className="text-gray-500 text-xs font-medium">Units w/l</span>
                          </div>
                          <span className="font-bold text-sm text-gray-500">0.00</span>
                        </div>
                        
                        {/* ROI - Zero */}
                        <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-slate-700/50 opacity-60">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center border border-slate-600/30">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <span className="text-gray-500 text-xs font-medium">ROI</span>
                          </div>
                          <span className="font-bold text-sm text-gray-500">0.0%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <span className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm inline-block">
                    View Creator Profile
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

