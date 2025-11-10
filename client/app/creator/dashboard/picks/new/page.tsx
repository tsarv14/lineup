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

interface Game {
  gameId: string
  sport: string
  league: string
  homeTeam: { name: string; abbreviation?: string }
  awayTeam: { name: string; abbreviation?: string }
  startTime: string
  status: string
}

function GameSearchModal({ sport, onSelectGame, onClose }: { sport: string; onSelectGame: (game: Game) => void; onClose: () => void }) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (sport && searchDate) {
      fetchGames()
    }
  }, [sport, searchDate])

  const fetchGames = async () => {
    if (!sport) return
    setLoading(true)
    try {
      const endDate = new Date(searchDate)
      endDate.setDate(endDate.getDate() + 7) // Search next 7 days
      const response = await api.get('/games', {
        params: {
          sport,
          startDate: searchDate,
          endDate: endDate.toISOString().split('T')[0]
        }
      })
      setGames(response.data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
      setGames([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Search Games</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
          />
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No games found. You can enter the game manually below.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <button
                key={game.gameId}
                onClick={() => onSelectGame(game)}
                className="w-full text-left px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-primary-500 hover:bg-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">
                      {game.awayTeam?.name || 'Away'} @ {game.homeTeam?.name || 'Home'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(game.startTime).toLocaleString()} • {game.league}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewPickPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetchingUnitValue, setFetchingUnitValue] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [unitValueDefault, setUnitValueDefault] = useState<number>(100)
  const [formData, setFormData] = useState({
    // Phase A structured fields
    sport: '',
    league: '',
    gameText: '',
    betType: 'moneyline' as 'moneyline' | 'spread' | 'total' | 'prop' | 'parlay' | 'other',
    selection: '',
    oddsAmerican: '',
    unitsRisked: '',
    amountRisked: '',
    gameStartTime: '',
    writeUp: '',
    // Legacy fields
    isFree: true,
    plans: [] as string[],
    oneOffPriceCents: 0
  })

  useEffect(() => {
    fetchPlans()
    fetchUnitValue()
  }, [])

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
    } finally {
      setFetchingUnitValue(false)
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
    return !isNaN(num) && num >= -10000 && num <= 10000 && num !== 0
  }

  const calculateTimeBeforeStart = (gameStartTime: string): string => {
    if (!gameStartTime) return ''
    const start = new Date(gameStartTime)
    const now = new Date()
    const diffMs = start.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Game has already started'
    
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} before start`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} before start`
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} before start`
    return 'Less than 1 minute before start'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.sport || !formData.betType || !formData.selection || !formData.oddsAmerican || !formData.unitsRisked) {
        toast.error('Please fill in all required fields')
        setLoading(false)
        return
      }

      if (!formData.gameStartTime) {
        toast.error('Game start time is required')
        setLoading(false)
        return
      }

      if (!validateAmericanOdds(formData.oddsAmerican)) {
        toast.error('Invalid American odds. Must be between -10000 and +10000, excluding 0.')
        setLoading(false)
        return
      }

      const gameStart = new Date(formData.gameStartTime)
      const now = new Date()
      if (gameStart <= now) {
        toast.error('Game start time must be in the future')
        setLoading(false)
        return
      }

      const payload = {
        sport: formData.sport,
        league: formData.league || formData.sport,
        gameId: selectedGame?.gameId || null, // Phase B: Include gameId if selected
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

      await api.post('/creator/picks', payload)

      toast.success('Pick created successfully!')
      router.push('/creator/dashboard/picks')
    } catch (error: any) {
      console.error('Create pick error:', error)
      toast.error(error.response?.data?.message || 'Failed to create pick')
    } finally {
      setLoading(false)
    }
  }

  const isVerified = formData.gameStartTime && new Date(formData.gameStartTime) > new Date()
  const timeBeforeStart = calculateTimeBeforeStart(formData.gameStartTime)
  const estimatedAmount = formData.unitsRisked ? (parseFloat(formData.unitsRisked) * unitValueDefault).toFixed(2) : '0.00'

  if (fetchingUnitValue) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-white">Post a Pick</h1>
            <p className="text-gray-400 mt-1">Create a structured, verifiable pick with units</p>
          </div>
        </div>
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
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
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
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder={formData.sport || 'e.g., NBA, NFL'}
                />
                <p className="text-xs text-gray-500">Defaults to sport if not specified</p>
              </div>
            </div>

            {/* Game Selection - Phase B: Game Search/Dropdown */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Game *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGameSearch(!showGameSearch)}
                  className="px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg hover:border-primary-500/50 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {selectedGame ? `Selected: ${selectedGame.homeTeam?.name || 'Home'} vs ${selectedGame.awayTeam?.name || 'Away'}` : 'Search Games'}
                </button>
                {selectedGame && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGame(null)
                      setFormData(prev => ({ ...prev, gameId: '', gameText: '' }))
                    }}
                    className="px-4 py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
              {showGameSearch && (
                <GameSearchModal
                  sport={formData.sport}
                  onSelectGame={(game) => {
                    setSelectedGame(game)
                    setFormData(prev => ({ 
                      ...prev, 
                      gameId: game.gameId,
                      gameText: `${game.homeTeam?.name || 'Home'} vs ${game.awayTeam?.name || 'Away'}`,
                      gameStartTime: new Date(game.startTime).toISOString().slice(0, 16)
                    }))
                    setShowGameSearch(false)
                  }}
                  onClose={() => setShowGameSearch(false)}
                />
              )}
              {!selectedGame && (
                <input
                  type="text"
                  name="gameText"
                  value={formData.gameText}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 mt-2"
                  placeholder="Or enter manually: e.g., Lakers vs Warriors"
                />
              )}
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
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
              />
              {formData.gameStartTime && (
                <p className={`text-xs ${isVerified ? 'text-green-400' : 'text-red-400'}`}>
                  {timeBeforeStart}
                </p>
              )}
            </div>

            {/* Bet Type and Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Pick Type *
                </label>
                <select
                  name="betType"
                  value={formData.betType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                >
                  <option value="moneyline">Moneyline</option>
                  <option value="spread">Spread</option>
                  <option value="total">Total (Over/Under)</option>
                  <option value="prop">Prop</option>
                  <option value="parlay">Parlay</option>
                  <option value="other">Other</option>
                </select>
              </div>

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
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="e.g., Lakers -5.5"
                />
              </div>
            </div>

            {/* Odds */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Odds (American) *
              </label>
              <input
                type="text"
                name="oddsAmerican"
                value={formData.oddsAmerican}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                placeholder="-110, +135, etc."
              />
              {formData.oddsAmerican && !validateAmericanOdds(formData.oddsAmerican) && (
                <p className="text-xs text-red-400">Invalid odds. Must be between -10000 and +10000, excluding 0.</p>
              )}
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
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="2.0"
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
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-gray-500">Auto-syncs with units</p>
              </div>
            </div>

            {/* Unit Value Display */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Unit Value:</span>
                <span className="text-sm font-semibold text-white">${unitValueDefault} per unit</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Change this in your <Link href="/creator/dashboard/settings" className="text-primary-400 hover:text-primary-300">settings</Link>
              </p>
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
                rows={6}
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none placeholder:text-gray-600"
                placeholder="Detailed analysis and reasoning for your pick..."
              />
            </div>

            {/* Legacy fields */}
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
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
                      Available for Plans
                    </label>
                    <div className="space-y-2 bg-slate-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {plans.map((plan) => (
                        <label key={plan._id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded">
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
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                    placeholder="0.00"
                  />
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
                    Post Pick
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

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-lg shadow-black/20 sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            
            {formData.selection && formData.sport && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Selection</p>
                  <p className="text-white font-medium">{formData.selection}</p>
                </div>
                
                {formData.oddsAmerican && (
                  <div>
                    <p className="text-sm text-gray-400">Odds</p>
                    <p className="text-white font-medium">{formData.oddsAmerican}</p>
                  </div>
                )}
                
                {formData.unitsRisked && (
                  <div>
                    <p className="text-sm text-gray-400">Units Risked</p>
                    <p className="text-white font-medium">{formData.unitsRisked} units</p>
                    <p className="text-xs text-gray-500">≈ ${estimatedAmount}</p>
                  </div>
                )}
                
                {formData.gameStartTime && (
                  <div>
                    <p className="text-sm text-gray-400">Posted</p>
                    <p className={`text-sm font-medium ${isVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {timeBeforeStart}
                    </p>
                    {isVerified && (
                      <p className="text-xs text-green-400 mt-1">✓ Eligible for verification</p>
                    )}
                  </div>
                )}
                
                {formData.gameStartTime && (
                  <div>
                    <p className="text-sm text-gray-400">Locked at</p>
                    <p className="text-white text-sm">
                      {new Date(formData.gameStartTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {(!formData.selection || !formData.sport) && (
              <p className="text-gray-500 text-sm">Fill in the form to see preview</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
