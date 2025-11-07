'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

interface Transaction {
  _id: string
  type: string
  amountCents: number
  feeCents: number
  buyer?: {
    username: string
    email: string
  }
  createdAt: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalFees: 0,
    netRevenue: 0
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      // Get transactions from dashboard overview
      const response = await api.get('/creator/dashboard/overview')
      const overview = response.data
      
      // Calculate stats from overview
      setStats({
        totalRevenue: overview.totalRevenue || 0,
        totalFees: Math.round((overview.totalRevenue || 0) * 0.1), // 10% platform fee
        netRevenue: Math.round((overview.totalRevenue || 0) * 0.9)
      })
      
      // For now, transactions would need a separate endpoint
      // This is a placeholder - you'd need to create a transactions endpoint
      setTransactions([])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Payments</h1>
            <p className="text-gray-400 mt-1">View your revenue and transactions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-gray-400 text-xs font-semibold uppercase">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-gray-400 text-xs font-semibold uppercase">Platform Fees</h3>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalFees)}</p>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-gray-400 text-xs font-semibold uppercase">Net Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-primary-400">{formatCurrency(stats.netRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      {transactions.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2 font-medium">No transactions yet</p>
            <p className="text-gray-500">Transactions will appear here once customers start subscribing</p>
          </div>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-black/40 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-lg border border-primary-500/30 capitalize">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                      {transaction.buyer?.username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">
                      {formatCurrency(transaction.amountCents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {formatCurrency(transaction.feeCents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-primary-400 font-bold">
                      {formatCurrency(transaction.amountCents - transaction.feeCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

