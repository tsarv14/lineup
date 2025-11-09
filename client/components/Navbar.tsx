'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = () => {
    logout()
  }

  // Show navbar on all pages except login/register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  // If not authenticated, show login/register buttons
  if (!isAuthenticated) {
    return (
      <nav className="bg-black/60 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center group">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent group-hover:from-primary-300 group-hover:to-primary-500 transition-all">
                Lineup
              </h1>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/discover"
                className="px-3 sm:px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 transition-all text-sm sm:text-base border border-transparent hover:border-slate-700"
              >
                Discover
              </Link>
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-black/40 transition-all text-sm sm:text-base border border-transparent hover:border-slate-700"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all text-sm sm:text-base border border-primary-500/50 font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-black/60 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center group">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent group-hover:from-primary-300 group-hover:to-primary-500 transition-all">
              Lineup
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname === '/dashboard' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/discover"
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname === '/discover' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
              }`}
            >
              Discover
            </Link>
            <Link
              href="/my-subscriptions"
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname === '/my-subscriptions' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
              }`}
            >
              My Subscriptions
            </Link>
            <Link
              href="/my-picks"
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname === '/my-picks' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
              }`}
            >
              My Picks
            </Link>
            <Link
              href="/creator/dashboard"
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname?.startsWith('/creator/dashboard') 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
              }`}
            >
              Creator Dashboard
            </Link>
            <Link
              href="/profile"
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname === '/profile' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
              }`}
            >
              Profile
            </Link>

                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-black/40 transition-all border border-transparent hover:border-slate-700"
                      aria-label="User menu"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username || 'User'} className="w-8 h-8 rounded-full border-2 border-primary-500/50" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-glow border-2 border-primary-400/30">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </button>

                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl rounded-lg shadow-glow border border-slate-800 py-2 z-20">
                          <Link
                            href="/profile"
                            onClick={() => setShowMenu(false)}
                            className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-black/60 transition-all"
                          >
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              setShowMenu(false)
                              handleLogout()
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-black/60 transition-all"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username || 'User'} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 z-20">
                    <Link
                      href="/profile"
                      onClick={() => setShowMenu(false)}
                      className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleLogout()
                      }}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-slate-700 py-4 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Home
            </Link>
                   <Link
                     href="/discover"
                     onClick={() => setShowMobileMenu(false)}
                     className={`block px-4 py-2 rounded-lg transition-all ${
                       pathname === '/discover' 
                         ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                         : 'text-gray-300 hover:text-white hover:bg-black/40'
                     }`}
                   >
                     Discover
                   </Link>
                   <Link
                     href="/my-subscriptions"
                     onClick={() => setShowMobileMenu(false)}
                     className={`block px-4 py-2 rounded-lg transition-all ${
                       pathname === '/my-subscriptions' 
                         ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                         : 'text-gray-300 hover:text-white hover:bg-black/40'
                     }`}
                   >
                     My Subscriptions
                   </Link>
                   <Link
                     href="/my-picks"
                     onClick={() => setShowMobileMenu(false)}
                     className={`block px-4 py-2 rounded-lg transition-all ${
                       pathname === '/my-picks' 
                         ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                         : 'text-gray-300 hover:text-white hover:bg-black/40'
                     }`}
                   >
                     My Picks
                   </Link>
                   <Link
                     href="/creator/dashboard"
                     onClick={() => setShowMobileMenu(false)}
                     className={`block px-4 py-2 rounded-lg transition-all ${
                       pathname?.startsWith('/creator/dashboard') 
                         ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                         : 'text-gray-300 hover:text-white hover:bg-black/40'
                     }`}
                   >
                     Creator Dashboard
                   </Link>
                   <Link
                     href="/profile"
                     onClick={() => setShowMobileMenu(false)}
                     className={`block px-4 py-2 rounded-lg transition-all ${
                       pathname === '/profile' 
                         ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30' 
                         : 'text-gray-300 hover:text-white hover:bg-black/40'
                     }`}
                   >
                     Profile
                   </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

