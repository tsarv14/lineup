'use client'

import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface CreatePostProps {
  onPostCreated: (post: any) => void
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Please enter some content')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/posts', { content })
      onPostCreated(response.data)
      setContent('')
      toast.success('Post created successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{content.length}/2000</span>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}

