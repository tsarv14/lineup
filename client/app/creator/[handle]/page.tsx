'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'

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
    _id: string
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
  // Phase A/B fields
  selection?: string
  betType?: string
  oddsAmerican?: number
  unitsRisked?: number
  amountRisked?: number
  result?: 'pending' | 'win' | 'loss' | 'push' | 'void'
  status?: 'pending' | 'locked' | 'graded' | 'disputed'
  isVerified?: boolean
  verificationSource?: 'manual' | 'system' | 'api'
  gameStartTime?: string
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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedBillingVariant, setSelectedBillingVariant] = useState<string | null>(null)

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
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await api.get(`/creators/${handle}/plans`)
      const fetchedPlans = response.data || []
      setPlans(fetchedPlans)
      if (fetchedPlans.length > 0) {
        setSelectedPlan(fetchedPlans[0])
        if (fetchedPlans[0].billingVariants.length > 0) {
          setSelectedBillingVariant(fetchedPlans[0].billingVariants[0]._id)
        }
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error)
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
      setPicks([])
    }
  }

  if (loading) {
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

  if (!storefront) {
    return (
      <div className="min-h-screen bg-black">
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
  const allSports = storefront.sports && storefront.sports.length > 0 
    ? storefront.sports 
    : availableSports.length > 0 
      ? availableSports 
      : ['Football', 'College Football', 'Baseball', 'Basketball', 'Golf', 'Soccer']

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getIntervalText = (interval: string) => {
    if (interval === 'day') return 'day'
    if (interval === 'week') return 'week'
    if (interval === 'month') return 'month'
    if (interval === 'year') return 'year'
    return interval
  }

  const getSportIcon = (sport: string) => {
    const normalized = sport.toLowerCase()
    if (normalized.includes('football') && !normalized.includes('college')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_3597_24638)">
            <path d="M22.1001 1.9001C18.6641 -1.5309 9.37211 -0.0669036 4.65211 4.6521C-0.0678849 9.3711 -1.53089 18.6641 1.90011 22.1001C3.5067 23.4495 5.57392 24.1234 7.66711 23.9801C12.0012 23.9418 16.1656 22.2904 19.3481 19.3481C24.0661 14.6291 25.5311 5.3361 22.1001 1.9001ZM16.3331 2.0001C17.8971 1.87475 19.4509 2.34398 20.6841 3.3141C21.7001 4.3311 22.1111 6.3001 21.9591 8.5451L15.4591 2.0451C15.7541 2.0261 16.0501 2.0001 16.3331 2.0001ZM3.31611 20.6841C2.30011 19.6691 1.88911 17.7001 2.04111 15.4551L8.54111 21.9551C6.30011 22.1101 4.33111 21.7001 3.31611 20.6841ZM17.9341 17.9341C15.9983 19.7581 13.6033 21.0221 11.0051 21.5911L2.40511 12.9911C2.97541 10.3937 4.24084 8.00005 6.06611 6.0661C8.00514 4.24268 10.4044 2.98218 13.0061 2.4201L21.5921 11.0061C21.0232 13.6043 19.7588 15.999 17.9341 17.9341ZM17.7071 11.7071C17.5196 11.8946 17.2653 11.9999 17.0001 11.9999C16.735 11.9999 16.4806 11.8946 16.2931 11.7071L15.0001 10.4141L13.4141 12.0001L14.7071 13.2931C14.8026 13.3853 14.8788 13.4957 14.9312 13.6177C14.9836 13.7397 15.0112 13.8709 15.0124 14.0037C15.0135 14.1365 14.9882 14.2682 14.9379 14.3911C14.8877 14.5139 14.8134 14.6256 14.7195 14.7195C14.6256 14.8134 14.514 14.8876 14.3911 14.9379C14.2682 14.9882 14.1365 15.0135 14.0037 15.0123C13.8709 15.0112 13.7397 14.9836 13.6177 14.9312C13.4957 14.8788 13.3854 14.8026 13.2931 14.7071L12.0001 13.4141L10.4141 15.0001L11.7071 16.2931C11.8026 16.3853 11.8788 16.4957 11.9312 16.6177C11.9836 16.7397 12.0112 16.8709 12.0124 17.0037C12.0135 17.1365 11.9882 17.2682 11.9379 17.3911C11.8877 17.5139 11.8134 17.6256 11.7195 17.7195C11.6256 17.8134 11.514 17.8876 11.3911 17.9379C11.2682 17.9882 11.1365 18.0135 11.0037 18.0123C10.8709 18.0112 10.7397 17.9836 10.6177 17.9312C10.4957 17.8788 10.3854 17.8026 10.2931 17.7071L6.29312 13.7071C6.11096 13.5185 6.01016 13.2659 6.01244 13.0037C6.01472 12.7415 6.11989 12.4907 6.3053 12.3053C6.4907 12.1199 6.74152 12.0147 7.00371 12.0124C7.26591 12.0101 7.51851 12.1109 7.70711 12.2931L9.00011 13.5861L10.5861 12.0001L9.29311 10.7071C9.11096 10.5185 9.01016 10.2659 9.01244 10.0037C9.01472 9.7415 9.11989 9.49069 9.3053 9.30528C9.4907 9.11987 9.74152 9.0147 10.0037 9.01242C10.2659 9.01015 10.5185 9.11094 10.7071 9.2931L12.0001 10.5861L13.5861 9.0001L12.2931 7.7071C12.111 7.51849 12.0102 7.26589 12.0124 7.0037C12.0147 6.7415 12.1199 6.49069 12.3053 6.30528C12.4907 6.11987 12.7415 6.0147 13.0037 6.01242C13.2659 6.01014 13.5185 6.11094 13.7071 6.2931L17.7071 10.2931C17.8946 10.4806 17.9999 10.7349 17.9999 11.0001C17.9999 11.2653 17.8946 11.5196 17.7071 11.7071Z" fill="#0A0A0A"></path>
          </g>
        </svg>
      )
    }
    // Add more sport icons as needed
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="pt-8 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {storefront.logoImage ? (
                  <Image
                    src={storefront.logoImage}
                    alt="Storefront Logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                    {storefront.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white text-xl font-semibold">{storefront.displayName}</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/creator/${handle}/picks`}
                  className="px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-medium">See Picks</p>
                </Link>
                {storefront.socialLinks?.twitter && (
                  <a
                    href={storefront.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5 text-white">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                    </svg>
                  </a>
                )}
              </div>
            </div>
            {plans.length > 0 && selectedPlan && (
              <button className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2">
                Subscribe
                <span className="text-sm font-normal text-gray-600">
                  {selectedPlan.billingVariants.length > 0 && selectedBillingVariant
                    ? `${formatPrice(selectedPlan.billingVariants.find(v => v._id === selectedBillingVariant)?.priceCents || 0)} per ${getIntervalText(selectedPlan.billingVariants.find(v => v._id === selectedBillingVariant)?.interval || '')}`
                    : 'Select Plan'}
                </span>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Banner Section */}
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          {storefront.bannerImage ? (
            <Image
              src={storefront.bannerImage}
              alt="Storefront Banner"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-800"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Storefront Info Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/creator/${handle}`} className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                {storefront.logoImage ? (
                  <Image
                    src={storefront.logoImage}
                    alt="Store Logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                    {storefront.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white text-2xl font-bold">{storefront.displayName}</p>
            </Link>
          </div>
          
          {storefront.description && (
            <div className="mb-6">
              <p className="text-white text-lg font-semibold">
                {storefront.description}
              </p>
            </div>
          )}
          {storefront.aboutText && (
            <div className="mb-6">
              <p className="text-gray-400 text-base">
                {storefront.aboutText}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {plans.length > 0 && (
              <div className="flex gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    onClick={() => {
                      setSelectedPlan(plan)
                      if (plan.billingVariants.length > 0) {
                        setSelectedBillingVariant(plan.billingVariants[0]._id)
                      }
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedPlan?._id === plan._id
                        ? 'bg-white text-black'
                        : 'bg-transparent border border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    Subscribe
                    <span className="block text-xs font-normal mt-1">
                      {plan.billingVariants.length > 0
                        ? `${formatPrice(plan.billingVariants[0].priceCents)} per ${getIntervalText(plan.billingVariants[0].interval)}`
                        : 'Select Plan'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Link
                href={`/creator/${handle}/picks`}
                className="px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium">See Picks</p>
              </Link>
              {!isAuthenticated && (
                <Link
                  href={`/login?redirect_url=/creator/${handle}`}
                  className="px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-medium">Login</p>
                </Link>
              )}
              {storefront.socialLinks?.twitter && (
                <a
                  href={storefront.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5 text-white">
                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Plans Section */}
        {plans.length > 0 && (
          <div id="subscription-plans" className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {plans.slice(0, 3).map((plan) => (
                <div key={plan._id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <div className="mb-4">
                    <p className="text-white text-xl font-semibold mb-2">{plan.name}</p>
                    {plan.freeTrialDays > 0 && (
                      <p className="text-primary-400 text-sm">{plan.freeTrialDays} day Free Trial</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white text-3xl font-bold">
                        {plan.billingVariants.length > 0 ? formatPrice(plan.billingVariants[0].priceCents) : 'N/A'}
                      </p>
                      {plan.billingVariants.length > 1 && (
                        <select
                          className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-sm"
                          value={plan.billingVariants.find(v => v._id === selectedBillingVariant)?._id || plan.billingVariants[0]._id}
                          onChange={(e) => setSelectedBillingVariant(e.target.value)}
                        >
                          {plan.billingVariants.map((variant) => (
                            <option key={variant._id} value={variant._id}>
                              {getIntervalText(variant.interval)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    )}
                  </div>
                  <Link
                    href={`/creator/${handle}/subscribe/${plan._id}${selectedBillingVariant ? `?pid=${selectedBillingVariant}` : ''}`}
                    className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Subscribe
                  </Link>
                </div>
              ))}
            </div>
            {plans.length > 3 && (
              <div className="text-center">
                <Link
                  href={`/creator/${handle}/plans`}
                  className="inline-block px-6 py-3 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-medium">View All Plans</p>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* How It Works Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <p className="text-white text-3xl font-bold mb-4">How It Works</p>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              We partner with <span className="text-primary-400 font-semibold">Lineup</span> to deliver you our picks in realtime. Join us and other trusted cappers on the premier platform for sports content.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="40" fill="#0A0A0A"></circle>
                  <path fill="#C3A249" d="M47.949 49.705a.938.938 0 1 0 0-1.875.938.938 0 0 0 0 1.875ZM47.949 39.982a.937.937 0 1 0 0-1.875.937.937 0 0 0 0 1.875ZM51.079 49.705a.938.938 0 1 0 0-1.875.938.938 0 0 0 0 1.875ZM48.182 34.678H43.81a.938.938 0 0 0 0 1.875h4.373a.938.938 0 0 0 0-1.875Z"></path>
                  <path fill="#C3A249" d="M33.455 51.669c-1.851.615-3.74-.315-4.487-1.826-.323-.652.136-1.42.863-1.42h.197c.378 0 .678.258.826.607.237.561.794.956 1.44.956.861 0 1.562-.7 1.562-1.562 0-.826-.644-1.504-1.455-1.559-1.532-.104-2.97-.947-3.397-2.424a3.447 3.447 0 0 1 3.288-4.455c1.474 0 2.793.933 3.307 2.237.227.576-.224 1.2-.844 1.2h-.196c-.379 0-.678-.26-.825-.608a1.564 1.564 0 0 0-3.002.608c0 .86.702 1.563 1.563 1.563a3.448 3.448 0 0 1 3.281 4.485 3.347 3.347 0 0 1-2.118 2.198h-.003Z"></path>
                  <path fill="#C3A249" d="M31.356 40.922v-1.464a.937.937 0 1 1 1.874-.002v1.463h-1.874v.003ZM32.292 53.422a.938.938 0 0 1-.937-.938v-1.562h1.875v1.562c0 .518-.42.938-.938.938Z"></path>
                  <path fill="#C3A249" d="M32.307 58.435c-.465 0-.935-.03-1.406-.093-4.817-.642-8.516-4.775-8.799-9.83l-.483-8.697c-.054-.974.564-1.842 1.538-2.156.9-.29 1.61-1.033 1.852-1.94.264-.992 1.1-1.659 2.078-1.659h10.41c.978 0 1.813.667 2.078 1.66a2.828 2.828 0 0 0 1.852 1.94c.972.313 1.59 1.178 1.538 2.153l-.5 9.001a10.223 10.223 0 0 1-3.68 7.285 10.083 10.083 0 0 1-6.477 2.337Zm-5.218-22.5c-.144 0-.234.144-.266.268a4.658 4.658 0 0 1-3.088 3.241c-.094.03-.25.12-.241.267l.483 8.696c.232 4.157 3.248 7.555 7.174 8.077 2.349.313 4.635-.337 6.439-1.83a8.336 8.336 0 0 0 3.002-5.945l.5-8.998c.008-.137-.124-.23-.24-.267a4.657 4.657 0 0 1-3.09-3.241c-.032-.124-.122-.268-.266-.268H27.09Z"></path>
                  <path fill="#0A0A0A" d="m48.745 45.938-3.431-.003a.937.937 0 1 1 .002-1.875l3.431.002a2.82 2.82 0 0 0 2.816-2.812v-15a2.812 2.812 0 0 0-2.813-2.813H26.249a2.812 2.812 0 0 0-2.813 2.813v8.127a.938.938 0 0 1-1.875 0V26.25a4.688 4.688 0 0 1 4.688-4.688h22.5a4.688 4.688 0 0 1 4.687 4.688v15a4.7 4.7 0 0 1-4.691 4.688Z"></path>
                  <path fill="#0A0A0A" d="M53.749 53.438h-9.063a.938.938 0 0 1 0-1.876h9.063a2.812 2.812 0 0 0 2.812-2.812v-15a2.812 2.812 0 0 0-2.812-2.813h-1.25v-1.875h1.25a4.688 4.688 0 0 1 4.687 4.688v15a4.688 4.688 0 0 1-4.687 4.688Z"></path>
                  <path fill="#0A0A0A" d="M22.525 27.814H52.47v1.875H22.525v-1.875ZM52.47 35.855h5.029v1.876H52.47v-1.876Z"></path>
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Subscribe to a Plan</p>
              <p className="text-gray-400 text-sm">
                Find the right subscription plan and leverage our expertise to do the research for you - you can unsubscribe any time!
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="40" fill="#0A0A0A"></circle>
                  <path fill="#0A0A0A" d="M34.368 54.107a.96.96 0 1 0 0 1.919h2.143a.96.96 0 1 0 0-1.919h-2.143Z"></path>
                  <path fill="#0A0A0A" d="M46.083 50.623a.96.96 0 0 0-.96.96v3.762a2.74 2.74 0 0 1-2.735 2.736H28.379a2.74 2.74 0 0 1-2.736-2.736v-30.69a2.74 2.74 0 0 1 2.736-2.737h1.501a.956.956 0 0 0-.04.273c0 1.906 1.17 3.09 3.05 3.09h5.098c1.882 0 3.05-1.184 3.05-3.09a.956.956 0 0 0-.04-.273h1.39a2.74 2.74 0 0 1 2.736 2.737v2.395a.96.96 0 1 0 1.918 0v-2.395A4.66 4.66 0 0 0 42.388 20H28.379a4.66 4.66 0 0 0-4.655 4.655v30.69A4.66 4.66 0 0 0 28.38 60h14.008a4.66 4.66 0 0 0 4.655-4.655v-3.762c0-.53-.43-.96-.959-.96ZM39.12 22.191c0 .832-.328 1.172-1.132 1.172h-5.097c-.804 0-1.132-.34-1.132-1.172a.956.956 0 0 0-.04-.273h7.44a.956.956 0 0 0-.04.273Z"></path>
                  <path fill="#C3A249" d="M46.961 29.73a9.285 9.285 0 0 0-5.026 1.472 9.283 9.283 0 0 0-4.289 7.843c0 1.535.38 3.042 1.097 4.386l-1.06 3.706a.96.96 0 0 0 .923 1.223c.071 0 .141-.01.21-.026l.002.002 4.052-.922a9.338 9.338 0 0 0 4.091.946c5.136 0 9.315-4.178 9.315-9.315 0-5.136-4.179-9.315-9.315-9.315Zm0 16.711a7.406 7.406 0 0 1-3.51-.883.955.955 0 0 0-.659-.093c-.003 0-.005 0-.009.002l-2.81.639.724-2.534.004-.017a.956.956 0 0 0-.103-.736 7.385 7.385 0 0 1-1.033-3.774 7.373 7.373 0 0 1 3.406-6.229 7.369 7.369 0 0 1 3.99-1.167c4.078 0 7.396 3.318 7.396 7.396 0 4.078-3.318 7.396-7.396 7.396Z"></path>
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Receive Plays on your Phone</p>
              <p className="text-gray-400 text-sm">
                Plays will be sent directly to your phone via text or email (up to you) the second we upload them
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="40" fill="#0A0A0A"></circle>
                  <g clipPath="url(#b)">
                    <path fill="#0A0A0A" d="M60 34.62C60 26.56 53.441 20 45.38 20c-6.874 0-12.654 4.769-14.209 11.171C24.77 32.725 20 38.506 20 45.38 20 53.44 26.559 60 34.62 60c6.874 0 12.654-4.769 14.209-11.171C55.23 47.275 60 41.494 60 34.62ZM34.62 57.657c-6.769 0-12.276-5.507-12.276-12.276 0-5.432 3.546-10.05 8.444-11.664-.019.3-.03.6-.03.904 0 8.062 6.56 14.621 14.622 14.621.303 0 .605-.01.904-.029-1.614 4.898-6.232 8.444-11.663 8.444ZM46.898 45.38c0 .484-.029.963-.084 1.433a12.224 12.224 0 0 1-9.506-2.95h9.497c.061.497.093 1.003.093 1.517ZM35.23 41.519a12.238 12.238 0 0 1-1.504-3.037h11.046c.634.93 1.143 1.95 1.504 3.037H35.229Zm-2.032-5.38a12.328 12.328 0 0 1-.01-2.952 12.225 12.225 0 0 1 9.507 2.952h-9.498Zm16.015 10.145c.019-.3.03-.6.03-.904 0-8.062-6.56-14.621-14.621-14.621-.304 0-.606.01-.905.029 1.614-4.898 6.232-8.444 11.663-8.444 6.77 0 12.277 5.507 12.277 12.276 0 5.432-3.546 10.05-8.444 11.664Z"></path>
                  </g>
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Tail our Picks</p>
              <p className="text-gray-400 text-sm">
                Join the action and place the bets at your favorite sports book. Let's win more together!
              </p>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p className="text-white text-3xl font-bold mb-6">About Us</p>
              <p className="text-gray-400 text-base leading-relaxed">
                {storefront.aboutText || ''}
              </p>
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              {storefront.aboutImage ? (
                <Image
                  src={storefront.aboutImage}
                  alt="about"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  {storefront.logoImage ? (
                    <Image
                      src={storefront.logoImage}
                      alt="Store Logo"
                      width={200}
                      height={200}
                      className="object-contain"
                    />
                  ) : (
                    <div className="text-6xl font-bold text-primary-400/20">
                      {storefront.displayName.charAt(0)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Picks Section */}
        <div id="picks" className="mb-16">
          <p className="text-white text-3xl font-bold mb-6">Recent Picks</p>
          
          {/* Sport Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {allSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(selectedSport === sport ? null : sport)}
                className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                  selectedSport === sport
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-white hover:border-primary-500'
                }`}
              >
                {getSportIcon(sport)}
                <span className="text-sm font-medium">{sport}</span>
              </button>
            ))}
          </div>

          {/* Picks Display */}
          {filteredPicks.length === 0 ? (
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-lg">No picks available yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPicks.slice(0, 10).map((pick) => (
                <div key={pick._id} className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-primary-500 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white text-lg font-semibold">{pick.title}</h3>
                    {pick.isFree ? (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">Free</span>
                    ) : (
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                        ${((pick.oneOffPriceCents || 0) / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {pick.description && (
                    <p className="text-gray-400 text-sm mb-2">{pick.description}</p>
                  )}
                  {pick.sport && (
                    <span className="inline-block px-2 py-1 bg-slate-800 text-gray-300 text-xs rounded mb-2">{pick.sport}</span>
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
      </main>

      <Footer />
    </div>
  )
}
