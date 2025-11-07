'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Pick {
  _id: string
  title: string
  description?: string
  sport?: string
  isFree: boolean
  oneOffPriceCents?: number
  media?: Array<{ url: string; type: string }>
  creator: {
    _id: string
    username: string
    firstName?: string
    lastName?: string
  }
  storefront: {
    handle: string
    displayName: string
  }
  eventDate?: string
  createdAt: string
}

export default function PickPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const handle = params.handle as string
  const pickId = params.pickId as string

  const [pick, setPick] = useState<Pick | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (pickId) {
      fetchPick()
    }
  }, [pickId, isAuthenticated])

  const fetchPick = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/picks/${pickId}`)
      setPick(response.data)
      setHasAccess(true)
    } catch (error: any) {
      if (error.response?.status === 403) {
        setHasAccess(false)
        toast.error('You need to subscribe to access this pick')
      } else if (error.response?.status === 404) {
        toast.error('Pick not found')
      } else {
        toast.error('Failed to load pick')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (!pick?.oneOffPriceCents || pick.oneOffPriceCents === 0) {
      toast.error('This pick is not available for purchase')
      return
    }

    try {
      // For now, we'll create a simple transaction record
      // In production, this would integrate with Stripe
      toast.loading('Processing purchase...')
      
      // Create a transaction record (mock for now)
      // In production, this would be handled by Stripe webhook
      toast.success('Purchase successful! You now have access to this pick.')
      setHasAccess(true)
      // Refresh the pick to update access
      fetchPick()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process purchase')
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

  if (!pick) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="text-center py-20">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 max-w-md mx-auto">
            <p className="text-gray-400">Pick not found</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess && !pick.isFree) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4">Subscribe to Access This Pick</h2>
            <p className="text-gray-400 mb-6">You need to subscribe to {pick.storefront.displayName} to view this pick.</p>
            <Link
              href={`/creator/${handle}`}
              className="inline-block px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
            >
              View Plans
            </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-400 flex items-center gap-2">
          <Link href="/discover" className="hover:text-white transition-colors">Discover</Link>
          <span>/</span>
          <Link href={`/creator/${handle}`} className="hover:text-white transition-colors">{pick.storefront.displayName}</Link>
          <span>/</span>
          <span className="text-white">{pick.title}</span>
        </div>

        {/* Pick Content */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 shadow-lg shadow-black/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">{pick.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                <span>by <Link href={`/creator/${handle}`} className="text-primary-400 hover:text-primary-300">{pick.storefront.displayName}</Link></span>
                {pick.sport && <span>• {pick.sport}</span>}
                {pick.eventDate && <span>• Event: {new Date(pick.eventDate).toLocaleDateString()}</span>}
                <span>• {new Date(pick.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {pick.isFree ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-sm rounded-lg font-semibold">Free</span>
            ) : pick.oneOffPriceCents && pick.oneOffPriceCents > 0 ? (
              <button
                onClick={handlePurchase}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold text-sm"
              >
                Purchase for ${(pick.oneOffPriceCents / 100).toFixed(2)}
              </button>
            ) : null}
          </div>

          {pick.description && (
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-gray-300 whitespace-pre-wrap">{pick.description}</p>
            </div>
          )}

          {/* Media */}
          {pick.media && pick.media.length > 0 && (
            <div className="mb-6 space-y-4">
              {pick.media.map((item, idx) => (
                <div key={idx}>
                  {item.type === 'image' ? (
                    <img src={item.url} alt={pick.title} className="w-full rounded-lg" />
                  ) : (
                    <video src={item.url} controls className="w-full rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-6 border-t border-slate-800">
            <Link
              href={`/creator/${handle}`}
              className="px-6 py-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all border border-slate-700 hover:border-slate-600 font-semibold"
            >
              Back to Store
            </Link>
            {!pick.isFree && !hasAccess && pick.oneOffPriceCents && pick.oneOffPriceCents > 0 && (
              <button
                onClick={handlePurchase}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
              >
                Purchase Pick
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

