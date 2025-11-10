'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [unitValueDefault, setUnitValueDefault] = useState<number>(100)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/creator/stats')
      if (response.data?.unitValueDefault) {
        setUnitValueDefault(response.data.unitValueDefault)
      }
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put('/creator/settings/unit-value', {
        unitValueDefault
      })
      toast.success('Unit value updated successfully!')
    } catch (error: any) {
      console.error('Update unit value error:', error)
      toast.error(error.response?.data?.message || 'Failed to update unit value')
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
        <Link 
          href="/creator/dashboard" 
          className="text-primary-400 hover:text-primary-300 mb-4 inline-flex items-center gap-2 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your creator preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unit Value Settings */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 space-y-6 shadow-lg shadow-black/20">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Unit System Settings</h2>
              <p className="text-gray-400 text-sm mb-6">
                Set your default unit value. This determines how much each unit is worth in USD. 
                This value is snapshotted when you create picks, so changing it won't affect past picks.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                Default Unit Value ($) *
              </label>
              <input
                type="number"
                value={unitValueDefault}
                onChange={(e) => setUnitValueDefault(parseFloat(e.target.value) || 0)}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                placeholder="100.00"
              />
              <p className="text-xs text-gray-500">
                Example: If set to $100, then 1 unit = $100, 2 units = $200, etc.
              </p>
            </div>

            {stats && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Your Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Total Units Risked</p>
                    <p className="text-white font-semibold">{stats.totalUnitsRisked?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Units Won</p>
                    <p className="text-white font-semibold">{stats.totalUnitsWon?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Amount Risked</p>
                    <p className="text-white font-semibold">${((stats.totalAmountRisked || 0) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Amount Won</p>
                    <p className="text-white font-semibold">${((stats.totalAmountWon || 0) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Win Rate</p>
                    <p className="text-white font-semibold">{stats.winRate?.toFixed(1) || '0.0'}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">ROI</p>
                    <p className="text-white font-semibold">{stats.roi?.toFixed(1) || '0.0'}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-6 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading || unitValueDefault <= 0}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-primary-500/50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-lg shadow-black/20 sticky top-8">
            <h3 className="text-lg font-semibold text-white mb-4">About Units</h3>
            <div className="space-y-4 text-sm text-gray-400">
              <p>
                The unit system allows you to track your picks consistently regardless of bet size. 
                One unit represents your standard bet amount.
              </p>
              <p>
                <strong className="text-white">Example:</strong> If your unit value is $100:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>1 unit = $100</li>
                <li>2 units = $200</li>
                <li>0.5 units = $50</li>
              </ul>
              <p className="text-xs text-gray-500 pt-2 border-t border-slate-800">
                Note: Changing your unit value only affects new picks. Past picks keep their original unit value snapshot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

