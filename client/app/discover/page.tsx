'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Discover() {

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Creators</h1>
          <p className="text-gray-400 mb-6">
            View a sample creator profile to see all features
          </p>
        </div>

        {/* Sample Creator Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              E
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Example Creator</h2>
            <p className="text-gray-400 mb-6">View a sample creator profile to see all features</p>
            <Link
              href="/creator/example"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg"
            >
              View Sample Creator Profile
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

