'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  _id: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
}

export default function Connections() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [connections, setConnections] = useState<User[]>([])
  const [requests, setRequests] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'discover'>('connections')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      fetchConnections()
      fetchRequests()
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (activeTab === 'discover' && searchQuery) {
      searchUsers()
    }
  }, [searchQuery, activeTab])

  const fetchConnections = async () => {
    try {
      const response = await api.get('/connections')
      setConnections(response.data)
    } catch (error: any) {
      toast.error('Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await api.get('/connections/requests')
      setRequests(response.data)
    } catch (error: any) {
      toast.error('Failed to load requests')
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setAllUsers([])
      return
    }

    try {
      const response = await api.get(`/users?search=${encodeURIComponent(searchQuery)}`)
      setAllUsers(response.data.users)
    } catch (error: any) {
      toast.error('Failed to search users')
    }
  }

  const handleSendRequest = async (userId: string) => {
    try {
      await api.post(`/connections/request/${userId}`)
      toast.success('Connection request sent!')
      searchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request')
    }
  }

  const handleAcceptRequest = async (userId: string) => {
    try {
      await api.post(`/connections/accept/${userId}`)
      toast.success('Connection accepted!')
      fetchConnections()
      fetchRequests()
    } catch (error: any) {
      toast.error('Failed to accept request')
    }
  }

  const handleRejectRequest = async (userId: string) => {
    try {
      await api.post(`/connections/reject/${userId}`)
      toast.success('Request rejected')
      fetchRequests()
    } catch (error: any) {
      toast.error('Failed to reject request')
    }
  }

  const handleRemoveConnection = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return

    try {
      await api.delete(`/connections/${userId}`)
      toast.success('Connection removed')
      fetchConnections()
    } catch (error: any) {
      toast.error('Failed to remove connection')
    }
  }

  const getUserName = (user: User) => {
    return user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Connections</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'connections'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'discover'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Discover
          </button>
        </div>

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {connections.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-gray-400">No connections yet. Start connecting with people!</p>
              </div>
            ) : (
              connections.map((user) => (
                <div key={user._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={getUserName(user)} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{getUserName(user)}</p>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      {user.bio && <p className="text-sm text-gray-300 mt-1">{user.bio}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveConnection(user._id)}
                    className="px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-gray-400">No pending requests</p>
              </div>
            ) : (
              requests.map((user) => (
                <div key={user._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={getUserName(user)} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{getUserName(user)}</p>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      {user.bio && <p className="text-sm text-gray-300 mt-1">{user.bio}</p>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(user._id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(user._id)}
                      className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div className="space-y-4">
              {allUsers.length === 0 && searchQuery ? (
                <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                  <p className="text-gray-400">No users found</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                  <p className="text-gray-400">Search for users to connect with</p>
                </div>
              ) : (
                allUsers.map((user) => (
                  <div key={user._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {user.avatar ? (
                        <img src={user.avatar} alt={getUserName(user)} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{getUserName(user)}</p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                        {user.bio && <p className="text-sm text-gray-300 mt-1">{user.bio}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user._id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

