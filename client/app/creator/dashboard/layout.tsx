'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

const menuItems = [
  { 
    href: '/creator/dashboard', 
    label: 'Overview', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/store', 
    label: 'Your Store', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/affiliates', 
    label: 'Affiliates', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/links', 
    label: 'Links', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/picks', 
    label: 'My Picks', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/plans', 
    label: 'Subscription Plans', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/customers', 
    label: 'Customers', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  { 
    href: '/creator/dashboard/payments', 
    label: 'Payments', 
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
]

export default function CreatorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return
    }
    // Check if user is a creator
    if (!loading && isAuthenticated && user && !user.roles?.includes('creator')) {
      router.push('/')
    }
  }, [isAuthenticated, loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user?.roles?.includes('creator')) {
    return null
  }

  // Determine the creator's public storefront link
  const creatorStorefrontLink = (user as any)?.storefront?.handle ? `/creator/${(user as any).storefront.handle}` : '/creator/dashboard/store'

  return (
    <div className="min-h-screen bg-black">
      {/* Top Navbar */}
      <nav className="bg-black/60 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/" 
              className="flex items-center cursor-pointer group"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent group-hover:from-primary-300 group-hover:to-primary-500 transition-all">
                Lineup Creator
              </h1>
            </Link>
            <div className="flex items-center space-x-3">
              {(user as any)?.storefront?.handle && (
                <a
                  href={`https://lineup.com/creator/${(user as any).storefront.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-black/40 rounded-lg transition-all border border-transparent hover:border-slate-700 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Site
                </a>
              )}
              <Link
                href={`/creator/dashboard/preview`}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 text-sm font-semibold"
              >
                Customer View
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-black/60 backdrop-blur-xl border-r border-slate-800/50 min-h-[calc(100vh-4rem)] sticky top-16 shadow-lg shadow-black/20">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || 
                               (item.href !== '/creator/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-black/40 border border-transparent hover:border-slate-700'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent"></div>
                  )}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg ${
                    isActive 
                      ? 'bg-white/10' 
                      : 'bg-black/40 group-hover:bg-primary-500/10'
                  } transition-all`}>
                    {item.icon(isActive)}
                  </div>
                  <span className={`relative z-10 font-medium text-sm ${
                    isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 relative">
          {/* Decorative background shapes */}
          <div className="decorative-shape decorative-shape-1"></div>
          <div className="decorative-shape decorative-shape-2"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

