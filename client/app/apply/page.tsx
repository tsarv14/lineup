'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ApplyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingHandle, setCheckingHandle] = useState(false)
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [formData, setFormData] = useState({
    handle: '',
    displayName: '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    socialLinks: {
      twitter: '',
      instagram: '',
      website: '',
      tiktok: '',
      youtube: ''
    },
    experience: '',
    whyCreator: '',
    sports: [] as string[]
  })

  useEffect(() => {
    // Pre-fill form if user is logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      }))
    }
  }, [user])

  const checkHandleAvailability = async (handle: string) => {
    if (!handle || handle.length < 3) {
      setHandleAvailable(null)
      return
    }

    const normalizedHandle = handle.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
    if (normalizedHandle !== handle.toLowerCase().trim()) {
      setHandleAvailable(false)
      return
    }

    setCheckingHandle(true)
    try {
      const response = await api.get(`/applications/check-handle/${normalizedHandle}`)
      setHandleAvailable(response.data.available)
    } catch (error) {
      console.error('Error checking handle:', error)
      setHandleAvailable(null)
    } finally {
      setCheckingHandle(false)
    }
  }

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData(prev => ({ ...prev, handle: value }))
    
    // Debounce handle check
    const timeoutId = setTimeout(() => {
      checkHandleAvailability(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  const handleSportToggle = (sport: string) => {
    setFormData(prev => {
      const currentSports = prev.sports || []
      if (currentSports.includes(sport)) {
        return { ...prev, sports: currentSports.filter(s => s !== sport) }
      } else {
        return { ...prev, sports: [...currentSports, sport] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/applications', formData)
      toast.success('Application submitted successfully! We will review it and get back to you soon.')
      router.push('/')
    } catch (error: any) {
      console.error('Submit application error:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.response?.data?.errors) {
        const firstError = error.response.data.errors[0]
        toast.error(firstError.msg || 'Please check your form and try again')
      } else {
        toast.error('Failed to submit application. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const availableSports = [
    'Football',
    'College Football',
    'Baseball',
    'Basketball',
    'Golf',
    'Soccer',
    'Hockey',
    'Tennis',
    'MMA',
    'Boxing',
    'Racing',
    'Other'
  ]

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Apply to Become a Creator</h1>
          <p className="text-gray-400">Fill out the form below to apply for creator status on Lineup</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Handle/URL Slug */}
          <div>
            <label htmlFor="handle" className="block text-sm font-medium text-gray-300 mb-2">
              URL Slug (Creator Name) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                lineup.com/creator/
              </span>
              <input
                type="text"
                id="handle"
                name="handle"
                value={formData.handle}
                onChange={handleHandleChange}
                required
                minLength={3}
                maxLength={30}
                className="w-full pl-40 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="your-creator-name"
              />
            </div>
            {formData.handle && (
              <div className="mt-2">
                {checkingHandle ? (
                  <p className="text-sm text-gray-400">Checking availability...</p>
                ) : handleAvailable === true ? (
                  <p className="text-sm text-green-400">✓ This handle is available</p>
                ) : handleAvailable === false ? (
                  <p className="text-sm text-red-400">✗ This handle is already taken</p>
                ) : null}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Only lowercase letters, numbers, and hyphens. This will be your unique URL.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
              maxLength={100}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Your Creator Name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Social Media Links (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowSocialModal(true)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg hover:border-primary-500 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Social Links
            </button>
            {/* Display added social links */}
            {(formData.socialLinks.twitter || formData.socialLinks.instagram || formData.socialLinks.website || formData.socialLinks.tiktok || formData.socialLinks.youtube) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.socialLinks.twitter && (
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2">
                    Twitter
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: '' } }))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {formData.socialLinks.instagram && (
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2">
                    Instagram
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: '' } }))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {formData.socialLinks.website && (
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2">
                    Website
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: '' } }))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {formData.socialLinks.tiktok && (
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2">
                    TikTok
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, tiktok: '' } }))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {formData.socialLinks.youtube && (
                  <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2">
                    YouTube
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: '' } }))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Social Links Modal */}
          {showSocialModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Add Social Media Links</h3>
                  <button
                    type="button"
                    onClick={() => setShowSocialModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X URL</label>
                    <input
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                      placeholder="https://twitter.com/yourhandle"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instagram URL</label>
                    <input
                      type="url"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                    <input
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">TikTok URL</label>
                    <input
                      type="url"
                      value={formData.socialLinks.tiktok}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, tiktok: e.target.value } }))}
                      placeholder="https://tiktok.com/@yourhandle"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">YouTube URL</label>
                    <input
                      type="url"
                      value={formData.socialLinks.youtube}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                      placeholder="https://youtube.com/@yourhandle"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSocialModal(false)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-300 mb-2">
              Your Experience & Background <span className="text-red-400">*</span>
            </label>
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell us about your experience in sports betting, analytics, or content creation..."
            />
            <p className="mt-1 text-xs text-gray-500">{formData.experience.length}/2000 characters</p>
          </div>

          {/* Why Creator */}
          <div>
            <label htmlFor="whyCreator" className="block text-sm font-medium text-gray-300 mb-2">
              Why Do You Want to Be a Creator? <span className="text-red-400">*</span>
            </label>
            <textarea
              id="whyCreator"
              name="whyCreator"
              value={formData.whyCreator}
              onChange={(e) => setFormData(prev => ({ ...prev, whyCreator: e.target.value }))}
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="What makes you unique? Why should we approve your application?"
            />
            <p className="mt-1 text-xs text-gray-500">{formData.whyCreator.length}/2000 characters</p>
          </div>

          {/* Sports */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Sports You Specialize In (Optional)
            </label>
            <div className="flex flex-wrap gap-3">
              {availableSports.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => handleSportToggle(sport)}
                  className={`px-4 py-2 rounded-full transition-colors text-sm font-medium border ${
                    formData.sports.includes(sport)
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-gray-300 hover:border-primary-500'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || handleAvailable === false || checkingHandle}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

