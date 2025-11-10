'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Plan {
  _id: string
  name: string
}

interface Pick {
  _id: string
  sport: string
  league?: string
  gameId?: string
  gameText?: string
  selection: string
  betType: string
  oddsAmerican: number
  unitsRisked: number
  amountRisked: number
  gameStartTime: string
  writeUp?: string
  isFree: boolean
  plans: string[]
  oneOffPriceCents: number
  status: 'pending' | 'locked' | 'graded' | 'disputed'
}

export default function EditPickPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const pickId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [unitValueDefault, setUnitValueDefault] = useState<number>(100)
  const [pick, setPick] = useState<Pick | null>(null)
  const [formData, setFormData] = useState({
    sport: '',
    league: '',
    gameText: '',
    selection: '',
    betType: 'moneyline' as 'moneyline' | 'spread' | 'total' | 'prop' | 'parlay' | 'other',
    oddsAmerican: '',
    unitsRisked: '',
    amountRisked: '',
    gameStartTime: '',
    writeUp: '',
    isFree: true,
    plans: [] as string[],
    oneOffPriceCents: 0
  })

  useEffect(() => {
    if (pickId) {
      fetchPick()
      fetchPlans()
      fetchUnitValue()
    }
  }, [pickId])

  const fetchPick = async () => {
    try {
      const response = await api.get(`/creator/picks/${pickId}`)
      const pickData = response.data
      setPick(pickData)
      
      setFormData({
        sport: pickData.sport || '',
        league: pickData.league || '',
        gameText: pickData.gameText || '',
        selection: pickData.selection || '',
        betType: pickData.betType || 'moneyline',
        oddsAmerican: pickData.oddsAmerican?.toString() || '',
        unitsRisked: pickData.unitsRisked?.toString() || '',
        amountRisked: ((pickData.amountRisked || 0) / 100).toFixed(2),
        gameStartTime: pickData.gameStartTime ? new Date(pickData.gameStartTime).toISOString().slice(0, 16) : '',
        writeUp: pickData.writeUp || '',
        isFree: pickData.isFree ?? true,
        plans: pickData.plans?.map((p: any) => p._id || p) || [],
        oneOffPriceCents: pickData.oneOffPriceCents || 0
      })
    } catch (error: any) {
      console.error('Error fetching pick:', error)
      toast.error('Failed to load pick')
      router.push('/creator/dashboard/picks')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await api.get('/creator/plans')
      setPlans(response.data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchUnitValue = async () => {
    try {
      const response = await api.get('/creator/stats')
      if (response.data?.unitValueDefault) {
        setUnitValueDefault(response.data.unitValueDefault)
      }
    } catch (error) {
      console.error('Error fetching unit value:', error)
    }
  }

  // Auto-sync units and amount
  useEffect(() => {
    if (formData.unitsRisked && unitValueDefault) {
      const calculatedAmount = parseFloat(formData.unitsRisked) * unitValueDefault
      if (!formData.amountRisked || Math.abs(parseFloat(formData.amountRisked) - calculatedAmount) > 0.01) {
        setFormData(prev => ({ ...prev, amountRisked: calculatedAmount.toFixed(2) }))
      }
    }
  }, [formData.unitsRisked, unitValueDefault])

  useEffect(() => {
    if (formData.amountRisked && unitValueDefault) {
      const calculatedUnits = parseFloat(formData.amountRisked) / unitValueDefault
      if (!formData.unitsRisked || Math.abs(parseFloat(formData.unitsRisked) - calculatedUnits) > 0.01) {
        setFormData(prev => ({ ...prev, unitsRisked: calculatedUnits.toFixed(2) }))
      }
    }
  }, [formData.amountRisked, unitValueDefault])

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

  const validateAmericanOdds = (odds: string): boolean => {
    const num = parseInt(odds)
    return (num >= 100 || num <= -100) && num !== 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!formData.sport || !formData.betType || !formData.selection || !formData.oddsAmerican || !formData.unitsRisked) {
        toast.error('Please fill in all required fields')
        setSaving(false)
        return
      }

      if (!formData.gameStartTime) {
        toast.error('Game start time is required')
        setSaving(false)
        return
      }

      if (!validateAmericanOdds(formData.oddsAmerican)) {
        toast.error('Invalid American odds. Must be between -10000 and +10000, excluding 0.')
        setSaving(false)
        return
      }

      const gameStart = new Date(formData.gameStartTime)
      const now = new Date()
      
      // Check if pick is locked (only admins can edit locked picks)
      if (pick?.status === 'locked' && !user?.roles?.includes('admin')) {
        toast.error('This pick is locked and cannot be edited')
        setSaving(false)
        return
      }

      // If admin editing locked pick, require reason
      let reason = ''
      if (pick?.status === 'locked' && user?.roles?.includes('admin')) {
        reason = prompt('Please provide a reason for editing this locked pick:') || ''
        if (!reason.trim()) {
          toast.error('A reason is required for editing locked picks')
          setSaving(false)
          return
        }
      }

      const payload: any = {
        sport: formData.sport,
        league: formData.league || formData.sport,
        gameText: formData.gameText || null,
        betType: formData.betType,
        selection: formData.selection,
        oddsAmerican: parseInt(formData.oddsAmerican),
        unitsRisked: parseFloat(formData.unitsRisked),
        amountRisked: formData.amountRisked ? Math.round(parseFloat(formData.amountRisked) * 100) : undefined,
        gameStartTime: formData.gameStartTime,
        writeUp: formData.writeUp || null,
        isFree: formData.isFree,
        plans: formData.plans,
        oneOffPriceCents: formData.oneOffPriceCents
      }

      if (reason) {
        payload.reason = reason
      }

      await api.put(`/creator/picks/${pickId}`, payload)

      toast.success('Pick updated successfully!')
      router.push('/creator/dashboard/picks')
    } catch (error: any) {
      console.error('Update pick error:', error)
      toast.error(error.response?.data?.message || 'Failed to update pick')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!pick) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Pick not found</p>
        <Link href="/creator/dashboard/picks" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
          Back to Picks
        </Link>
      </div>
    )
  }

  const isLocked = pick.status === 'locked'
  const canEdit = !isLocked || user?.roles?.includes('admin')

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Pick</h1>
            <p className="text-gray-400 mt-1">Update your pick details</p>
          </div>
        </div>
        {isLocked && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ This pick is locked (game has started). {user?.roles?.includes('admin') 
                ? 'As an admin, you can edit it but must provide a reason.' 
                : 'Only admins can edit locked picks.'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 space-y-6 shadow-lg shadow-black/20">
            {/* Sport and League */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Sport *
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select sport</option>
                  <option value="Football">Football</option>
                  <option value="College Football">College Football</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Golf">Golf</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Tennis">Tennis</option>
                  <option value="MMA">MMA</option>
                  <option value="Boxing">Boxing</option>
                  <option value="Racing">Racing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  League
                </label>
                <input
                  type="text"
                  name="league"
                  value={formData.league}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={formData.sport || 'e.g., NBA, NFL'}
                />
              </div>
            </div>

            {/* Game Text */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Game *
              </label>
              <input
                type="text"
                name="gameText"
                value={formData.gameText}
                onChange={handleChange}
                required
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Lakers vs Warriors"
              />
            </div>

            {/* Bet Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Bet Type *
              </label>
              <select
                name="betType"
                value={formData.betType}
                onChange={handleChange}
                required
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="moneyline">Moneyline</option>
                <option value="spread">Spread</option>
                <option value="total">Total (Over/Under)</option>
                <option value="prop">Prop</option>
                <option value="parlay">Parlay</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Selection *
              </label>
              <input
                type="text"
                name="selection"
                value={formData.selection}
                onChange={handleChange}
                required
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Lakers -5.5, Over 225.5, Lakers ML"
              />
            </div>

            {/* Odds */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                American Odds *
              </label>
              <input
                type="number"
                name="oddsAmerican"
                value={formData.oddsAmerican}
                onChange={handleChange}
                required
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., -110, +135"
              />
            </div>

            {/* Units and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Units Risked *
                </label>
                <input
                  type="number"
                  name="unitsRisked"
                  value={formData.unitsRisked}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 2.5"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Amount Risked ($)
                </label>
                <input
                  type="number"
                  name="amountRisked"
                  value={formData.amountRisked}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-gray-500">1 unit = ${unitValueDefault}</p>
              </div>
            </div>

            {/* Game Start Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Game Start Time *
              </label>
              <input
                type="datetime-local"
                name="gameStartTime"
                value={formData.gameStartTime}
                onChange={handleChange}
                required
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Write-up */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Write-up (Optional)
              </label>
              <textarea
                name="writeUp"
                value={formData.writeUp}
                onChange={handleChange}
                rows={5}
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Add your analysis, reasoning, or notes about this pick..."
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t border-slate-800 pt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-5 h-5 rounded border-slate-700 bg-black/60 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label className="text-sm font-semibold text-gray-300">Free Pick</label>
              </div>

              {!formData.isFree && (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                      One-off Price ($)
                    </label>
                    <input
                      type="number"
                      name="oneOffPriceCents"
                      value={(formData.oneOffPriceCents / 100).toFixed(2)}
                      onChange={(e) => setFormData({ ...formData, oneOffPriceCents: parseFloat(e.target.value) * 100 || 0 })}
                      step="0.01"
                      min="0"
                      disabled={!canEdit}
                      className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                      Available Plans
                    </label>
                    <div className="space-y-2">
                      {plans.map((plan) => (
                        <label key={plan._id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.plans.includes(plan._id)}
                            onChange={() => handlePlanToggle(plan._id)}
                            disabled={!canEdit}
                            className="w-5 h-5 rounded border-slate-700 bg-black/60 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className="text-white text-sm">{plan.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving || !canEdit}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-primary-500/50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <Link
                href="/creator/dashboard/picks"
                className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-lg shadow-black/20 sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4">Pick Preview</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Selection:</span>
                <p className="text-white font-medium">{formData.selection || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-400">Bet Type:</span>
                <p className="text-white font-medium capitalize">{formData.betType || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-400">Odds:</span>
                <p className="text-white font-medium">
                  {formData.oddsAmerican ? (parseInt(formData.oddsAmerican) > 0 ? `+${formData.oddsAmerican}` : formData.oddsAmerican) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Units Risked:</span>
                <p className="text-white font-medium">{formData.unitsRisked || '0'} units</p>
              </div>
              <div>
                <span className="text-gray-400">Amount Risked:</span>
                <p className="text-white font-medium">${formData.amountRisked || '0.00'}</p>
              </div>
              {formData.gameStartTime && (
                <div>
                  <span className="text-gray-400">Game Start:</span>
                  <p className="text-white font-medium">{new Date(formData.gameStartTime).toLocaleString()}</p>
                </div>
              )}
              {formData.gameStartTime && new Date(formData.gameStartTime) > new Date() && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-xs font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Eligible for verification (posted before game start)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

