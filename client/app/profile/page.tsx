'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  _id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
}

interface Post {
  _id: string
  author: {
    _id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  content: string
  images: string[]
  likes: any[]
  comments: any[]
  createdAt: string
}

export default function Profile() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading, checkAuth } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      fetchProfile()
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (user?._id) {
      fetchUserPosts()
    }
  }, [user?._id])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        bio: response.data.bio || ''
      })
    } catch (error: any) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    if (!user?._id) return
    
    try {
      const response = await api.get('/posts')
      const postsResponse: Post[] = Array.isArray(response?.data?.posts) ? response.data.posts : []
      const userPosts = postsResponse.filter((post: Post) => post?.author?._id === user._id)
      setPosts(userPosts)
    } catch (error: any) {
      toast.error('Failed to load posts')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.put(`/users/${user?._id}`, formData)
      setUser(response.data)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update profile')
    }
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.username || 'User'

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              {user?.avatar ? (
                <img src={user.avatar} alt={userName} className="w-24 h-24 rounded-full" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{userName}</h1>
                <p className="text-gray-400">@{user?.username}</p>
                <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder-gray-400"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/500</p>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div>
              {user?.bio && (
                <p className="text-gray-300 mt-4">{user.bio}</p>
              )}
            </div>
          )}
        </div>

        {/* User Posts */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">My Posts</h2>
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-gray-400">No posts yet. Start sharing!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id}
                  onDelete={handlePostDeleted}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

