'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

interface Customer {
  _id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  subscription: {
    plan: string
    status: string
    currentPeriodEnd: string
  }
}

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      // Get all subscriptions for this creator
      const response = await api.get('/subscriptions')
      const subscriptions = response.data || []
      
      // Transform subscriptions into customer list
      const customersMap = new Map()
      subscriptions.forEach((sub: any) => {
        if (sub.creator?._id === user?._id || sub.creator === user?._id) {
          const customerId = sub.subscriber?._id || sub.subscriber
          if (!customersMap.has(customerId)) {
            customersMap.set(customerId, {
              _id: customerId,
              username: sub.subscriber?.username || 'Unknown',
              email: sub.subscriber?.email || '',
              firstName: sub.subscriber?.firstName,
              lastName: sub.subscriber?.lastName,
              subscription: {
                plan: sub.plan?.name || 'Unknown',
                status: sub.status,
                currentPeriodEnd: sub.currentPeriodEnd
              }
            })
          }
        }
      })
      
      setCustomers(Array.from(customersMap.values()))
    } catch (error) {
      console.error('Error fetching customers:', error)
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Customers</h1>
            <p className="text-gray-400 mt-1">View and manage your subscribers</p>
          </div>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2 font-medium">No customers yet</p>
            <p className="text-gray-500 mb-6">Share your storefront to start getting subscribers</p>
          </div>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Renews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-black/40 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-glow">
                          {customer.firstName?.charAt(0) || customer.username?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {customer.firstName && customer.lastName
                              ? `${customer.firstName} ${customer.lastName}`
                              : customer.username}
                          </p>
                          <p className="text-sm text-gray-400">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">{customer.subscription.plan}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        customer.subscription.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {customer.subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(customer.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
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

