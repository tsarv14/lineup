'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CreatorOnboarding() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    handle: '',
    displayName: '',
    description: '',
    
    // Step 2: Branding
    logoImage: '',
    bannerImage: '',
    aboutText: '',
    aboutImage: '',
    
    // Step 3: Payout Info
    country: '',
    stripeAccountId: '',
    
    // Step 4: Social Links
    socialLinks: {
      twitter: '',
      instagram: '',
      website: ''
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('socialLinks.')) {
      const key = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [key]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Step 1: Create storefront
      await api.put('/creator/storefront', {
        handle: formData.handle.toLowerCase().replace(/\s+/g, '-'),
        displayName: formData.displayName,
        description: formData.description,
        logoImage: formData.logoImage,
        bannerImage: formData.bannerImage,
        aboutText: formData.aboutText,
        aboutImage: formData.aboutImage,
        socialLinks: formData.socialLinks
      })

      // Step 2: Set up Stripe Connect (if provided)
      if (formData.country) {
        try {
          await api.post('/stripe/connect/onboard', {
            country: formData.country
          })
        } catch (error) {
          console.error('Stripe onboarding error:', error)
          // Continue even if Stripe setup fails
        }
      }

      toast.success('Creator profile created successfully!')
      router.push('/creator/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create creator profile')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow'
                    : 'bg-black/60 border border-slate-700 text-gray-400'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Basic Info</span>
            <span>Branding</span>
            <span>Payouts</span>
            <span>Social</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 shadow-lg shadow-black/20">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                  <p className="text-gray-400 text-sm">Set up your creator profile</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Store Handle (URL) *
                </label>
                <input
                  type="text"
                  name="handle"
                  value={formData.handle}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="your-store-name"
                />
                <p className="text-xs text-gray-500">Your page will be at: lineup.com/creator/{formData.handle || 'your-handle'}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Display Name *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="Your Store Name"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none placeholder:text-gray-600"
                  placeholder="Brief description of your store..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Branding</h2>
                  <p className="text-gray-400 text-sm">Customize your storefront appearance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Logo Image URL</label>
                  <input
                    type="url"
                    name="logoImage"
                    value={formData.logoImage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Banner Image URL</label>
                  <input
                    type="url"
                    name="bannerImage"
                    value={formData.bannerImage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">About Text</label>
                  <textarea
                    name="aboutText"
                    value={formData.aboutText}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none placeholder:text-gray-600"
                    placeholder="Tell customers about yourself and your expertise..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">About Image URL</label>
                  <input
                    type="url"
                    name="aboutImage"
                    value={formData.aboutImage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="https://example.com/about.jpg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payouts */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Payout Setup</h2>
                  <p className="text-gray-400 text-sm">Connect Stripe to receive payments</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange as any}
                    required
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                  >
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>

                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                  <p className="text-sm text-primary-300">
                    <strong>Note:</strong> You'll be redirected to Stripe to complete your account setup. 
                    This allows you to receive payouts directly to your bank account. The platform takes a 10% fee on all transactions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Social Links */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Social Links</h2>
                  <p className="text-gray-400 text-sm">Connect your social media profiles</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Twitter/X URL</label>
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Instagram URL</label>
                  <input
                    type="url"
                    name="socialLinks.instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Website URL</label>
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={formData.socialLinks.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-slate-600 font-semibold"
                >
                  Previous
                </button>
              )}
            </div>
            <div className="flex gap-4">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

