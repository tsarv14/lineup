'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      if (response.data && response.data.token) {
        login(response.data.token, response.data.user)
        toast.success('Welcome back!')
        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        toast.error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      })
      
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Make sure the backend is running on port 5001.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back Arrow */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
        
        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-primary-400">
                Lineup
              </h1>
            </Link>
            <p className="text-gray-400 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Test Capper: capper@lineup.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

