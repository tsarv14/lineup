'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'
import LineGraph from '@/components/LineGraph'

interface RecentSubscription {
  _id: string
  subscriber: {
    username: string
    email: string
    firstName?: string
    lastName?: string
  }
  plan: {
    name: string
  }
  status: string
  createdAt: string
  currentPeriodEnd: string
}

interface RecentPick {
  _id: string
  title: string
  sport?: string
  isFree: boolean
  createdAt: string
}

interface DashboardStats {
  totalSubscribers: number
  totalRevenue: number
  activePlans: number
  totalPicks: number
  recentSubscriptions: RecentSubscription[]
  recentPicks: RecentPick[]
  // Time series data
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
  // Subscriber breakdown
  freeSubs: number
  renewingPayingSubs: number
  expiringPayingSubs: number
  // Coupon redemptions
  couponRedemptions: Array<{ code: string; uses: number; amount: number }>
}

export default function CreatorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/creator/dashboard/overview')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Set empty stats on error
      setStats({
        totalSubscribers: 0,
        totalRevenue: 0,
        activePlans: 0,
        totalPicks: 0,
        recentSubscriptions: [],
        recentPicks: [],
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
        couponRedemptions: []
      })
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
        <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
        <p className="text-gray-400">Welcome back, {user?.firstName || user?.username}!</p>
      </div>

      {/* Analytics Cards Grid - 9 cards like Winible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* GROSS REVENUE */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-gray-400 text-xs font-semibold uppercase mb-3">Gross Revenue</h3>
            <p className="text-2xl font-bold text-white mb-2">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {formatCurrency(stats?.previousPeriodRevenue || 0)} in previous period
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.revenueData || []} 
                height={48}
                maxValue={stats?.revenueData && stats.revenueData.length > 0 ? Math.max(...stats.revenueData, 1) : 1}
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
              {stats?.newCustomersData?.reduce((sum, val) => sum + val, 0) || 0} New Customers
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {stats?.previousPeriodCustomers || 0} in previous period
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.newCustomersData || []} 
                height={48}
                maxValue={stats?.newCustomersData && stats.newCustomersData.length > 0 ? Math.max(...stats.newCustomersData, 1) : 1}
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
                  <span className="text-gray-300">Active Free Subs: {stats?.freeSubs || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-gray-300">Renewing Paying Subs: {stats?.renewingPayingSubs || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-gray-300">Expiring Paying Subs: {stats?.expiringPayingSubs || 0}</span>
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
              {stats?.transactionsData?.reduce((sum, val) => sum + val, 0) || 0} Transactions
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {stats?.previousPeriodTransactions || 0} in previous period
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.transactionsData || []} 
                height={48}
                maxValue={stats?.transactionsData && stats.transactionsData.length > 0 ? Math.max(...stats.transactionsData, 1) : 1}
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
              {formatCurrency(Math.round(stats?.spendPerCustomer || 0))}
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.spendPerCustomerData || []} 
                height={48}
                maxValue={stats?.spendPerCustomerData && stats.spendPerCustomerData.length > 0 ? Math.max(...stats.spendPerCustomerData, 1) : 1}
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
              {stats?.couponRedemptions && stats.couponRedemptions.length > 0 ? (
                stats.couponRedemptions.map((coupon, idx) => (
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
              {stats?.freeSubscribersData?.reduce((sum, val) => sum + val, 0) || 0} New Free Subscribers
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {stats?.previousPeriodFreeSubs || 0} in previous period
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.freeSubscribersData || []} 
                height={48}
                maxValue={stats?.freeSubscribersData && stats.freeSubscribersData.length > 0 ? Math.max(...stats.freeSubscribersData, 1) : 1}
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
              {stats?.freeTrialData?.reduce((sum, val) => sum + val, 0) || 0} Customers
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {stats?.previousPeriodFreeTrials || 0} in previous period
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.freeTrialData || []} 
                height={48}
                maxValue={stats?.freeTrialData && stats.freeTrialData.length > 0 ? Math.max(...stats.freeTrialData, 1) : 1}
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
              {(stats?.conversionRate || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {(stats?.previousPeriodConversionRate || 0).toFixed(1)}% in previous period
            </p>
            <div className="h-12">
              <LineGraph 
                data={stats?.freeTrialData && stats.freeTrialData.length > 0 ? stats.freeTrialData.map(() => stats?.conversionRate || 0) : []} 
                height={48}
                maxValue={100}
                color="#3b82f6"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/creator/dashboard/picks"
          className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all cursor-pointer hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Create New Pick</h3>
              <p className="text-sm text-gray-400">Share your latest prediction</p>
            </div>
          </div>
        </Link>

        <Link
          href="/creator/dashboard/plans"
          className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all cursor-pointer hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Create Plan</h3>
              <p className="text-sm text-gray-400">Set up a new subscription plan</p>
            </div>
          </div>
        </Link>

        <Link
          href="/creator/dashboard/store"
          className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all cursor-pointer hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Edit Store</h3>
              <p className="text-sm text-gray-400">Customize your storefront</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 mb-8 shadow-lg shadow-black/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Recent Subscriptions</h2>
          <Link
            href="/creator/dashboard/customers"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        {stats?.recentSubscriptions && stats.recentSubscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Renews</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {stats.recentSubscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-white font-medium">
                          {sub.subscriber?.firstName && sub.subscriber?.lastName
                            ? `${sub.subscriber.firstName} ${sub.subscriber.lastName}`
                            : sub.subscriber?.username || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-400">{sub.subscriber?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white">{sub.plan?.name || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sub.status === 'active'
                          ? 'bg-green-600 text-white'
                          : sub.status === 'canceled'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No subscriptions yet</p>
          </div>
        )}
      </div>

      {/* Recent Picks */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 mb-8 shadow-lg shadow-black/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Recent Picks</h2>
          <Link
            href="/creator/dashboard/picks"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        {stats?.recentPicks && stats.recentPicks.length > 0 ? (
          <div className="space-y-3">
            {stats.recentPicks.map((pick) => (
              <div key={pick._id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{pick.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {pick.sport && <span>Sport: {pick.sport}</span>}
                    <span>{pick.isFree ? 'Free' : 'Paid'}</span>
                    <span>{new Date(pick.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  href={`/creator/dashboard/picks/${pick._id}`}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No picks yet. Create your first pick!</p>
            <Link
              href="/creator/dashboard/picks"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Create Pick
            </Link>
          </div>
        )}
      </div>

             {/* Getting Started */}
             {(!stats?.totalPicks || !stats?.activePlans) && (
               <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold text-white mb-4">Getting Started</h2>
                 <div className="space-y-3">
                   {!stats?.activePlans && (
                     <div className="flex items-center space-x-4 p-4 bg-black/40 rounded-lg border border-slate-800 hover:border-primary-500/30 transition-all group">
                       <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow flex-shrink-0">
                         <span className="text-white font-bold text-lg">1</span>
                       </div>
                       <div className="flex-1">
                         <p className="text-white font-medium">Create your first subscription plan</p>
                         <p className="text-sm text-gray-400">Set up pricing and free trial options</p>
                       </div>
                       <Link
                         href="/creator/dashboard/plans"
                         className="ml-auto px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 text-sm font-semibold"
                       >
                         Create Plan
                       </Link>
                     </div>
                   )}
                   {!stats?.totalPicks && (
                     <div className="flex items-center space-x-4 p-4 bg-black/40 rounded-lg border border-slate-800 hover:border-primary-500/30 transition-all group">
                       <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow flex-shrink-0">
                         <span className="text-white font-bold text-lg">2</span>
                       </div>
                       <div className="flex-1">
                         <p className="text-white font-medium">Create your first pick</p>
                         <p className="text-sm text-gray-400">Share your sports predictions</p>
                       </div>
                       <Link
                         href="/creator/dashboard/picks"
                         className="ml-auto px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 text-sm font-semibold"
                       >
                         Create Pick
                       </Link>
                     </div>
                   )}
                 </div>
        </div>
      )}
    </div>
  )
}
