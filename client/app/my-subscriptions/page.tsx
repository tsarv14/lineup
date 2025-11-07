'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'

interface Subscription {
  _id: string
  plan: {
    _id: string
    name: string
    description?: string
  }
  creator: {
    _id: string
    username: string
    storefront?: {
      handle: string
      displayName: string
    }
  }
  status: 'active' | 'canceled' | 'expired'
  currentPeriodEnd: string
  startedAt: string
  cancelAtPeriodEnd: boolean
}

export default function MySubscriptions() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      fetchSubscriptions()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions')
      setSubscriptions(response.data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (subscriptionId: string) => {
    try {
      await api.post(`/subscriptions/${subscriptionId}/cancel`)
      fetchSubscriptions()
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      alert(error.response?.data?.message || 'Failed to cancel subscription')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Subscriptions</h1>
              <p className="text-gray-400 mt-1">Manage your active subscriptions</p>
            </div>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
            <p className="text-gray-400 mb-4">You don't have any active subscriptions</p>
            <Link
              href="/discover"
              className="inline-block px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
            >
              Browse Creators
            </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div key={subscription._id} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all relative overflow-hidden group shadow-lg shadow-black/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {subscription.plan.name}
                        </h3>
                        <p className="text-gray-400">
                          by{' '}
                          <Link
                            href={`/creator/${subscription.creator.storefront?.handle || subscription.creator.username}`}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            {subscription.creator.storefront?.displayName || subscription.creator.username}
                          </Link>
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                        subscription.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : subscription.status === 'canceled'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {subscription.status === 'canceled' ? 'Cancelled' : subscription.status}
                      </span>
                    </div>
                    {subscription.plan.description && (
                      <p className="text-gray-400 mb-4">{subscription.plan.description}</p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <span>
                        {subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                      <span>
                        Started: {new Date(subscription.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {subscription.status === 'active' && (
                      <button
                        onClick={() => handleCancel(subscription._id)}
                        className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all border border-red-500/30 hover:border-red-500/50 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/creator/${subscription.creator.storefront?.handle || subscription.creator.username}`}
                      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
                    >
                      View Store
                    </Link>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

