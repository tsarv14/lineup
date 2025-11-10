'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import LineGraph from '@/components/LineGraph'

interface CreatorStats {
  _id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  storefront?: {
    handle: string
    displayName: string
  }
  totalSubscribers: number
  totalRevenue: number
  activePlans: number
  totalPicks: number
  revenueData: number[]
  previousPeriodRevenue: number
  newCustomersData: number[]
  previousPeriodCustomers: number
  transactionsData: number[]
  previousPeriodTransactions: number
  spendPerCustomer: number
  spendPerCustomerData: number[]
  freeSubscribersData: number[]
  previousPeriodFreeSubs: number
  freeTrialData: number[]
  previousPeriodFreeTrials: number
  conversionRate: number
  previousPeriodConversionRate: number
  freeSubs: number
  renewingPayingSubs: number
  expiringPayingSubs: number
  couponRedemptions: Array<{ code: string; uses: number; amount: number }>
}

interface DashboardStats {
  totalSubscribers: number
  totalRevenue: number
  activePlans: number
  totalPicks: number
  revenueData: number[]
  previousPeriodRevenue: number
  newCustomersData: number[]
  previousPeriodCustomers: number
  transactionsData: number[]
  previousPeriodTransactions: number
  spendPerCustomer: number
  spendPerCustomerData: number[]
  freeSubscribersData: number[]
  previousPeriodFreeSubs: number
  freeTrialData: number[]
  previousPeriodFreeTrials: number
  conversionRate: number
  previousPeriodConversionRate: number
  freeSubs: number
  renewingPayingSubs: number
  expiringPayingSubs: number
  couponRedemptions: Array<{ code: string; uses: number; amount: number }>
  creators: CreatorStats[]
}

export default function AdminSalesPage() {
  const router = useRouter()
  const { user, loading: authLoading, checkAuth } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null)

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
      fetchDashboardStats()
    }
  }, [user, authLoading, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/sales')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching admin sales stats:', error)
      setStats({
        totalSubscribers: 0,
        totalRevenue: 0,
        activePlans: 0,
        totalPicks: 0,
        revenueData: [],
        previousPeriodRevenue: 0,
        newCustomersData: [],
        previousPeriodCustomers: 0,
        transactionsData: [],
        previousPeriodTransactions: 0,
        spendPerCustomer: 0,
        spendPerCustomerData: [],
        freeSubscribersData: [],
        previousPeriodFreeSubs: 0,
        freeTrialData: [],
        previousPeriodFreeTrials: 0,
        conversionRate: 0,
        previousPeriodConversionRate: 0,
        freeSubs: 0,
        renewingPayingSubs: 0,
        expiringPayingSubs: 0,
        couponRedemptions: [],
        creators: []
      })
    } finally {
      setLoading(false)
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

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const selectedCreatorStats = selectedCreator 
    ? stats?.creators.find(c => c._id === selectedCreator)
    : null

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
          <h1 className="text-4xl font-bold text-white mb-2">Sales Dashboard</h1>
          <p className="text-gray-400">Platform-wide sales analytics and individual creator performance</p>
        </div>

        {/* Creator Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            View Individual Creator Stats
          </label>
          <select
            value={selectedCreator || ''}
            onChange={(e) => setSelectedCreator(e.target.value || null)}
            className="w-full md:w-64 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Creators (Platform Total)</option>
            {stats?.creators.map((creator) => (
              <option key={creator._id} value={creator._id}>
                {creator.storefront?.displayName || creator.username || creator.email}
              </option>
            ))}
          </select>
        </div>

        {/* Analytics Cards Grid - 9 cards like creator dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* GROSS REVENUE */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Gross Revenue</h3>
              <p className="text-2xl font-bold text-white mb-2">
                {formatCurrency(selectedCreatorStats?.totalRevenue || stats?.totalRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {formatCurrency(selectedCreatorStats?.previousPeriodRevenue || stats?.previousPeriodRevenue || 0)} in previous period
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.revenueData || stats?.revenueData || []} 
                  height={48}
                  maxValue={selectedCreatorStats?.revenueData && selectedCreatorStats.revenueData.length > 0 ? Math.max(...selectedCreatorStats.revenueData, 1) : (stats?.revenueData && stats.revenueData.length > 0 ? Math.max(...stats.revenueData, 1) : 1)}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* NEW CUSTOMERS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">New Customers</h3>
              <p className="text-2xl font-bold text-white mb-2">
                {(selectedCreatorStats?.newCustomersData?.reduce((sum, val) => sum + val, 0) || stats?.newCustomersData?.reduce((sum, val) => sum + val, 0) || 0)} New Customers
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedCreatorStats?.previousPeriodCustomers || stats?.previousPeriodCustomers || 0} in previous period
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.newCustomersData || stats?.newCustomersData || []} 
                  height={48}
                  maxValue={selectedCreatorStats?.newCustomersData && selectedCreatorStats.newCustomersData.length > 0 ? Math.max(...selectedCreatorStats.newCustomersData, 1) : (stats?.newCustomersData && stats.newCustomersData.length > 0 ? Math.max(...stats.newCustomersData, 1) : 1)}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* ACTIVE SUBSCRIBERS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Active Subscribers</h3>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-3 bg-green-600 rounded shadow-lg"></div>
                  <div className="flex-1 h-3 bg-red-600 rounded shadow-lg"></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-gray-300">Active Free Subs: {selectedCreatorStats?.freeSubs || stats?.freeSubs || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span className="text-gray-300">Renewing Paying Subs: {selectedCreatorStats?.renewingPayingSubs || stats?.renewingPayingSubs || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span className="text-gray-300">Expiring Paying Subs: {selectedCreatorStats?.expiringPayingSubs || stats?.expiringPayingSubs || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TRANSACTIONS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Transactions</h3>
              <p className="text-2xl font-bold text-white mb-2">
                {(selectedCreatorStats?.transactionsData?.reduce((sum, val) => sum + val, 0) || stats?.transactionsData?.reduce((sum, val) => sum + val, 0) || 0)} Transactions
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedCreatorStats?.previousPeriodTransactions || stats?.previousPeriodTransactions || 0} in previous period
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.transactionsData || stats?.transactionsData || []} 
                  height={48}
                  maxValue={selectedCreatorStats?.transactionsData && selectedCreatorStats.transactionsData.length > 0 ? Math.max(...selectedCreatorStats.transactionsData, 1) : (stats?.transactionsData && stats.transactionsData.length > 0 ? Math.max(...stats.transactionsData, 1) : 1)}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* SPEND PER CUSTOMER */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Spend Per Customer</h3>
              <p className="text-2xl font-bold text-white mb-4">
                {formatCurrency(Math.round(selectedCreatorStats?.spendPerCustomer || stats?.spendPerCustomer || 0))}
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.spendPerCustomerData || stats?.spendPerCustomerData || []} 
                  height={48}
                  maxValue={selectedCreatorStats?.spendPerCustomerData && selectedCreatorStats.spendPerCustomerData.length > 0 ? Math.max(...selectedCreatorStats.spendPerCustomerData, 1) : (stats?.spendPerCustomerData && stats.spendPerCustomerData.length > 0 ? Math.max(...stats.spendPerCustomerData, 1) : 1)}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* COUPON REDEMPTIONS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Coupon Redemptions</h3>
              <div className="space-y-2 text-sm">
                {(selectedCreatorStats?.couponRedemptions && selectedCreatorStats.couponRedemptions.length > 0) || (stats?.couponRedemptions && stats.couponRedemptions.length > 0) ? (
                  (selectedCreatorStats?.couponRedemptions || stats?.couponRedemptions || []).map((coupon, idx) => (
                    <div key={idx} className="flex justify-between text-gray-300">
                      <span>{coupon.code}:</span>
                      <span>{coupon.uses} uses ({formatCurrency(coupon.amount)})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No coupon redemptions</p>
                )}
              </div>
            </div>
          </div>

          {/* FREE SUBSCRIBERS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Free Subscribers</h3>
              <p className="text-2xl font-bold text-white mb-2">
                {(selectedCreatorStats?.freeSubscribersData?.reduce((sum, val) => sum + val, 0) || stats?.freeSubscribersData?.reduce((sum, val) => sum + val, 0) || 0)} New Free Subscribers
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedCreatorStats?.previousPeriodFreeSubs || stats?.previousPeriodFreeSubs || 0} in previous period
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.freeSubscribersData || stats?.freeSubscribersData || []} 
                  height={48}
                  maxValue={selectedCreatorStats?.freeSubscribersData && selectedCreatorStats.freeSubscribersData.length > 0 ? Math.max(...selectedCreatorStats.freeSubscribersData, 1) : (stats?.freeSubscribersData && stats.freeSubscribersData.length > 0 ? Math.max(...stats.freeSubscribersData, 1) : 1)}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* FREE TRIAL CUSTOMERS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Free Trial Customers</h3>
              <p className="text-2xl font-bold text-white mb-2">
                {(selectedCreatorStats?.freeTrialData?.reduce((sum, val) => sum + val, 0) || stats?.freeTrialData?.reduce((sum, val) => sum + val, 0) || 0)} Customers
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedCreatorStats?.previousPeriodFreeTrials || stats?.previousPeriodFreeTrials || 0} in previous period
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.freeTrialData || stats?.freeTrialData || []} 
                  height={48}
                  maxValue={selectedCreatorStats?.freeTrialData && selectedCreatorStats.freeTrialData.length > 0 ? Math.max(...selectedCreatorStats.freeTrialData, 1) : (stats?.freeTrialData && stats.freeTrialData.length > 0 ? Math.max(...stats.freeTrialData, 1) : 1)}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* FREE TRIAL CONVERSIONS */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Free Trial Conversions</h3>
              <p className="text-2xl font-bold text-white mb-2">
                {(selectedCreatorStats?.conversionRate || stats?.conversionRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {(selectedCreatorStats?.previousPeriodConversionRate || stats?.previousPeriodConversionRate || 0).toFixed(1)}% in previous period
              </p>
              <div className="h-12">
                <LineGraph 
                  data={selectedCreatorStats?.freeTrialData && selectedCreatorStats.freeTrialData.length > 0 ? selectedCreatorStats.freeTrialData.map(() => selectedCreatorStats?.conversionRate || 0) : (stats?.freeTrialData && stats.freeTrialData.length > 0 ? stats.freeTrialData.map(() => stats?.conversionRate || 0) : [])} 
                  height={48}
                  maxValue={100}
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Creators List */}
        {!selectedCreator && (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 mb-8 shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold text-white mb-4">All Creators</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Creator</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Subscribers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Plans</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Picks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {stats?.creators.map((creator) => (
                    <tr key={creator._id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="text-white font-medium">
                            {creator.storefront?.displayName || creator.username || creator.email}
                          </p>
                          {creator.storefront?.handle && (
                            <p className="text-sm text-gray-400">@{creator.storefront.handle}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white">{creator.totalSubscribers || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white">{formatCurrency(creator.totalRevenue || 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white">{creator.activePlans || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white">{creator.totalPicks || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

