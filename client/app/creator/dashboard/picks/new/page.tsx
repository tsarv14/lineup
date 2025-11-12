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
  homeTeam: { name: string; abbreviation?: string; id?: string }
  awayTeam: { name: string; abbreviation?: string; id?: string }
  startTime: string
  status: string
}

interface Team {
  id: string
  name: string
  abbreviation?: string
}

interface Player {
  id: string
  name: string
  position?: string
}

interface OddsOption {
  value: number
  label: string
  bookmaker?: string
}

interface ParlayLeg {
  id: string
  sport: string
  league: string
  gameId?: string
  gameText?: string
  betType: 'moneyline' | 'spread' | 'total' | 'prop' | 'other'
  selection: string
  selectedTeam?: string
  selectedPlayer?: string
  oddsAmerican: string
  gameStartTime: string
  selectedGame?: Game | null
}

function GameSearchModal({ 
  sport, 
  league, 
  onSelectGame, 
  onClose 
}: { 
  sport: string
  league?: string
  onSelectGame: (game: Game) => void
  onClose: () => void 
}) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (sport && searchDate) {
      fetchGames()
    }
  }, [sport, league, searchDate])

  const fetchGames = async () => {
    if (!sport) return
    setLoading(true)
    try {
      const endDate = new Date(searchDate)
      endDate.setDate(endDate.getDate() + 7) // Search next 7 days
      const response = await api.get('/games', {
        params: {
          sport,
          league: league || undefined,
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
  const [showGameSearch, setShowGameSearch] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [availableOdds, setAvailableOdds] = useState<OddsOption[]>([])
  const [fetchingOdds, setFetchingOdds] = useState(false)
  const [oddsValidation, setOddsValidation] = useState<{ valid: boolean; message?: string } | null>(null)
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([])
  const [gameSearchForLeg, setGameSearchForLeg] = useState<number | null>(null)
  const [legLeagues, setLegLeagues] = useState<Record<string, string[]>>({})
  const [calculatedParlayOdds, setCalculatedParlayOdds] = useState<{ oddsDecimal: number; oddsAmerican: number } | null>(null)
  const [expandedLegs, setExpandedLegs] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState({
    // Pick type
    pickType: 'straight' as 'straight' | 'parlay',
    // Basic info
    sport: '',
    league: '',
    gameId: '',
    gameText: '',
    betType: 'moneyline' as 'moneyline' | 'spread' | 'total' | 'prop' | 'future' | 'other',
    selection: '',
    selectedTeam: '',
    selectedPlayer: '',
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

  // Fetch leagues when sport changes
  useEffect(() => {
    if (formData.sport) {
      fetchLeagues()
    } else {
      setAvailableLeagues([])
      setFormData(prev => ({ ...prev, league: '' }))
    }
  }, [formData.sport])

  // Fetch teams when game is selected
  useEffect(() => {
    if (selectedGame?.gameId && formData.betType !== 'future') {
      fetchTeams()
    } else {
      setTeams([])
    }
  }, [selectedGame, formData.betType])

  // Fetch players when bet type is prop
  useEffect(() => {
    if (formData.betType === 'prop' && selectedGame?.gameId) {
      fetchPlayers()
    } else {
      setPlayers([])
    }
  }, [formData.betType, selectedGame])

  // Fetch odds when game and bet type are selected
  useEffect(() => {
    if (selectedGame?.gameId && formData.betType && formData.betType !== 'future') {
      fetchOdds()
    } else {
      setAvailableOdds([])
    }
  }, [selectedGame, formData.betType])

  // Validate odds against market when entered
  useEffect(() => {
    if (formData.oddsAmerican && availableOdds.length > 0) {
      validateOdds()
    } else {
      setOddsValidation(null)
    }
  }, [formData.oddsAmerican, availableOdds])

  // Recalculate parlay odds when legs change
  useEffect(() => {
    if (formData.pickType === 'parlay' && parlayLegs.length > 0) {
      const odds = calculateParlayOdds(parlayLegs)
      setCalculatedParlayOdds(odds)
    } else {
      setCalculatedParlayOdds(null)
    }
  }, [parlayLegs, formData.pickType])

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

  const fetchLeagues = async () => {
    try {
      const response = await api.get(`/games/leagues/${formData.sport}`)
      setAvailableLeagues(response.data || [])
    } catch (error) {
      console.error('Error fetching leagues:', error)
      setAvailableLeagues([])
    }
  }

  const fetchTeams = async () => {
    if (!selectedGame?.gameId) return
    try {
      const response = await api.get(`/games/${selectedGame.gameId}/teams`)
      setTeams(response.data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      // Fallback to game teams if API fails
      const fallbackTeams: Team[] = []
      if (selectedGame.homeTeam) {
        fallbackTeams.push({
          id: selectedGame.homeTeam.id || selectedGame.homeTeam.name,
          name: selectedGame.homeTeam.name,
          abbreviation: selectedGame.homeTeam.abbreviation
        })
      }
      if (selectedGame.awayTeam) {
        fallbackTeams.push({
          id: selectedGame.awayTeam.id || selectedGame.awayTeam.name,
          name: selectedGame.awayTeam.name,
          abbreviation: selectedGame.awayTeam.abbreviation
        })
      }
      setTeams(fallbackTeams)
    }
  }

  const fetchPlayers = async () => {
    if (!selectedGame?.gameId) return
    try {
      const response = await api.get(`/games/${selectedGame.gameId}/players`)
      setPlayers(response.data || [])
    } catch (error) {
      console.error('Error fetching players:', error)
      setPlayers([])
    }
  }

  const fetchOdds = async () => {
    if (!selectedGame?.gameId || !formData.betType) return
    setFetchingOdds(true)
    try {
      const response = await api.get(`/games/${selectedGame.gameId}/odds`, {
        params: { betType: formData.betType }
      })
      if (response.data?.odds && Array.isArray(response.data.odds)) {
        const oddsOptions: OddsOption[] = response.data.odds.map((odd: any) => ({
          value: odd.american || odd.value,
          label: `${odd.american || odd.value > 0 ? '+' : ''}${odd.american || odd.value}${odd.bookmaker ? ` (${odd.bookmaker})` : ''}`,
          bookmaker: odd.bookmaker
        }))
        setAvailableOdds(oddsOptions)
      } else {
        setAvailableOdds([])
      }
    } catch (error) {
      console.error('Error fetching odds:', error)
      setAvailableOdds([])
    } finally {
      setFetchingOdds(false)
    }
  }

  const validateOdds = () => {
    if (!formData.oddsAmerican || availableOdds.length === 0) {
      setOddsValidation(null)
      return
    }

    const enteredOdds = parseInt(formData.oddsAmerican)
    if (isNaN(enteredOdds)) {
      setOddsValidation({ valid: false, message: 'Invalid odds format' })
      return
    }

    // Find closest market odds
    const marketOdds = availableOdds.map(o => o.value)
    const closestMarketOdds = marketOdds.reduce((prev, curr) => 
      Math.abs(curr - enteredOdds) < Math.abs(prev - enteredOdds) ? curr : prev
    )

    const difference = Math.abs(enteredOdds - closestMarketOdds)
    const percentDiff = (difference / Math.abs(closestMarketOdds)) * 100

    if (percentDiff <= 5) {
      setOddsValidation({ valid: true, message: 'Odds match market' })
    } else if (percentDiff <= 10) {
      setOddsValidation({ valid: true, message: 'Odds slightly differ from market' })
    } else if (percentDiff <= 20) {
      setOddsValidation({ valid: false, message: 'Odds differ significantly from market (>10%)' })
    } else {
      setOddsValidation({ valid: false, message: 'Odds differ greatly from market (>20%) - please verify' })
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
    } else if (name === 'pickType') {
      // Reset form when switching between straight and parlay
      const newPickType = value as 'straight' | 'parlay'
      setFormData(prev => ({
        ...prev,
        [name]: newPickType,
        selection: '',
        selectedTeam: '',
        selectedPlayer: '',
        oddsAmerican: ''
      }))
      // Reset parlay legs when switching to straight
      if (newPickType === 'straight') {
        setParlayLegs([])
      } else if (newPickType === 'parlay' && parlayLegs.length === 0) {
        // Initialize with 2 legs when switching to parlay
        const leg1: ParlayLeg = {
          id: Date.now().toString(),
          sport: '',
          league: '',
          betType: 'moneyline',
          selection: '',
          oddsAmerican: '',
          gameStartTime: ''
        }
        const leg2: ParlayLeg = {
          id: (Date.now() + 1).toString(),
          sport: '',
          league: '',
          betType: 'moneyline',
          selection: '',
          oddsAmerican: '',
          gameStartTime: ''
        }
        setParlayLegs([leg1, leg2])
        // Expand both legs by default
        setExpandedLegs(new Set([leg1.id, leg2.id]))
      }
    } else if (name === 'betType') {
      // Reset selection fields when bet type changes
      setFormData(prev => ({
        ...prev,
        [name]: value as any,
        selection: '',
        selectedTeam: '',
        selectedPlayer: ''
      }))
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game)
    setFormData(prev => ({
      ...prev,
      gameId: game.gameId,
      gameText: `${game.awayTeam?.name || 'Away'} @ ${game.homeTeam?.name || 'Home'}`,
      gameStartTime: new Date(game.startTime).toISOString().slice(0, 16),
      league: game.league || prev.league
    }))
    setShowGameSearch(false)
  }

  const handleUseMarketOdds = (odds: number) => {
    setFormData(prev => ({ ...prev, oddsAmerican: odds.toString() }))
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

  // Parlay odds calculation
  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1
    } else {
      return (100 / Math.abs(american)) + 1
    }
  }

  const decimalToAmerican = (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100)
    } else {
      return Math.round(-100 / (decimal - 1))
    }
  }

  const calculateParlayOdds = (legs: ParlayLeg[]): { oddsDecimal: number; oddsAmerican: number } | null => {
    if (legs.length === 0) return null
    
    const validLegs = legs.filter(leg => leg.oddsAmerican && !isNaN(parseInt(leg.oddsAmerican)))
    if (validLegs.length === 0) return null

    let parlayDecimal = 1
    for (const leg of validLegs) {
      const legDecimal = americanToDecimal(parseInt(leg.oddsAmerican))
      if (legDecimal <= 0) return null
      parlayDecimal *= legDecimal
    }

    const parlayAmerican = decimalToAmerican(parlayDecimal)
    return {
      oddsDecimal: Math.round(parlayDecimal * 10000) / 10000,
      oddsAmerican: Math.round(parlayAmerican)
    }
  }

  // Parlay leg management
  const addParlayLeg = () => {
    const newLeg: ParlayLeg = {
      id: Date.now().toString(),
      sport: '',
      league: '',
      betType: 'moneyline',
      selection: '',
      oddsAmerican: '',
      gameStartTime: ''
    }
    setParlayLegs([...parlayLegs, newLeg])
    // Expand new leg by default
    setExpandedLegs(prev => new Set([...Array.from(prev), newLeg.id]))
  }

  const removeParlayLeg = (legId: string) => {
    setParlayLegs(parlayLegs.filter(leg => leg.id !== legId))
    setExpandedLegs(prev => {
      const newSet = new Set(prev)
      newSet.delete(legId)
      return newSet
    })
  }

  const toggleLegExpanded = (legId: string) => {
    setExpandedLegs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(legId)) {
        newSet.delete(legId)
      } else {
        newSet.add(legId)
      }
      return newSet
    })
  }

  const updateParlayLeg = async (legId: string, updates: Partial<ParlayLeg>) => {
    setParlayLegs(parlayLegs.map(leg => 
      leg.id === legId ? { ...leg, ...updates } : leg
    ))
    
    // Fetch leagues if sport changed
    if (updates.sport) {
      try {
        const response = await api.get(`/games/leagues/${updates.sport}`)
        setLegLeagues(prev => ({ ...prev, [legId]: response.data || [] }))
      } catch (error) {
        console.error('Error fetching leagues for leg:', error)
        setLegLeagues(prev => ({ ...prev, [legId]: [] }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.pickType === 'parlay') {
        // Parlay validation
        if (parlayLegs.length < 2) {
          toast.error('Parlay must have at least 2 legs')
          setLoading(false)
          return
        }

        // Validate all legs
        for (let i = 0; i < parlayLegs.length; i++) {
          const leg = parlayLegs[i]
          if (!leg.sport || !leg.league || !leg.betType || !leg.selection || !leg.oddsAmerican || !leg.gameStartTime) {
            toast.error(`Please fill in all fields for leg ${i + 1}`)
            setLoading(false)
            return
          }

          if (!validateAmericanOdds(leg.oddsAmerican)) {
            toast.error(`Invalid odds for leg ${i + 1}`)
            setLoading(false)
            return
          }

          const gameStart = new Date(leg.gameStartTime)
          const now = new Date()
          if (gameStart <= now) {
            toast.error(`Game start time for leg ${i + 1} must be in the future`)
            setLoading(false)
            return
          }
        }

        if (!formData.unitsRisked) {
          toast.error('Please enter units risked')
          setLoading(false)
          return
        }

        // Calculate parlay odds
        const parlayOdds = calculateParlayOdds(parlayLegs)
        if (!parlayOdds) {
          toast.error('Unable to calculate parlay odds. Please check all leg odds.')
          setLoading(false)
          return
        }

        // Build parlay legs for API
        const parlayLegsData = parlayLegs.map(leg => {
          let selection = leg.selection
          if (leg.selectedTeam) {
            selection = `${leg.selectedTeam} ${selection}`
          }
          if (leg.selectedPlayer) {
            selection = `${leg.selectedPlayer} ${selection}`
          }

          return {
            sport: leg.sport,
            league: leg.league,
            gameId: leg.gameId || null,
            gameText: leg.gameText || null,
            betType: leg.betType,
            selection: selection,
            oddsAmerican: parseInt(leg.oddsAmerican),
            oddsDecimal: americanToDecimal(parseInt(leg.oddsAmerican)),
            gameStartTime: leg.gameStartTime
          }
        })

        // Use earliest game start time as the parlay's gameStartTime
        const earliestGameStart = parlayLegs.reduce((earliest, leg) => {
          const legTime = new Date(leg.gameStartTime)
          return legTime < earliest ? legTime : earliest
        }, new Date(parlayLegs[0].gameStartTime))

        const payload = {
          sport: parlayLegs[0].sport, // Use first leg's sport as primary
          league: parlayLegs[0].league, // Use first leg's league as primary
          betType: 'parlay',
          selection: `Parlay (${parlayLegs.length} legs)`,
          oddsAmerican: parlayOdds.oddsAmerican,
          oddsDecimal: parlayOdds.oddsDecimal,
          unitsRisked: parseFloat(formData.unitsRisked),
          amountRisked: formData.amountRisked ? Math.round(parseFloat(formData.amountRisked) * 100) : undefined,
          gameStartTime: earliestGameStart.toISOString(),
          writeUp: formData.writeUp || null,
          isFree: formData.isFree,
          plans: formData.plans,
          oneOffPriceCents: formData.oneOffPriceCents,
          isParlay: true,
          parlayLegs: parlayLegsData
        }

        await api.post('/creator/picks', payload)
        toast.success('Parlay created successfully!')
        router.push('/creator/dashboard/picks')
      } else {
        // Straight pick validation (existing logic)
        if (!formData.sport || !formData.league || !formData.betType) {
          toast.error('Please fill in all required fields')
          setLoading(false)
          return
        }

        if (formData.betType !== 'future' && !selectedGame && !formData.gameText) {
          toast.error('Please select a game or enter game details')
          setLoading(false)
          return
        }

        if (!formData.selection) {
          toast.error('Please enter your selection')
          setLoading(false)
          return
        }

        if (!formData.oddsAmerican || !validateAmericanOdds(formData.oddsAmerican)) {
          toast.error('Please enter valid American odds')
          setLoading(false)
          return
        }

        if (!formData.unitsRisked) {
          toast.error('Please enter units risked')
          setLoading(false)
          return
        }

        if (formData.betType !== 'future' && !formData.gameStartTime) {
          toast.error('Game start time is required')
          setLoading(false)
          return
        }

        if (formData.gameStartTime) {
          const gameStart = new Date(formData.gameStartTime)
          const now = new Date()
          if (gameStart <= now) {
            toast.error('Game start time must be in the future')
            setLoading(false)
            return
          }
        }

        // Build selection string
        let selection = formData.selection
        if (formData.selectedTeam && formData.betType !== 'future') {
          selection = `${formData.selectedTeam} ${selection}`
        }
        if (formData.selectedPlayer && formData.betType === 'prop') {
          selection = `${formData.selectedPlayer} ${selection}`
        }

        const payload = {
          sport: formData.sport,
          league: formData.league,
          gameId: selectedGame?.gameId || null,
          gameText: formData.gameText || null,
          betType: formData.betType,
          selection: selection,
          oddsAmerican: parseInt(formData.oddsAmerican),
          unitsRisked: parseFloat(formData.unitsRisked),
          amountRisked: formData.amountRisked ? Math.round(parseFloat(formData.amountRisked) * 100) : undefined,
          gameStartTime: formData.gameStartTime || null,
          writeUp: formData.writeUp || null,
          isFree: formData.isFree,
          plans: formData.plans,
          oneOffPriceCents: formData.oneOffPriceCents,
          isParlay: false
        }

        await api.post('/creator/picks', payload)
        toast.success('Pick created successfully!')
        router.push('/creator/dashboard/picks')
      }
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
  const isFuture = formData.betType === 'future'
  const isProp = formData.betType === 'prop'
  const showTeamSelection = !isFuture && formData.pickType !== 'parlay' && teams.length > 0
  const showPlayerSelection = isProp && players.length > 0

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
            {/* Pick Type Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Pick Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pickType: 'straight' }))}
                  className={`px-6 py-4 rounded-lg border-2 transition-all font-semibold ${
                    formData.pickType === 'straight'
                      ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                      : 'bg-black/60 border-slate-700 text-gray-300 hover:border-slate-600'
                  }`}
                >
                  Straight
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pickType: 'parlay' }))}
                  className={`px-6 py-4 rounded-lg border-2 transition-all font-semibold ${
                    formData.pickType === 'parlay'
                      ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                      : 'bg-black/60 border-slate-700 text-gray-300 hover:border-slate-600'
                  }`}
                >
                  Parlay
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {formData.pickType === 'straight' 
                  ? 'Single bet on one outcome' 
                  : 'Multiple bets combined into one'}
              </p>
            </div>

            {/* Parlay Form */}
            {formData.pickType === 'parlay' ? (
              <>
                {/* Parlay Odds Display - FanDuel Style */}
                {parlayLegs.length >= 2 && calculatedParlayOdds && (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border-2 border-primary-500/50 p-6 shadow-lg shadow-primary-500/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Same Game Parlay</p>
                        <p className="text-4xl font-extrabold text-white mb-1">
                          {calculatedParlayOdds.oddsAmerican > 0 ? '+' : ''}
                          {calculatedParlayOdds.oddsAmerican}
                        </p>
                        <p className="text-xs text-gray-400">
                          {parlayLegs.length} leg{parlayLegs.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Decimal</p>
                        <p className="text-xl font-bold text-primary-400">
                          {calculatedParlayOdds.oddsDecimal.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    {formData.unitsRisked && (
                      <div className="pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Total Wager</span>
                          <span className="text-sm font-semibold text-white">
                            {formData.unitsRisked} unit{parseFloat(formData.unitsRisked) !== 1 ? 's' : ''} (${estimatedAmount})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Parlay Legs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-300">
                      Parlay Legs * (Minimum 2)
                    </label>
                    <button
                      type="button"
                      onClick={addParlayLeg}
                      className="px-4 py-2 bg-primary-600/20 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-600/30 transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Leg
                    </button>
                  </div>

                  {parlayLegs.map((leg, index) => {
                    const isExpanded = expandedLegs.has(leg.id)
                    return (
                    <div key={leg.id} className="bg-slate-900/50 rounded-xl border-2 border-slate-700 hover:border-primary-500/50 transition-all overflow-hidden">
                      {/* Leg Header - Always Visible */}
                      <div 
                        className="p-5 cursor-pointer"
                        onClick={() => toggleLegExpanded(leg.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary-600/20 border-2 border-primary-500/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary-400 font-bold text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-semibold text-white">Leg {index + 1}</h4>
                                {leg.selection && leg.oddsAmerican && (
                                  <span className="text-xs text-gray-400">
                                    • {leg.selection} ({!isNaN(parseInt(leg.oddsAmerican)) && parseInt(leg.oddsAmerican) > 0 ? '+' : ''}{leg.oddsAmerican})
                                  </span>
                                )}
                              </div>
                              {!leg.selection && (
                                <p className="text-xs text-gray-500 mt-0.5">Click to expand and edit</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeParlayLeg(leg.id)
                              }}
                              disabled={parlayLegs.length <= 2}
                              className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                              title={parlayLegs.length <= 2 ? 'Parlay must have at least 2 legs' : 'Remove leg'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLegExpanded(leg.id)
                              }}
                              className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            >
                              <svg 
                                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-4 border-t border-slate-700 pt-4">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sport */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">Sport *</label>
                          <select
                            value={leg.sport}
                            onChange={(e) => updateParlayLeg(leg.id, { sport: e.target.value, league: '' })}
                            className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all text-sm"
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

                        {/* League */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-400">League *</label>
                          <select
                            value={leg.league}
                            onChange={(e) => updateParlayLeg(leg.id, { league: e.target.value })}
                            disabled={!leg.sport}
                            className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">{leg.sport ? 'Select league' : 'Select sport first'}</option>
                            {legLeagues[leg.id]?.map((league) => (
                              <option key={league} value={league}>{league}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Bet Type */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Bet Type *</label>
                        <select
                          value={leg.betType}
                          onChange={(e) => updateParlayLeg(leg.id, { betType: e.target.value as any })}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all text-sm"
                        >
                          <option value="moneyline">Moneyline</option>
                          <option value="spread">Spread</option>
                          <option value="total">Total (Over/Under)</option>
                          <option value="prop">Prop</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Game Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Game *</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setGameSearchForLeg(index)}
                            disabled={!leg.sport || !leg.league}
                            className="flex-1 px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg hover:border-primary-500/50 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {leg.selectedGame 
                              ? `${leg.selectedGame.awayTeam?.name || 'Away'} @ ${leg.selectedGame.homeTeam?.name || 'Home'}` 
                              : 'Search Games'}
                          </button>
                          {leg.selectedGame && (
                            <button
                              type="button"
                              onClick={() => updateParlayLeg(leg.id, { selectedGame: null, gameId: '', gameText: '' })}
                              className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all text-sm"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {!leg.selectedGame && (
                          <input
                            type="text"
                            value={leg.gameText || ''}
                            onChange={(e) => updateParlayLeg(leg.id, { gameText: e.target.value })}
                            placeholder="Or enter manually: e.g., Lakers vs Warriors"
                            className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 text-sm mt-2"
                          />
                        )}
                        {gameSearchForLeg === index && (
                          <GameSearchModal
                            sport={leg.sport}
                            league={leg.league}
                            onSelectGame={(game) => {
                              updateParlayLeg(leg.id, {
                                selectedGame: game,
                                gameId: game.gameId,
                                gameText: `${game.awayTeam?.name || 'Away'} @ ${game.homeTeam?.name || 'Home'}`,
                                gameStartTime: new Date(game.startTime).toISOString().slice(0, 16)
                              })
                              setGameSearchForLeg(null)
                            }}
                            onClose={() => setGameSearchForLeg(null)}
                          />
                        )}
                      </div>

                      {/* Selection and Odds - Prominent Display */}
                      <div className="bg-black/40 rounded-lg p-4 border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Selection *</label>
                            <input
                              type="text"
                              value={leg.selection}
                              onChange={(e) => updateParlayLeg(leg.id, { selection: e.target.value })}
                              className="w-full px-4 py-3 bg-black/60 border-2 border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-gray-500 text-sm font-medium"
                              placeholder="e.g., J.J. McCarthy 20+ Yards"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Odds (American) *</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={leg.oddsAmerican}
                                onChange={(e) => updateParlayLeg(leg.id, { oddsAmerican: e.target.value })}
                                className="flex-1 px-4 py-3 bg-black/60 border-2 border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-gray-500 text-sm font-medium"
                                placeholder="-110, +135"
                              />
                              {leg.oddsAmerican && !isNaN(parseInt(leg.oddsAmerican)) && (
                                <div className="px-3 py-3 bg-primary-600/20 border border-primary-500/50 rounded-lg">
                                  <span className="text-primary-400 font-bold text-sm">
                                    {parseInt(leg.oddsAmerican) > 0 ? '+' : ''}{leg.oddsAmerican}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bet Type Badge */}
                        {leg.betType && (
                          <div className="mt-3">
                            <span className="inline-block px-3 py-1 bg-slate-800/50 text-gray-300 text-xs font-medium rounded-full border border-slate-600">
                              {leg.betType === 'moneyline' ? 'Moneyline' :
                               leg.betType === 'spread' ? 'Spread' :
                               leg.betType === 'total' ? 'Total' :
                               leg.betType === 'prop' ? 'Prop' : 'Other'}
                            </span>
                            {leg.selectedGame && (
                              <span className="ml-2 inline-block px-3 py-1 bg-slate-800/50 text-gray-300 text-xs font-medium rounded-full border border-slate-600">
                                {leg.selectedGame.awayTeam?.name || 'Away'} @ {leg.selectedGame.homeTeam?.name || 'Home'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Game Start Time */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Game Start Time *</label>
                        <input
                          type="datetime-local"
                          value={leg.gameStartTime}
                          onChange={(e) => updateParlayLeg(leg.id, { gameStartTime: e.target.value })}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full px-3 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all text-sm"
                        />
                      </div>
                        </div>
                      )}
                    </div>
                  )})}

                  {parlayLegs.length < 2 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-400 text-sm">
                        ⚠️ Parlay must have at least 2 legs. Add another leg to continue.
                      </p>
                    </div>
                  )}
                </div>

                {/* Units and Amount for Parlay */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
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
                    placeholder="Detailed analysis and reasoning for your parlay..."
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

                {/* Submit Button for Parlay */}
                <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={loading || parlayLegs.length < 2}
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
                        Post Parlay
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
              </>
            ) : (
              <>
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
                  League *
                </label>
                <select
                  name="league"
                  value={formData.league}
                  onChange={handleChange}
                  required
                  disabled={!formData.sport || availableLeagues.length === 0}
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.sport ? 'Select league' : 'Select sport first'}</option>
                  {availableLeagues.map((league) => (
                    <option key={league} value={league}>{league}</option>
                  ))}
                </select>
                {!formData.sport && (
                  <p className="text-xs text-gray-500">Select a sport to see available leagues</p>
                )}
              </div>
            </div>

            {/* Pick Type (Bet Type) */}
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
                <option value="future">Future</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Game Selection - Only for non-futures */}
            {!isFuture && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Game *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGameSearch(true)}
                    disabled={!formData.sport || !formData.league}
                    className="px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg hover:border-primary-500/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {selectedGame 
                      ? `${selectedGame.awayTeam?.name || 'Away'} @ ${selectedGame.homeTeam?.name || 'Home'}` 
                      : 'Search Games'}
                  </button>
                  {selectedGame && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGame(null)
                        setFormData(prev => ({ ...prev, gameId: '', gameText: '', selectedTeam: '', selectedPlayer: '' }))
                        setTeams([])
                        setPlayers([])
                      }}
                      className="px-4 py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {!selectedGame && (
                  <input
                    type="text"
                    name="gameText"
                    value={formData.gameText}
                    onChange={handleChange}
                    placeholder="Or enter manually: e.g., Lakers vs Warriors"
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600 mt-2"
                  />
                )}
                {showGameSearch && (
                  <GameSearchModal
                    sport={formData.sport}
                    league={formData.league}
                    onSelectGame={handleGameSelect}
                    onClose={() => setShowGameSearch(false)}
                  />
                )}
              </div>
            )}

            {/* Team Selection - For non-futures */}
            {showTeamSelection && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Team *
                </label>
                <select
                  name="selectedTeam"
                  value={formData.selectedTeam}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                >
                  <option value="">Select team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>{team.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Player Selection - For props */}
            {showPlayerSelection && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  Player *
                </label>
                <select
                  name="selectedPlayer"
                  value={formData.selectedPlayer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                >
                  <option value="">Select player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.name}>
                      {player.name} {player.position ? `(${player.position})` : ''}
                    </option>
                  ))}
                </select>
                {players.length === 0 && (
                  <p className="text-xs text-gray-500">No players available. You can enter manually below.</p>
                )}
              </div>
            )}

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
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                placeholder={
                  formData.betType === 'moneyline' ? 'e.g., Win' :
                  formData.betType === 'spread' ? 'e.g., -5.5' :
                  formData.betType === 'total' ? 'e.g., Over 225.5' :
                  formData.betType === 'prop' ? 'e.g., Over 25.5 points' :
                  formData.betType === 'future' ? 'e.g., To win Super Bowl' :
                  'e.g., Your selection'
                }
              />
            </div>

            {/* Odds with Market Suggestions */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Odds (American) *
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="oddsAmerican"
                    value={formData.oddsAmerican}
                    onChange={handleChange}
                    required
                    className={`flex-1 px-4 py-3 bg-black/60 border ${
                      oddsValidation?.valid === false 
                        ? 'border-red-500/50' 
                        : oddsValidation?.valid === true 
                        ? 'border-green-500/50' 
                        : 'border-slate-700'
                    } text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600`}
                    placeholder="-110, +135, etc."
                  />
                  {fetchingOdds && (
                    <div className="flex items-center px-4 bg-slate-800 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    </div>
                  )}
                </div>
                
                {/* Market Odds Suggestions */}
                {availableOdds.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-gray-400 mb-2">Market Odds (click to use):</p>
                    <div className="flex flex-wrap gap-2">
                      {availableOdds.slice(0, 5).map((odd, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUseMarketOdds(odd.value)}
                          className="px-3 py-1.5 bg-primary-600/20 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-600/30 transition-all text-sm"
                        >
                          {odd.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Odds Validation Message */}
                {oddsValidation && (
                  <p className={`text-xs ${
                    oddsValidation.valid ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {oddsValidation.message}
                  </p>
                )}
              </div>
            </div>

            {/* Game Start Time - Only for non-futures */}
            {!isFuture && (
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
            )}

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
              </>
            )}
          </form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-lg shadow-black/20 sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            
            {formData.pickType === 'parlay' ? (
              <>
                {parlayLegs.length >= 2 && calculatedParlayOdds && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 rounded-lg border border-primary-500/50 p-4">
                      <p className="text-xs text-gray-400 mb-1">Parlay Odds</p>
                      <p className="text-2xl font-bold text-white">
                        {calculatedParlayOdds.oddsAmerican > 0 ? '+' : ''}
                        {calculatedParlayOdds.oddsAmerican}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {parlayLegs.length} leg{parlayLegs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-3 font-semibold">Parlay Legs</p>
                      <div className="space-y-3">
                        {parlayLegs.map((leg, idx) => (
                          <div key={leg.id} className="bg-slate-800/70 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-6 h-6 rounded-full bg-primary-600/30 border border-primary-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-primary-400 font-bold text-xs">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-semibold mb-1">
                                    {leg.selection || 'Not set'}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {leg.betType && (
                                      <span className="text-xs text-gray-400 bg-slate-700/50 px-2 py-0.5 rounded">
                                        {leg.betType}
                                      </span>
                                    )}
                                    {leg.oddsAmerican && (
                                      <span className="text-xs font-medium text-primary-400">
                                        {!isNaN(parseInt(leg.oddsAmerican)) && parseInt(leg.oddsAmerican) > 0 ? '+' : ''}{leg.oddsAmerican}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {formData.unitsRisked && (
                      <div>
                        <p className="text-sm text-gray-400">Units Risked</p>
                        <p className="text-white font-medium">{formData.unitsRisked} units</p>
                        <p className="text-xs text-gray-500">≈ ${estimatedAmount}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {parlayLegs.length < 2 && (
                  <p className="text-gray-500 text-sm">Add at least 2 legs to see preview</p>
                )}
              </>
            ) : (
              <>
                {formData.selection && formData.sport && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Pick Type</p>
                      <p className="text-white font-medium capitalize">{formData.pickType}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Selection</p>
                      <p className="text-white font-medium">
                        {formData.selectedTeam && `${formData.selectedTeam} `}
                        {formData.selectedPlayer && `${formData.selectedPlayer} `}
                        {formData.selection}
                      </p>
                    </div>
                    
                    {formData.oddsAmerican && (
                      <div>
                        <p className="text-sm text-gray-400">Odds</p>
                        <p className="text-white font-medium">{formData.oddsAmerican}</p>
                        {oddsValidation && (
                          <p className={`text-xs mt-1 ${oddsValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                            {oddsValidation.message}
                          </p>
                        )}
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
                  </div>
                )}
                
                {(!formData.selection || !formData.sport) && (
                  <p className="text-gray-500 text-sm">Fill in the form to see preview</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
