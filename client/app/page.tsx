'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Lineup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white relative">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Discover the best{' '}
            <span className="text-primary-400 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              sports picks creators
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Browse top creators, subscribe to premium picks, and get access to expert predictions. Free trials available.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/discover')}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/50 transition-all transform hover:scale-105 text-lg font-semibold border border-primary-500/50"
            >
              Browse Creators
            </button>
            <button
              onClick={() => router.push('/creator/dashboard')}
              className="px-8 py-4 bg-black/50 backdrop-blur-sm text-white border-2 border-slate-700 rounded-xl hover:border-primary-500/50 hover:bg-black/70 transition-all text-lg font-semibold"
            >
              Apply Now
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-black/50 backdrop-blur-sm text-white border-2 border-slate-700 rounded-xl hover:border-primary-500/50 hover:bg-black/70 transition-all text-lg font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
          {isAuthenticated && user && (
            <div className="text-center mt-6">
              <p className="text-gray-300">
                Welcome back, <span className="text-primary-400 font-semibold">{user.firstName || user.username}</span>!
              </p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Discover Creators</h3>
              <p className="text-gray-400">Browse thousands of verified creators and their track records.</p>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Free Trials</h3>
              <p className="text-gray-400">Try premium picks risk-free with 1, 3, or 7-day free trials.</p>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-primary-500/50 transition-all hover:shadow-glow hover:shadow-primary-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Real-time Alerts</h3>
              <p className="text-gray-400">Get instant notifications when your creators post new picks.</p>
            </div>
          </div>
        </div>

        {/* Sample Creators Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Featured Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => router.push('/creator/example')}
              className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-primary-500/50 transition-all cursor-pointer hover:shadow-glow hover:shadow-primary-500/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-glow">
                    E
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Example Creator</h3>
                    <p className="text-sm text-gray-400">Sample Profile</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">View a sample creator profile to see how Lineup works.</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary-400 font-semibold">View Example</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push('/creator/example')
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow transition-all text-sm border border-primary-500/50"
                  >
                    View Store
                  </button>
                </div>
              </div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="bg-black/20 backdrop-blur-sm rounded-xl border border-slate-800/50 p-6 opacity-50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-600 font-bold text-lg">
                    {String.fromCharCode(64 + i + 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-500">Coming Soon</h3>
                    <p className="text-sm text-gray-600">More creators</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">More creators will be available soon.</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-semibold">Coming Soon</span>
                  <button disabled className="px-4 py-2 bg-slate-900 border border-slate-800 text-gray-600 rounded-lg cursor-not-allowed text-sm">
                    View Store
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
