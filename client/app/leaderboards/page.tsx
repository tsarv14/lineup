'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface LeaderboardEntry {
  creator: {
    handle: string
    displayName: string
  }
  stats: {
    totalUnitsWon: number
    totalUnitsRisked: number
    roi: number
    winRate: number
    transparencyScore: number
  }
}

export default function LeaderboardsPage() {
  const { isAuthenticated } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'units' | 'roi' | 'transparency'>('units')
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [sport, setSport] = useState<string>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [type, timeframe, sport])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leaderboards', {
        params: {
          type,
          timeframe,
          sport: sport === 'all' ? undefined : sport
        }
      })
      setLeaderboard(response.data.leaderboard || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Leaderboards</h1>
          <p className="text-gray-400 text-lg">
            Top creators ranked by verified pick performance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="units">Units Won</option>
                <option value="roi">ROI %</option>
                <option value="transparency">Transparency Score</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sport
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Sports</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Baseball">Baseball</option>
                <option value="Soccer">Soccer</option>
                <option value="Hockey">Hockey</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No leaderboard data available yet</p>
            <p className="text-gray-500 text-sm">
              Creators need to post verified picks to appear on the leaderboard
            </p>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Creator</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                      {type === 'units' ? 'Units Won' : type === 'roi' ? 'ROI %' : 'Transparency Score'}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Win Rate</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Total Units Risked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.creator.handle} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/creator/${entry.creator.handle}`}
                          className="text-primary-400 hover:text-primary-300 font-semibold"
                        >
                          {entry.creator.displayName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-white">
                        {type === 'units' && `${entry.stats.totalUnitsWon.toFixed(2)} units`}
                        {type === 'roi' && `${entry.stats.roi.toFixed(2)}%`}
                        {type === 'transparency' && `${entry.stats.transparencyScore.toFixed(1)}/100`}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-300">
                        {entry.stats.winRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-300">
                        {entry.stats.totalUnitsRisked.toFixed(2)} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 p-6 bg-primary-500/10 border border-primary-500/30 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">About Leaderboards</h3>
          <p className="text-gray-400 text-sm">
            Leaderboards only include verified picks posted before game start. Rankings are updated in real-time as picks are graded.
            Transparency scores reflect creator trustworthiness based on verified rate, win consistency, CLV, and edit history.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

