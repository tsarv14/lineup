'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Plan {
  _id: string
  name: string
}

export default function NewPickPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    marketType: '',
    odds: '',
    stake: '',
    isFree: true,
    plans: [] as string[],
    oneOffPriceCents: 0,
    eventDate: '',
    scheduledAt: '',
    tags: [] as string[],
    media: [] as Array<{ url: string; type: 'image' | 'video' }>
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await api.get('/creator/plans')
      setPlans(response.data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({ ...formData, [name]: checked })
    } else if (name === 'oneOffPriceCents') {
      setFormData({ ...formData, [name]: parseFloat(value) * 100 || 0 })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handlePlanToggle = (planId: string) => {
    if (formData.plans.includes(planId)) {
      setFormData({ ...formData, plans: formData.plans.filter(id => id !== planId) })
    } else {
      setFormData({ ...formData, plans: [...formData.plans, planId] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/creator/picks', {
        ...formData,
        eventDate: formData.eventDate || undefined
      })

      toast.success('Pick created successfully!')
      router.push('/creator/dashboard/picks')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create pick')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link 
          href="/creator/dashboard/picks" 
          className="text-primary-400 hover:text-primary-300 mb-4 inline-flex items-center gap-2 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Picks
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Pick</h1>
            <p className="text-gray-400 mt-1">Share your latest sports prediction with subscribers</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 space-y-8 shadow-lg shadow-black/20">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Pick Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
            placeholder="Lakers vs Warriors - Lakers Win"
          />
          <p className="text-xs text-gray-500">Make it clear and compelling</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none placeholder:text-gray-600"
            placeholder="Detailed analysis and reasoning for your pick..."
          />
          <p className="text-xs text-gray-500">Provide context and analysis to help subscribers understand your pick</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Sport
            </label>
            <input
              type="text"
              name="sport"
              value={formData.sport}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
              placeholder="NBA, NFL, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Market Type
            </label>
            <select
              name="marketType"
              value={formData.marketType}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            >
              <option value="">Select market type</option>
              <option value="spread">Spread</option>
              <option value="moneyline">Moneyline</option>
              <option value="over-under">Over/Under</option>
              <option value="prop">Prop</option>
              <option value="parlay">Parlay</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Odds (optional)
            </label>
            <input
              type="text"
              name="odds"
              value={formData.odds}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
              placeholder="-110, +150, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Stake (optional)
            </label>
            <input
              type="text"
              name="stake"
              value={formData.stake}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
              placeholder="1 unit, 2 units, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Date
            </label>
            <input
              type="datetime-local"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule Publish (optional)
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty to publish immediately</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
              setFormData({ ...formData, tags })
            }}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="premium, nfl, week-15"
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="isFree"
            checked={formData.isFree}
            onChange={handleChange}
            className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-primary-600 focus:ring-primary-500"
          />
          <label className="text-sm font-medium text-gray-300">
            This is a free pick
          </label>
        </div>

        {!formData.isFree && (
          <>
            {plans.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available for Plans (select which plans can access this pick)
                </label>
                <div className="space-y-2 bg-slate-700/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {plans.map((plan) => (
                    <label key={plan._id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-600/50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.plans.includes(plan._id)}
                        onChange={() => handlePlanToggle(plan._id)}
                        className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-white">{plan.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                One-Time Purchase Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="oneOffPriceCents"
                value={formData.oneOffPriceCents / 100}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-400 mt-1">Leave as 0 if this pick is only available through subscription plans</p>
            </div>
          </>
        )}

               <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
                 <button
                   type="submit"
                   disabled={loading}
                   className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-primary-500/50 flex items-center gap-2"
                 >
                   {loading ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                       Creating...
                     </>
                   ) : (
                     <>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       Create Pick
                     </>
                   )}
                 </button>
                 <Link
                   href="/creator/dashboard/picks"
                   className="px-6 py-3 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all font-semibold border border-slate-700 hover:border-slate-600"
                 >
                   Cancel
                 </Link>
               </div>
      </form>
    </div>
  )
}

