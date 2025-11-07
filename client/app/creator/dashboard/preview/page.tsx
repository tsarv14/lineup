'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import SportIcon from '@/components/SportIcon'
import Footer from '@/components/Footer'

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
  createdAt: string
  eventDate?: string
}

export default function CustomerPreviewPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated && user?.roles?.includes('creator')) {
      fetchData()
    }
  }, [isAuthenticated, authLoading, user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch storefront
      const storefrontResponse = await api.get('/creator/storefront')
      setStorefront(storefrontResponse.data)

      // Fetch plans
      const plansResponse = await api.get('/creator/plans')
      setPlans(plansResponse.data.filter((p: Plan) => !p.archived))

      // Fetch picks
      const picksResponse = await api.get('/creator/picks')
      setPicks(picksResponse.data.slice(0, 6)) // Show recent 6 picks
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user?.roles?.includes('creator')) {
    return null
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-black">
        <div className="text-center py-20">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 max-w-md mx-auto">
            <p className="text-gray-400 mb-4">No storefront found. Please set up your storefront first.</p>
            <Link
              href="/creator/dashboard/store"
              className="inline-block px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
            >
              Set Up Storefront
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Preview Banner */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/30 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Mode - This is how customers see your storefront
          </div>
          <Link
            href="/creator/dashboard"
            className="px-4 py-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Banner Section */}
      {storefront.bannerImage && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <img
            src={storefront.bannerImage}
            alt={storefront.displayName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          {storefront.logoImage && (
            <div className="mb-6 flex justify-center">
              <img
                src={storefront.logoImage}
                alt={storefront.displayName}
                className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-slate-800"
              />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{storefront.displayName}</h1>
          {storefront.description && (
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{storefront.description}</p>
          )}
        </div>

        {/* About Section */}
        {storefront.aboutText && (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 mb-12 relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-4">About Us</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-300 whitespace-pre-wrap">{storefront.aboutText}</p>
                </div>
                {storefront.aboutImage && (
                  <div>
                    <img
                      src={storefront.aboutImage}
                      alt="About"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sports Filter Section */}
        {storefront.sports && storefront.sports.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Picks For...</h2>
            <div className="flex flex-wrap gap-4">
              {storefront.sports.map((sport) => (
                <button
                  key={sport}
                  className="px-6 py-3 bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-primary-500/50 transition-all text-white font-medium flex items-center gap-2 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex items-center gap-2">
                    <SportIcon sport={sport} className="w-5 h-5" />
                    {sport}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        {plans.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Subscription Plans</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all relative overflow-hidden group shadow-lg shadow-black/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    )}
                    {plan.isFree ? (
                      <div className="text-3xl font-bold text-white mb-4">Free</div>
                    ) : (
                      <div className="mb-4">
                        {plan.billingVariants.map((variant, idx) => (
                          <div key={idx} className="text-2xl font-bold text-white mb-2">
                            ${(variant.priceCents / 100).toFixed(2)}
                            <span className="text-sm text-gray-400 font-normal ml-2 capitalize">
                              /{variant.interval === 'two_weeks' ? '2 weeks' : variant.interval === 'daily' ? 'day' : variant.interval}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {plan.freeTrialDays > 0 && (
                      <div className="text-sm text-green-400 mb-4">
                        {plan.freeTrialDays}-day free trial
                      </div>
                    )}
                    <Link
                      href={`/creator/${storefront.handle}/subscribe/${plan._id}`}
                      className="block w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 text-center font-semibold"
                    >
                      Subscribe
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Picks */}
        {picks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Picks</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {picks.map((pick) => (
                <Link
                  key={pick._id}
                  href={`/creator/${storefront.handle}/pick/${pick._id}`}
                  className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all relative overflow-hidden group shadow-lg shadow-black/20 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{pick.title}</h3>
                      {pick.isFree && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs rounded-lg font-semibold">Free</span>
                      )}
                    </div>
                    {pick.sport && (
                      <div className="flex items-center gap-2 mb-2">
                        <SportIcon sport={pick.sport} className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{pick.sport}</span>
                      </div>
                    )}
                    {pick.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{pick.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(pick.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 mb-12 relative overflow-hidden group shadow-lg shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Choose a Plan</h3>
                <p className="text-gray-400 text-sm">Select a subscription plan that fits your needs</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Get Access</h3>
                <p className="text-gray-400 text-sm">Gain instant access to all picks and content</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Start Winning</h3>
                <p className="text-gray-400 text-sm">Follow the picks and start winning today</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

