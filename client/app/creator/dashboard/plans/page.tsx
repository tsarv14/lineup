'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PromoCode {
  code: string
  discountType: 'percent' | 'dollar' | 'free_trial'
  discountValue: number
  singleUse: boolean
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
}

interface Plan {
  _id: string
  name: string
  description: string
  isFree: boolean
  billingVariants: Array<{ interval: string; priceCents: number }>
  freeTrialDays: number
  promoCodes?: PromoCode[]
  archived: boolean
}

export default function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await api.get('/creator/plans')
      setPlans(response.data || [])
    } catch (error: any) {
      console.error('Error fetching plans:', error)
      // Only show error for actual network/server errors, not for empty states
      if (error.response?.status >= 500 || !error.response) {
        toast.error('Failed to load plans')
      }
      // For 404 or empty responses, just set empty array
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (planId: string, archived: boolean) => {
    try {
      await api.put(`/creator/plans/${planId}`, { archived: !archived })
      toast.success(archived ? 'Plan unarchived' : 'Plan archived')
      fetchPlans()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update plan')
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to archive this plan?')) return
    try {
      await api.delete(`/creator/plans/${planId}`)
      toast.success('Plan archived successfully')
      fetchPlans()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to archive plan')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Subscription Plans</h1>
            <p className="text-gray-400">Create and manage subscription plans for your picks</p>
          </div>
          <Link
            href="/creator/dashboard/plans/new"
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold border border-primary-500/50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Plan
          </Link>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2 font-medium">No subscription plans yet</p>
            <p className="text-gray-500 mb-6">Create your first subscription plan to start monetizing your picks</p>
            <Link
              href="/creator/dashboard/plans/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold border border-primary-500/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Plan
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan._id} 
              className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/10 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {plan.isFree && (
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold border border-green-500/30 whitespace-nowrap">
                        Free
                      </span>
                    )}
                    {plan.archived && (
                      <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-semibold border border-gray-500/30 whitespace-nowrap">
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                {plan.billingVariants.length > 0 && (
                  <div className="mb-4 p-3 bg-black/40 rounded-lg border border-slate-800">
                    <div className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Pricing</div>
                    {plan.billingVariants.map((variant, idx) => (
                      <div key={idx} className="flex items-center justify-between mb-2 last:mb-0">
                        <span className="text-white font-semibold">
                          ${(variant.priceCents / 100).toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-sm capitalize">
                          /{variant.interval === 'two_weeks' ? '2 weeks' : variant.interval === 'daily' ? 'day' : variant.interval}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {plan.freeTrialDays > 0 && (
                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-300">
                      <span className="font-semibold text-primary-400">{plan.freeTrialDays}-day</span> free trial
                    </span>
                  </div>
                )}

                {plan.promoCodes && plan.promoCodes.length > 0 && (
                  <div className="mb-4 p-3 bg-black/40 rounded-lg border border-slate-800">
                    <div className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Promo Codes</div>
                    <div className="space-y-2">
                      {plan.promoCodes.map((promo, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs font-semibold border border-primary-500/30">
                              {promo.code}
                            </span>
                            <span className="text-gray-400">
                              {promo.discountType === 'percent' && `${promo.discountValue}% off`}
                              {promo.discountType === 'dollar' && `$${(promo.discountValue / 100).toFixed(2)} off`}
                              {promo.discountType === 'free_trial' && `+${promo.discountValue} days trial`}
                            </span>
                          </div>
                          {promo.maxUses && (
                            <span className="text-xs text-gray-500">
                              {promo.usedCount}/{promo.maxUses} uses
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-800">
                  <Link
                    href={`/creator/dashboard/plans/${plan._id}/edit`}
                    className="flex-1 px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-center text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleArchive(plan._id, plan.archived)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                      plan.archived
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {plan.archived ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      )}
                    </svg>
                    {plan.archived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

