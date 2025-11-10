'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'

interface Creator {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  username: string
  storefront?: {
    _id: string
    handle: string
    displayName: string
    description?: string
    logoImage?: string
    bannerImage?: string
  }
}

export default function Discover() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreators()
  }, [])

  const fetchCreators = async () => {
    try {
      const response = await api.get('/creators')
      // All creators returned should have storefronts (API now returns storefronts directly)
      setCreators(response.data || [])
    } catch (error) {
      console.error('Error fetching creators:', error)
      setCreators([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Creators</h1>
          <p className="text-gray-400 mb-6">
            Browse all approved creators and discover their picks
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : creators.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No creators available yet</p>
            <p className="text-gray-500 text-sm">Check back soon for new creators!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Link
                key={creator._id}
                href={`/creator/${creator.storefront?.handle}`}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-primary-500/50 transition-all group"
              >
                <div className="text-center">
                  {creator.storefront?.logoImage ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src={creator.storefront.logoImage}
                        alt={creator.storefront.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                      {creator.storefront?.displayName?.charAt(0) || creator.username?.charAt(0) || 'C'}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {creator.storefront?.displayName || creator.username}
                  </h2>
                  {creator.storefront?.handle && (
                    <p className="text-primary-400 text-sm mb-3">@{creator.storefront.handle}</p>
                  )}
                  {creator.storefront?.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {creator.storefront.description}
                    </p>
                  )}
                  <span className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm inline-block">
                    View Creator Profile
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

