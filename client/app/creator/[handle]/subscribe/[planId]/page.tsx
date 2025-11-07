'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'

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
  creator: {
    _id: string
    username: string
    storefront?: {
      handle: string
      displayName: string
    }
  }
}

export default function SubscribePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const handle = params.handle as string
  const planId = params.planId as string

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInterval, setSelectedInterval] = useState<string>('')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (planId) {
      fetchPlan()
    }
  }, [planId, isAuthenticated, authLoading, router])

  const fetchPlan = async () => {
    try {
      // Get plan from creator's plans
      const plansResponse = await api.get(`/creators/${handle}/plans`)
      const foundPlan = plansResponse.data.find((p: Plan) => p._id === planId)
      if (foundPlan) {
        setPlan(foundPlan)
        setSelectedInterval(foundPlan.billingVariants[0]?.interval || '')
      } else {
        toast.error('Plan not found')
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
      toast.error('Failed to load plan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!selectedInterval && !plan?.isFree) {
      toast.error('Please select a billing interval')
      return
    }

    try {
      setSubscribing(true)
      await api.post('/subscriptions', {
        planId: planId,
        billingInterval: selectedInterval
      })
      toast.success('Subscription successful!')
      router.push('/my-subscriptions')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to subscribe')
    } finally {
      setSubscribing(false)
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

  if (!plan) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="text-center py-20">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 max-w-md mx-auto">
            <p className="text-gray-400">Plan not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 shadow-lg shadow-black/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Subscribe to {plan.name}</h1>
          {plan.description && (
            <p className="text-gray-400 mb-6">{plan.description}</p>
          )}

          {plan.freeTrialDays > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
              <p className="text-green-400 font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {plan.freeTrialDays}-day free trial available!
              </p>
            </div>
          )}

          {plan.isFree ? (
            <div className="mb-6">
              <p className="text-2xl font-bold text-white mb-4">Free Plan</p>
              <p className="text-gray-400">This plan is completely free with no charges.</p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-lg font-semibold text-white mb-4">Select Billing Interval</p>
              <div className="space-y-3">
                {plan.billingVariants.map((variant, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all relative overflow-hidden group ${
                      selectedInterval === variant.interval
                        ? 'border-primary-500 bg-gradient-to-r from-primary-600/20 to-primary-700/20 shadow-glow shadow-primary-500/20'
                        : 'border-slate-800 hover:border-primary-500/50 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="interval"
                        value={variant.interval}
                        checked={selectedInterval === variant.interval}
                        onChange={(e) => setSelectedInterval(e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-white font-medium capitalize">
                        {variant.interval === 'two_weeks' ? '2 weeks' : variant.interval === 'daily' ? 'day' : variant.interval}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      ${(variant.priceCents / 100).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleSubscribe}
              disabled={subscribing || (!plan.isFree && !selectedInterval)}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscribing ? 'Processing...' : plan.isFree ? 'Get Free Plan' : 'Subscribe Now'}
            </button>
            <button
              onClick={() => router.push(`/creator/${handle}`)}
              className="w-full px-6 py-3 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all border border-slate-700 hover:border-slate-600"
            >
              Cancel
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

