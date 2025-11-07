'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import SportIcon from '@/components/SportIcon'

interface Storefront {
  _id: string
  handle: string
  displayName: string
  description?: string
  logoImage?: string
  bannerImage?: string
  aboutText?: string
  aboutImage?: string
  sports?: string[]
  socialLinks?: {
    twitter?: string
    instagram?: string
    website?: string
  }
  owner: {
    _id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

interface Plan {
  _id: string
  name: string
  description?: string
  isFree: boolean
  billingVariants: Array<{
    interval: string
    priceCents: number
  }>
  freeTrialDays: number
}

interface Pick {
  _id: string
  title: string
  description?: string
  sport?: string
  isFree: boolean
  oneOffPriceCents?: number
  createdAt: string
  eventDate?: string
}

export default function CreatorStorefront() {
  const params = useParams()
  const { isAuthenticated } = useAuth()
  const handle = params.handle as string
  
  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)

  useEffect(() => {
    if (handle) {
      fetchStorefront()
      fetchPlans()
      fetchPicks()
    }
  }, [handle, isAuthenticated])

  const fetchStorefront = async () => {
    try {
      const response = await api.get(`/creators/${handle}`)
      setStorefront(response.data)
    } catch (error: any) {
      console.error('Error fetching storefront:', error)
      if (error.response?.status === 404) {
        setStorefront(null)
      } else {
        // Show error but don't break the page
        console.error('Failed to load storefront:', error.response?.data?.message || error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await api.get(`/creators/${handle}/plans`)
      setPlans(response.data || [])
    } catch (error: any) {
      console.error('Error fetching plans:', error)
      // Silently fail - plans are optional
      setPlans([])
    }
  }

  const fetchPicks = async () => {
    try {
      if (isAuthenticated) {
        const response = await api.get(`/creators/${handle}/picks`)
        setPicks(response.data || [])
      } else {
        const response = await api.get(`/creators/${handle}/picks/public`)
        setPicks(response.data || [])
      }
    } catch (error: any) {
      console.error('Error fetching picks:', error)
      // Silently fail - picks are optional
      setPicks([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-gray-400">Creator not found</p>
        </div>
      </div>
    )
  }

  const filteredPicks = selectedSport 
    ? picks.filter(pick => pick.sport?.toLowerCase() === selectedSport.toLowerCase())
    : picks

  const availableSports = Array.from(new Set(picks.map(pick => pick.sport).filter(Boolean))) as string[]

  // SEO Metadata
  const pageTitle = storefront ? `${storefront.displayName} - Sports Picks | Lineup` : 'Creator Profile | Lineup'
  const pageDescription = storefront?.description || storefront?.aboutText || `Subscribe to ${storefront?.displayName || 'this creator'}'s premium sports picks on Lineup`
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const ogImage = storefront?.bannerImage || storefront?.logoImage || ''

  // Analytics tracking
  useEffect(() => {
    if (storefront && typeof window !== 'undefined') {
      // Track page view
      if ((window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
          page_title: pageTitle,
          page_location: pageUrl,
          creator_handle: handle
        })
      }
      
      // Custom analytics event
      if ((window as any).analytics) {
        (window as any).analytics.track('Creator Page Viewed', {
          creatorHandle: handle,
          creatorId: storefront.owner._id,
          timestamp: new Date().toISOString()
        })
      }
    }
  }, [storefront, handle, pageTitle, pageUrl])

  return (
    <div className="min-h-screen bg-slate-900">
        <Navbar />
      
      {/* Header with Logo and Action Buttons */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {storefront.logoImage ? (
                <img src={storefront.logoImage} alt={`${storefront.displayName} logo`} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
                  {storefront.displayName.charAt(0)}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{storefront.displayName}</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href={`/creator/${handle}/picks`}
                className="text-white hover:text-primary-400 transition-colors font-medium text-sm sm:text-base"
              >
                See Picks
              </Link>
              {plans.length > 0 && (
                <Link
                  href={`/creator/${handle}/plans`}
                  className="bg-white text-slate-900 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm sm:text-base"
                >
                  Subscribe
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative h-64 w-full overflow-hidden">
        {storefront.bannerImage ? (
          <img src={storefront.bannerImage} alt={`${storefront.displayName} banner`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-800"></div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* About Us Section */}
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">ABOUT US</h2>
            {storefront.aboutText ? (
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{storefront.aboutText}</p>
            ) : (
              <div className="space-y-4">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700 rounded w-4/6"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700 rounded w-3/6"></div>
              </div>
            )}
          </div>

          {/* Large Logo/Image Section */}
          <div className="flex items-center justify-center">
            {storefront.aboutImage ? (
              <img src={storefront.aboutImage} alt={`About ${storefront.displayName}`} className="w-full max-w-md rounded-lg" />
            ) : (
              <div className="w-full max-w-md aspect-square rounded-lg bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                {storefront.logoImage ? (
                  <img src={storefront.logoImage} alt={`${storefront.displayName} logo`} className="w-3/4 h-3/4 object-contain" />
                ) : (
                  <div className="text-9xl font-bold text-primary-400/20">
                    {storefront.displayName.charAt(0)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Picks Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">RECENT PICKS</h2>
          
          {/* Sport Filter Buttons */}
          {(storefront.sports && storefront.sports.length > 0) || availableSports.length > 0 ? (
            <div className="flex flex-wrap gap-3 mb-8">
              {(storefront.sports && storefront.sports.length > 0 ? storefront.sports : availableSports).map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(selectedSport === sport ? null : sport)}
                  className={`px-4 py-2 border rounded-full transition-colors flex items-center space-x-2 ${
                    selectedSport === sport
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-white hover:border-primary-500'
                  }`}
                >
                  <SportIcon sport={sport} className="w-5 h-5" />
                  <span className="font-medium">{sport.toUpperCase()}</span>
                </button>
              ))}
            </div>
          ) : null}

          {/* Picks Display */}
          {filteredPicks.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 min-h-[400px]">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-400 text-lg">No picks available yet</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPicks.slice(0, 6).map((pick) => (
                <div key={pick._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-primary-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{pick.title}</h3>
                      {pick.sport && (
                        <span className="inline-block px-2 py-1 bg-slate-700 text-gray-300 text-xs rounded mb-2">{pick.sport}</span>
                      )}
                    </div>
                    {pick.isFree ? (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">Free</span>
                    ) : (
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                        ${((pick.oneOffPriceCents || 0) / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {pick.description && (
                    <p className="text-gray-400 mb-4 line-clamp-3 text-sm">{pick.description}</p>
                  )}
                  <Link
                    href={`/creator/${handle}/pick/${pick._id}`}
                    className="text-primary-400 hover:text-primary-300 text-sm font-semibold"
                  >
                    View Pick →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-4">HOW IT WORKS</h2>
          <p className="text-gray-300 text-center max-w-3xl mx-auto mb-12 text-lg">
            We partner with <span className="font-semibold text-primary-400">Lineup</span> to deliver you our picks in realtime. Join us and other trusted cappers on the premier platform for sports content.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">SUBSCRIBE TO A PLAN</h3>
              <p className="text-gray-400">
                Find the right subscription plan and leverage our expertise to do the research for you - you can unsubscribe any time!
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">RECEIVE PLAYS ON YOUR PHONE</h3>
              <p className="text-gray-400">
                Plays will be sent directly to your phone via text or email (up to you) the second we upload them
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H1m12 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">TAIL OUR PICKS</h3>
              <p className="text-gray-400">
                Join the action and place the bets at your favorite sports book. Let's win together!
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
