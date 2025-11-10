'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Pick {
  _id: string
  creator: {
    _id: string
    username: string
    email: string
  }
  storefront: {
    handle: string
    displayName: string
  }
  sport: string
  league?: string
  gameText?: string
  selection: string
  betType: string
  oddsAmerican: number
  unitsRisked: number
  amountRisked: number
  gameStartTime: string
  writeUp?: string
  createdAt: string
  status: 'pending' | 'locked' | 'graded' | 'disputed'
  result: 'pending' | 'win' | 'loss' | 'push' | 'void'
  isVerified: boolean
  flagged: boolean
  flags: Array<{
    reason: string
    flaggedBy: string
    flaggedAt: string
  }>
  editHistory: Array<{
    userId: string
    oldValue: any
    newValue: any
    changedAt: string
    reason: string
    isAdminEdit: boolean
  }>
}

export default function AdminPicksPage() {
  const router = useRouter()
  const { user, loading: authLoading, checkAuth } = useAuth()
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'flagged' | 'pending' | 'locked' | 'graded' | 'disputed'>('all')
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editReason, setEditReason] = useState('')
  const [editing, setEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})

  useEffect(() => {
    if (!authLoading) {
      checkAuth()
    }
  }, [])

  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.includes('admin'))) {
      setTimeout(() => {
        router.push('/')
      }, 1000)
      return
    }
    if (user?.roles?.includes('admin')) {
      fetchPicks()
    }
  }, [user, authLoading, router, filter])

  const fetchPicks = async () => {
    try {
      setLoading(true)
      // Fetch all picks from all creators
      const response = await api.get('/admin/picks', {
        params: { filter }
      })
      setPicks(response.data || [])
    } catch (error) {
      console.error('Error fetching picks:', error)
      toast.error('Failed to load picks')
    } finally {
      setLoading(false)
    }
  }

  const handleFlag = async (pickId: string, reason: string) => {
    try {
      await api.post('/admin/flag', {
        pickId,
        reason
      })
      toast.success('Pick flagged successfully')
      fetchPicks()
    } catch (error: any) {
      console.error('Flag pick error:', error)
      toast.error(error.response?.data?.message || 'Failed to flag pick')
    }
  }

  const handleEdit = async () => {
    if (!selectedPick) return
    
    if (!editReason.trim()) {
      toast.error('Please provide a reason for editing')
      return
    }

    setEditing(true)
    try {
      const payload = {
        ...editFormData,
        reason: editReason
      }
      
      await api.put(`/creator/picks/${selectedPick._id}`, payload)
      toast.success('Pick updated successfully')
      setShowEditModal(false)
      setEditReason('')
      setEditFormData({})
      fetchPicks()
    } catch (error: any) {
      console.error('Edit pick error:', error)
      toast.error(error.response?.data?.message || 'Failed to edit pick')
    } finally {
      setEditing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user || !user.roles?.includes('admin')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400 mb-2">Checking admin access...</p>
        </div>
      </div>
    )
  }

  const filteredPicks = picks.filter(pick => {
    if (filter === 'flagged') return pick.flagged
    if (filter === 'pending') return pick.status === 'pending'
    if (filter === 'locked') return pick.status === 'locked'
    if (filter === 'graded') return pick.status === 'graded'
    if (filter === 'disputed') return pick.status === 'disputed'
    return true
  })

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Pick Management</h1>
          <p className="text-gray-400">View and manage all picks across the platform</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', count: picks.length },
            { key: 'flagged', label: 'Flagged', count: picks.filter(p => p.flagged).length },
            { key: 'pending', label: 'Pending', count: picks.filter(p => p.status === 'pending').length },
            { key: 'locked', label: 'Locked', count: picks.filter(p => p.status === 'locked').length },
            { key: 'graded', label: 'Graded', count: picks.filter(p => p.status === 'graded').length },
            { key: 'disputed', label: 'Disputed', count: picks.filter(p => p.status === 'disputed').length }
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

        {/* Picks List */}
        {filteredPicks.length === 0 ? (
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-12 text-center">
            <p className="text-gray-400 text-lg">No picks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPicks.map((pick) => (
              <div
                key={pick._id}
                className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-primary-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{pick.selection}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        pick.result === 'win' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        pick.result === 'loss' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {pick.result || 'pending'}
                      </span>
                      {pick.isVerified && (
                        <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold border border-green-500/30 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      )}
                      {pick.flagged && (
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold border border-red-500/30">
                          Flagged
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        pick.status === 'locked' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        pick.status === 'graded' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {pick.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Creator:</span>
                        <span className="text-white ml-2">{pick.storefront?.displayName || pick.creator?.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Sport:</span>
                        <span className="text-white ml-2">{pick.sport}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Odds:</span>
                        <span className="text-white ml-2">
                          {pick.oddsAmerican > 0 ? `+${pick.oddsAmerican}` : pick.oddsAmerican}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Risk:</span>
                        <span className="text-white ml-2">
                          {pick.unitsRisked} units (${((pick.amountRisked || 0) / 100).toFixed(2)})
                        </span>
                      </div>
                    </div>
                    {pick.gameStartTime && (
                      <div className="mt-3 text-sm text-gray-400">
                        <span>Game Start: {new Date(pick.gameStartTime).toLocaleString()}</span>
                        <span className="ml-4">Posted: {new Date(pick.createdAt).toLocaleString()}</span>
                      </div>
                    )}
                    {pick.flags && pick.flags.length > 0 && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-red-400 mb-1">Flags:</p>
                        {pick.flags.map((flag, idx) => (
                          <p key={idx} className="text-xs text-gray-300">
                            {flag.reason} - {new Date(flag.flaggedAt).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    )}
                    {pick.editHistory && pick.editHistory.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <p className="text-sm font-semibold text-gray-300 mb-1">Edit History:</p>
                        {pick.editHistory.map((edit, idx) => (
                          <p key={idx} className="text-xs text-gray-400">
                            {edit.isAdminEdit ? 'Admin' : 'Creator'} edit - {edit.reason} - {new Date(edit.changedAt).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {pick.status === 'locked' && (
                      <button
                        onClick={() => {
                          setSelectedPick(pick)
                          setEditFormData({
                            selection: pick.selection,
                            oddsAmerican: pick.oddsAmerican,
                            unitsRisked: pick.unitsRisked,
                            betType: pick.betType,
                            sport: pick.sport,
                            league: pick.league,
                            gameText: pick.gameText || '',
                            writeUp: pick.writeUp || ''
                          })
                          setShowEditModal(true)
                        }}
                        className="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-all border border-yellow-500/30 hover:border-yellow-500/50 flex items-center gap-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const reason = prompt('Enter flag reason:')
                        if (reason) {
                          handleFlag(pick._id, reason)
                        }
                      }}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all border border-red-500/30 hover:border-red-500/50 flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Flag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedPick && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-2xl w-full p-6 my-8">
              <h3 className="text-xl font-semibold text-white mb-4">Edit Locked Pick</h3>
              <p className="text-gray-400 text-sm mb-6">
                This pick is locked. Admin edits require a reason and will be logged in the audit trail.
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selection *
                  </label>
                  <input
                    type="text"
                    value={editFormData.selection || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, selection: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Odds (American) *
                    </label>
                    <input
                      type="number"
                      value={editFormData.oddsAmerican || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, oddsAmerican: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Units Risked *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.unitsRisked || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, unitsRisked: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Type *
                  </label>
                  <select
                    value={editFormData.betType || 'moneyline'}
                    onChange={(e) => setEditFormData({ ...editFormData, betType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="moneyline">Moneyline</option>
                    <option value="spread">Spread</option>
                    <option value="total">Total</option>
                    <option value="prop">Prop</option>
                    <option value="parlay">Parlay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Write-up
                  </label>
                  <textarea
                    value={editFormData.writeUp || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, writeUp: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Edit *
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Explain why this pick needs to be edited..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  disabled={editing || !editReason.trim() || !editFormData.selection || !editFormData.oddsAmerican || !editFormData.unitsRisked}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? 'Editing...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditReason('')
                    setEditFormData({})
                    setSelectedPick(null)
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

