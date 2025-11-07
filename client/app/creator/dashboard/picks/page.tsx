'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Pick {
  _id: string
  title: string
  description: string
  sport: string
  marketType: string
  odds: string
  stake: string
  result: string
  isFree: boolean
  oneOffPriceCents: number
  eventDate: string
  publishedAt: string
  createdAt: string
  tags: string[]
}

export default function PicksPage() {
  const { user } = useAuth()
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'free' | 'paid' | 'pending' | 'won' | 'lost'>('all')

  useEffect(() => {
    fetchPicks()
  }, [])

  const fetchPicks = async () => {
    try {
      const response = await api.get('/creator/picks')
      setPicks(response.data || [])
    } catch (error) {
      console.error('Error fetching picks:', error)
      toast.error('Failed to load picks')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (pickId: string) => {
    if (!confirm('Are you sure you want to delete this pick?')) return
    try {
      await api.delete(`/creator/picks/${pickId}`)
      toast.success('Pick deleted successfully')
      fetchPicks()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete pick')
    }
  }

  const filteredPicks = picks.filter(pick => {
    if (filter === 'free') return pick.isFree
    if (filter === 'paid') return !pick.isFree
    if (filter === 'pending') return pick.result === 'pending'
    if (filter === 'won') return pick.result === 'won'
    if (filter === 'lost') return pick.result === 'lost'
    return true
  })

  const getResultBadge = (result: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      won: 'bg-green-500/20 text-green-400 border-green-500/30',
      lost: 'bg-red-500/20 text-red-400 border-red-500/30',
      pushed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      void: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return badges[result as keyof typeof badges] || badges.pending
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
            <h1 className="text-3xl font-bold text-white mb-2">My Picks</h1>
            <p className="text-gray-400">Manage and track your sports predictions</p>
          </div>
          <Link
            href="/creator/dashboard/picks/new"
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold border border-primary-500/50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Pick
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', count: picks.length },
            { key: 'free', label: 'Free', count: picks.filter(p => p.isFree).length },
            { key: 'paid', label: 'Paid', count: picks.filter(p => !p.isFree).length },
            { key: 'pending', label: 'Pending', count: picks.filter(p => p.result === 'pending').length },
            { key: 'won', label: 'Won', count: picks.filter(p => p.result === 'won').length },
            { key: 'lost', label: 'Lost', count: picks.filter(p => p.result === 'lost').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/20'
                  : 'bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 border border-slate-800'
              }`}
            >
              {label} <span className="ml-1 opacity-75">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {filteredPicks.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2 font-medium">
              {filter === 'all' ? 'No picks yet' : `No ${filter} picks`}
            </p>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Create your first pick to start sharing predictions with your subscribers'
                : `You don't have any ${filter} picks at the moment`}
            </p>
            {filter === 'all' && (
              <Link
                href="/creator/dashboard/picks/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold border border-primary-500/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Pick
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPicks.map((pick) => (
            <div 
              key={pick._id} 
              className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/10 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white">{pick.title}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getResultBadge(pick.result || 'pending')}`}>
                        {pick.result || 'pending'}
                      </span>
                      {pick.isFree ? (
                        <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold border border-green-500/30">
                          Free
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-xs font-semibold border border-primary-500/30">
                          ${((pick.oneOffPriceCents || 0) / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {pick.description && (
                      <p className="text-gray-300 mb-4 line-clamp-2">{pick.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {pick.sport && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-gray-400">Sport:</span>
                      <span className="text-white font-medium">{pick.sport}</span>
                    </div>
                  )}
                  {pick.marketType && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-gray-400">Market:</span>
                      <span className="text-white font-medium capitalize">{pick.marketType}</span>
                    </div>
                  )}
                  {pick.odds && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-400">Odds:</span>
                      <span className="text-white font-medium">{pick.odds}</span>
                    </div>
                  )}
                  {pick.stake && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-400">Stake:</span>
                      <span className="text-white font-medium">{pick.stake}</span>
                    </div>
                  )}
                </div>

                {pick.tags && pick.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pick.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800/50 text-gray-300 rounded text-xs border border-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created {new Date(pick.createdAt).toLocaleDateString()}</span>
                    </div>
                    {pick.eventDate && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Event {new Date(pick.eventDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/creator/dashboard/picks/${pick._id}/edit`}
                      className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(pick._id)}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all border border-red-500/30 hover:border-red-500/50 flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

