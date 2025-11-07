'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import SportIcon from '@/components/SportIcon'

export default function ExampleCreatorPage() {
  // Sample data - all blank/placeholder as requested
  const sampleStorefront = {
    displayName: 'Example Creator',
    handle: 'example',
    logoImage: '',
    bannerImage: '',
    aboutText: '',
    aboutImage: '',
    sports: [],
    socialLinks: {
      twitter: '',
      instagram: '',
      website: ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      {/* Header with Logo and Action Buttons */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {sampleStorefront.logoImage ? (
                <img src={sampleStorefront.logoImage} alt={`${sampleStorefront.displayName} logo`} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
                  {sampleStorefront.displayName.charAt(0)}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{sampleStorefront.displayName}</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/creator/example/picks"
                className="text-white hover:text-primary-400 transition-colors font-medium text-sm sm:text-base"
              >
                See Picks
              </Link>
              <Link
                href="/creator/example/plans"
                className="bg-white text-slate-900 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm sm:text-base"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative h-64 w-full overflow-hidden">
        {sampleStorefront.bannerImage ? (
          <img src={sampleStorefront.bannerImage} alt={`${sampleStorefront.displayName} banner`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-800"></div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* About Us Section */}
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">ABOUT US</h2>
            {sampleStorefront.aboutText ? (
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{sampleStorefront.aboutText}</p>
            ) : (
              <div className="space-y-4">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700 rounded w-4/6"></div>
                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700 rounded w-3/6"></div>
              </div>
            )}
          </div>

          {/* Large Logo/Image Section */}
          <div className="flex items-center justify-center">
            {sampleStorefront.aboutImage ? (
              <img src={sampleStorefront.aboutImage} alt={`About ${sampleStorefront.displayName}`} className="w-full max-w-md rounded-lg" />
            ) : (
              <div className="w-full max-w-md aspect-square rounded-lg bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                <div className="text-9xl font-bold text-primary-400/20">
                  {sampleStorefront.displayName.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Picks Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">RECENT PICKS</h2>
          
          {/* Sport Filter Buttons */}
          {sampleStorefront.sports && sampleStorefront.sports.length > 0 ? (
            <div className="flex flex-wrap gap-3 mb-8">
              {sampleStorefront.sports.map((sport) => (
                <button
                  key={sport}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-full hover:border-primary-500 transition-colors flex items-center space-x-2"
                >
                  <SportIcon sport={sport} className="w-5 h-5" />
                  <span className="font-medium">{(sport as string).toUpperCase()}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 mb-8">
              {['FOOTBALL', 'COLLEGE FOOTBALL', 'BASEBALL', 'BASKETBALL', 'GOLF', 'SOCCER'].map((sport) => (
                <button
                  key={sport}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-full hover:border-primary-500 transition-colors"
                >
                  {sport}
                </button>
              ))}
            </div>
          )}

          {/* Picks Placeholder */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 min-h-[400px]">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-400 text-lg">Picks will appear here</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-4">HOW IT WORKS</h2>
          <p className="text-gray-300 text-center max-w-3xl mx-auto mb-12 text-lg">
            We partner with <span className="font-semibold text-primary-400">Lineup</span> to deliver you our picks in realtime. Join us and other trusted cappers on the premier platform for sports content.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">SUBSCRIBE TO A PLAN</h3>
              <p className="text-gray-400">
                Find the right subscription plan and leverage our expertise to do the research for you - you can unsubscribe any time!
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">RECEIVE PLAYS ON YOUR PHONE</h3>
              <p className="text-gray-400">
                Plays will be sent directly to your phone via text or email (up to you) the second we upload them
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H1m12 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">TAIL OUR PICKS</h3>
              <p className="text-gray-400">
                Join the action and place the bets at your favorite sports book. Let's win together!
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
