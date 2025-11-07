'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function EditPlanPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const planId = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isFree: false,
    freeTrialDays: 0,
    billingVariants: [
      { interval: 'monthly', priceCents: 0 }
    ],
    promoCodes: [] as Array<{
      code: string
      discountType: 'percent' | 'dollar' | 'free_trial'
      discountValue: number
      singleUse: boolean
      maxUses: number | null
      expiresAt: string | null
    }>
  })

  useEffect(() => {
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      const response = await api.get(`/creator/plans/${planId}`)
      const plan = response.data
      
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        isFree: plan.isFree || false,
        freeTrialDays: plan.freeTrialDays || 0,
        billingVariants: plan.billingVariants || [{ interval: 'monthly', priceCents: 0 }],
        promoCodes: plan.promoCodes || []
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load plan')
      router.push('/creator/dashboard/plans')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({ ...formData, [name]: checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleBillingVariantChange = (index: number, field: string, value: string | number) => {
    const updated = [...formData.billingVariants]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, billingVariants: updated })
  }

  const addBillingVariant = () => {
    setFormData({
      ...formData,
      billingVariants: [...formData.billingVariants, { interval: 'monthly', priceCents: 0 }]
    })
  }

  const removeBillingVariant = (index: number) => {
    const updated = formData.billingVariants.filter((_, i) => i !== index)
    setFormData({ ...formData, billingVariants: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert price to cents
      const billingVariants = formData.billingVariants.map(v => ({
        interval: v.interval,
        priceCents: Math.round(parseFloat(String(v.priceCents)) * 100) || 0
      }))

      // Process promo codes
      const promoCodes = formData.promoCodes.map(promo => ({
        code: promo.code.toUpperCase().trim(),
        discountType: promo.discountType,
        discountValue: promo.discountType === 'dollar' ? promo.discountValue : promo.discountValue,
        singleUse: promo.singleUse,
        maxUses: promo.maxUses,
        expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString() : null
      }))

      await api.put(`/creator/plans/${planId}`, {
        ...formData,
        billingVariants,
        freeTrialDays: parseInt(String(formData.freeTrialDays)) || 0,
        promoCodes
      })

      toast.success('Plan updated successfully!')
      router.push('/creator/dashboard/plans')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update plan')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/creator/dashboard/plans" className="text-primary-400 hover:text-primary-300 mb-4 inline-flex items-center gap-2 transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Plans
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Plan</h1>
            <p className="text-gray-400 mt-1">Update your subscription plan details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 space-y-8 shadow-lg shadow-black/20">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Plan Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
            placeholder="Premium Plan"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none placeholder:text-gray-600"
            placeholder="Describe what subscribers get with this plan..."
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="isFree"
            checked={formData.isFree}
            onChange={handleChange}
            className="w-5 h-5 rounded bg-black/60 border-slate-700 text-primary-600 focus:ring-primary-500"
          />
          <label className="text-sm font-medium text-gray-300">
            This is a free plan
          </label>
        </div>

        {!formData.isFree && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Billing Variants
              </label>
              <div className="space-y-4">
                {formData.billingVariants.map((variant, index) => (
                  <div key={index} className="bg-black/60 rounded-lg p-4 space-y-3 border border-slate-800 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">Variant {index + 1}</h4>
                      {formData.billingVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBillingVariant(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Interval</label>
                        <select
                          value={variant.interval}
                          onChange={(e) => handleBillingVariantChange(index, 'interval', e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="two_weeks">Two Weeks</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.priceCents / 100}
                          onChange={(e) => handleBillingVariantChange(index, 'priceCents', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBillingVariant}
                  className="w-full px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-medium"
                >
                  + Add Billing Variant
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free Trial Days
              </label>
              <select
                name="freeTrialDays"
                value={formData.freeTrialDays}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
              >
                <option value={0}>No free trial</option>
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>

            {/* Promo Codes Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Promo Codes
              </label>
              <div className="space-y-4">
                {formData.promoCodes.map((promo, index) => (
                  <div key={index} className="bg-black/60 rounded-lg p-4 space-y-3 border border-slate-800 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">Promo Code {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.promoCodes.filter((_, i) => i !== index)
                          setFormData({ ...formData, promoCodes: updated })
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Code *</label>
                        <input
                          type="text"
                          value={promo.code}
                          onChange={(e) => {
                            const updated = [...formData.promoCodes]
                            updated[index].code = e.target.value.toUpperCase()
                            setFormData({ ...formData, promoCodes: updated })
                          }}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                          placeholder="SAVE20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Discount Type *</label>
                        <select
                          value={promo.discountType}
                          onChange={(e) => {
                            const updated = [...formData.promoCodes]
                            updated[index].discountType = e.target.value as 'percent' | 'dollar' | 'free_trial'
                            setFormData({ ...formData, promoCodes: updated })
                          }}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                        >
                          <option value="percent">Percentage Off</option>
                          <option value="dollar">Dollar Amount Off</option>
                          <option value="free_trial">Free Trial Extension</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {promo.discountType === 'percent' ? 'Percent Off (0-100)' : 
                           promo.discountType === 'dollar' ? 'Amount Off ($)' : 
                           'Trial Days'}
                        </label>
                        <input
                          type="number"
                          step={promo.discountType === 'dollar' ? '0.01' : '1'}
                          min="0"
                          max={promo.discountType === 'percent' ? '100' : undefined}
                          value={promo.discountType === 'dollar' ? promo.discountValue / 100 : promo.discountValue}
                          onChange={(e) => {
                            const updated = [...formData.promoCodes]
                            updated[index].discountValue = promo.discountType === 'dollar' 
                              ? Math.round(parseFloat(e.target.value) * 100) || 0
                              : parseInt(e.target.value) || 0
                            setFormData({ ...formData, promoCodes: updated })
                          }}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                          placeholder={promo.discountType === 'percent' ? '20' : promo.discountType === 'dollar' ? '5.00' : '7'}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Uses (optional)</label>
                        <input
                          type="number"
                          min="1"
                          value={promo.maxUses || ''}
                          onChange={(e) => {
                            const updated = [...formData.promoCodes]
                            updated[index].maxUses = e.target.value ? parseInt(e.target.value) : null
                            setFormData({ ...formData, promoCodes: updated })
                          }}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={promo.singleUse}
                          onChange={(e) => {
                            const updated = [...formData.promoCodes]
                            updated[index].singleUse = e.target.checked
                            setFormData({ ...formData, promoCodes: updated })
                          }}
                          className="w-4 h-4 rounded bg-black/60 border-slate-700 text-primary-600 focus:ring-primary-500"
                        />
                        Single use only
                      </label>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Expires (optional)</label>
                        <input
                          type="datetime-local"
                          value={promo.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => {
                            const updated = [...formData.promoCodes]
                            updated[index].expiresAt = e.target.value || null
                            setFormData({ ...formData, promoCodes: updated })
                          }}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all text-sm"
                        />
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      promoCodes: [...formData.promoCodes, {
                        code: '',
                        discountType: 'percent',
                        discountValue: 0,
                        singleUse: false,
                        maxUses: null,
                        expiresAt: null
                      }]
                    })
                  }}
                  className="w-full px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-medium"
                >
                  + Add Promo Code
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex space-x-4 pt-6 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update Plan
              </>
            )}
          </button>
          <Link
            href="/creator/dashboard/plans"
            className="px-6 py-3 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all border border-slate-700 hover:border-slate-600 font-semibold"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

