'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface PostCardProps {
  post: {
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
  currentUserId?: string
  onDelete?: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.likes.some(like => like._id === currentUserId))
  const [likes, setLikes] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState(post.comments)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    try {
      const response = await api.post(`/posts/${post._id}/like`)
      setIsLiked(response.data.liked)
      setLikes(response.data.likes)
    } catch (error: any) {
      toast.error('Failed to like post')
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setLoading(true)
    try {
      const response = await api.post(`/posts/${post._id}/comments`, {
        content: commentText
      })
      setComments([...comments, response.data])
      setCommentText('')
      toast.success('Comment added!')
    } catch (error: any) {
      toast.error('Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      await api.delete(`/posts/${post._id}`)
      toast.success('Post deleted')
      onDelete?.(post._id)
    } catch (error: any) {
      toast.error('Failed to delete post')
    }
  }

  const authorName = post.author.firstName && post.author.lastName
    ? `${post.author.firstName} ${post.author.lastName}`
    : post.author.username

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={authorName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
              {post.author.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{authorName}</p>
            <p className="text-sm text-gray-500">@{post.author.username}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
          {currentUserId === post.author._id && (
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.images && post.images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {post.images.map((image, index) => (
            <img key={index} src={image} alt={`Post image ${index + 1}`} className="rounded-lg w-full h-48 object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likes.length}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4 mb-4">
            {comments.map((comment, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-semibold">
                  {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {comment.author?.firstName && comment.author?.lastName
                      ? `${comment.author.firstName} ${comment.author.lastName}`
                      : comment.author?.username || 'Unknown'}
                  </p>
                  <p className="text-gray-700">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleComment} className="flex space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !commentText.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

