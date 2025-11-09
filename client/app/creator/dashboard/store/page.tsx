'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

interface Plan {
  _id: string
  name: string
  description?: string
  isFree: boolean
  billingVariants: Array<{
    _id: string
    interval: string
    priceCents: number
  }>
  freeTrialDays: number
}

export default function StorePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [storefront, setStorefront] = useState<any>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    handle: '',
    displayName: '',
    description: '',
    logoImage: '',
    bannerImage: '',
    aboutText: '',
    aboutImage: '',
    sports: [] as string[],
    socialLinks: {
      twitter: '',
      instagram: '',
      website: ''
    }
  })

  useEffect(() => {
    fetchStorefront()
    fetchPlans()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingSection) {
        setEditingSection(null)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && editingSection) {
        e.preventDefault()
        handleSave(editingSection)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingSection, formData])

  const fetchStorefront = async () => {
    try {
      const response = await api.get('/creator/storefront')
      if (response.data) {
        setStorefront(response.data)
        setFormData({
          handle: response.data.handle || '',
          displayName: response.data.displayName || '',
          description: response.data.description || '',
          logoImage: response.data.logoImage || '',
          bannerImage: response.data.bannerImage || '',
          aboutText: response.data.aboutText || '',
          aboutImage: response.data.aboutImage || '',
          sports: response.data.sports || [],
          socialLinks: {
            twitter: response.data.socialLinks?.twitter || '',
            instagram: response.data.socialLinks?.instagram || '',
            website: response.data.socialLinks?.website || ''
          }
        })
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('No storefront found - user can create one')
      } else {
        console.error('Error fetching storefront:', error)
        toast.error('Failed to load storefront')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await api.get('/creator/plans')
      setPlans(response.data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleSave = async (section?: string) => {
    try {
      if (!formData.handle || !formData.displayName) {
        toast.error('Handle and display name are required')
        return
      }
      
      const response = await api.put('/creator/storefront', formData)
      setStorefront(response.data)
      if (section) {
        setEditingSection(null)
      }
      toast.success(section ? `${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!` : 'Storefront updated successfully!')
      await fetchStorefront()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to update storefront')
    }
  }

  const handleFileUpload = async (field: 'logoImage' | 'bannerImage' | 'aboutImage', file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(field)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('image', file)

      const response = await api.post('/upload/image', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = response.data.url
      setFormData(prev => ({ ...prev, [field]: imageUrl }))
      toast.success('Image uploaded successfully!')
      // Auto-save after upload
      await handleSave()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(null)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getIntervalText = (interval: string) => {
    if (interval === 'day') return 'day'
    if (interval === 'week') return 'week'
    if (interval === 'month') return 'month'
    if (interval === 'year') return 'year'
    return interval
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Edit Mode Banner */}
      {editingSection && (
        <div className="bg-primary-600/20 border-b border-primary-500/30 px-4 py-2 text-center backdrop-blur-sm sticky top-0 z-50">
          <p className="text-sm text-primary-300">
            <span className="font-semibold">Editing:</span> {editingSection.charAt(0).toUpperCase() + editingSection.slice(1)} • 
            <button onClick={() => handleSave(editingSection)} className="ml-2 underline hover:text-primary-200">Save</button> • 
            <button onClick={() => setEditingSection(null)} className="ml-2 underline hover:text-primary-200">Cancel</button>
            <span className="ml-4 text-xs">Press Ctrl+S to quick save or Esc to cancel</span>
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="pt-8 pb-6 relative group">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {editingSection === 'logo' ? (
                  <div className="w-full h-full bg-slate-800 border-2 border-primary-500 flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('logoImage', e.target.files[0])}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer text-white text-xs text-center px-3 py-2 bg-primary-600 rounded hover:bg-primary-700">
                      {uploading === 'logoImage' ? 'Uploading...' : 'Upload Logo'}
                    </label>
                  </div>
                ) : formData.logoImage ? (
                  <Image
                    src={formData.logoImage}
                    alt="Storefront Logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                    {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                {editingSection === 'info' ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="Handle (URL slug)"
                      className="text-white text-sm bg-slate-800 border border-primary-500 rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Display Name"
                      className="text-white text-xl font-semibold bg-slate-800 border border-primary-500 rounded px-3 py-2"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-white text-xl font-semibold">{formData.displayName || 'Your Store Name'}</p>
                    {formData.handle && (
                      <p className="text-gray-400 text-sm">@{formData.handle}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={formData.handle ? `/creator/${formData.handle}/picks` : '#'}
                  className="px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-medium">See Picks</p>
                </Link>
                {formData.socialLinks?.twitter && (
                  <a
                    href={formData.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5 text-white">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                    </svg>
                  </a>
                )}
              </div>
            </div>
            {plans.length > 0 && (
              <button className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2">
                Subscribe
                <span className="text-sm font-normal text-gray-600">
                  {plans[0].billingVariants.length > 0
                    ? `${formatPrice(plans[0].billingVariants[0].priceCents)} per ${getIntervalText(plans[0].billingVariants[0].interval)}`
                    : 'Select Plan'}
                </span>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
                </svg>
              </button>
            )}
          </div>
          {/* Edit buttons for header section */}
          {editingSection !== 'logo' && editingSection !== 'info' && (
            <div className="absolute top-0 right-0 flex gap-2 z-10">
              <button
                onClick={() => setEditingSection('logo')}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Edit Logo
              </button>
              <button
                onClick={() => setEditingSection('info')}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Info
              </button>
            </div>
          )}
        </div>

        {/* Banner Section */}
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden group">
          {editingSection === 'banner' ? (
            <div className="w-full h-full bg-slate-800 border-2 border-primary-500 flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('bannerImage', e.target.files[0])}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cursor-pointer text-white px-4 py-2 bg-primary-600 rounded hover:bg-primary-700">
                {uploading === 'bannerImage' ? 'Uploading...' : 'Upload Banner Image'}
              </label>
            </div>
          ) : formData.bannerImage ? (
            <>
              <Image
                src={formData.bannerImage}
                alt="Storefront Banner"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-800"></div>
          )}
          {editingSection !== 'banner' && (
            <button
              onClick={() => setEditingSection('banner')}
              className="absolute top-4 right-4 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-700 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Edit Banner
            </button>
          )}
        </div>

        {/* Storefront Info Section */}
        <div className="mb-12 relative group">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                {formData.logoImage ? (
                  <Image
                    src={formData.logoImage}
                    alt="Store Logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                    {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white text-2xl font-bold">{formData.displayName || 'Your Store Name'}</p>
                {formData.handle && (
                  <p className="text-gray-400 text-sm">@{formData.handle}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="relative group/desc">
              {editingSection === 'description' ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full text-white text-lg font-semibold bg-slate-800 border border-primary-500 rounded px-3 py-2"
                  rows={2}
                />
              ) : (
                <>
                  <p className="text-white text-lg font-semibold">
                    {formData.description || 'The best picks from the best experts'}
                  </p>
                  <button
                    onClick={() => setEditingSection('description')}
                    className="absolute -right-12 top-0 px-2 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1 border border-slate-700"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </>
              )}
            </div>
            <div className="relative group/about-text">
              {editingSection === 'about' ? (
                <textarea
                  value={formData.aboutText}
                  onChange={(e) => setFormData(prev => ({ ...prev, aboutText: e.target.value }))}
                  placeholder="About text"
                  className="w-full text-gray-400 text-base bg-slate-800 border border-primary-500 rounded px-3 py-2"
                  rows={4}
                />
              ) : (
                <>
                  <p className="text-gray-400 text-base">
                    {formData.aboutText || 'Where sports bettors become winners. Let\'s win more together. Subscribe today!'}
                  </p>
                  <button
                    onClick={() => setEditingSection('about')}
                    className="absolute -right-12 top-0 px-2 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1 border border-slate-700"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {plans.length > 0 && (
              <div className="flex gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    Subscribe
                    <span className="block text-xs font-normal mt-1">
                      {plan.billingVariants.length > 0
                        ? `${formatPrice(plan.billingVariants[0].priceCents)} per ${getIntervalText(plan.billingVariants[0].interval)}`
                        : 'Select Plan'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Link
                href={formData.handle ? `/creator/${formData.handle}/picks` : '#'}
                className="px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium">See Picks</p>
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium">Login</p>
              </Link>
              {editingSection === 'social' ? (
                <input
                  type="text"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                  placeholder="Twitter URL"
                  className="px-3 py-2 bg-slate-800 border border-primary-500 rounded text-white text-sm"
                />
              ) : formData.socialLinks?.twitter ? (
                <a
                  href={formData.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5 text-white">
                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                  </svg>
                </a>
              ) : null}
              {editingSection !== 'social' && (
                <button
                  onClick={() => setEditingSection('social')}
                  className="px-2 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1 border border-slate-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Social
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Plans Section */}
        {plans.length > 0 && (
          <div id="subscription-plans" className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {plans.slice(0, 3).map((plan) => (
                <div key={plan._id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <div className="mb-4">
                    <p className="text-white text-xl font-semibold mb-2">{plan.name}</p>
                    {plan.freeTrialDays > 0 && (
                      <p className="text-primary-400 text-sm">{plan.freeTrialDays} day Free Trial</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white text-3xl font-bold">
                        {plan.billingVariants.length > 0 ? formatPrice(plan.billingVariants[0].priceCents) : 'N/A'}
                      </p>
                    </div>
                    {plan.description && (
                      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    )}
                  </div>
                  <Link
                    href={formData.handle ? `/creator/${formData.handle}/subscribe/${plan._id}` : '#'}
                    className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Subscribe
                  </Link>
                </div>
              ))}
            </div>
            {plans.length > 3 && (
              <div className="text-center">
                <Link
                  href={formData.handle ? `/creator/${formData.handle}/plans` : '#'}
                  className="inline-block px-6 py-3 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-medium">View All Plans</p>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* How It Works Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <p className="text-white text-3xl font-bold mb-4">How It Works</p>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              We partner with <span className="text-primary-400 font-semibold">Lineup</span> to deliver you our picks in realtime. Join us and other trusted cappers on the premier platform for sports content.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="40" fill="#0A0A0A"></circle>
                  <path fill="#C3A249" d="M47.949 49.705a.938.938 0 1 0 0-1.875.938.938 0 0 0 0 1.875ZM47.949 39.982a.937.937 0 1 0 0-1.875.937.937 0 0 0 0 1.875ZM51.079 49.705a.938.938 0 1 0 0-1.875.938.938 0 0 0 0 1.875ZM48.182 34.678H43.81a.938.938 0 0 0 0 1.875h4.373a.938.938 0 0 0 0-1.875Z"></path>
                  <path fill="#C3A249" d="M33.455 51.669c-1.851.615-3.74-.315-4.487-1.826-.323-.652.136-1.42.863-1.42h.197c.378 0 .678.258.826.607.237.561.794.956 1.44.956.861 0 1.562-.7 1.562-1.562 0-.826-.644-1.504-1.455-1.559-1.532-.104-2.97-.947-3.397-2.424a3.447 3.447 0 0 1 3.288-4.455c1.474 0 2.793.933 3.307 2.237.227.576-.224 1.2-.844 1.2h-.196c-.379 0-.678-.26-.825-.608a1.564 1.564 0 0 0-3.002.608c0 .86.702 1.563 1.563 1.563a3.448 3.448 0 0 1 3.281 4.485 3.347 3.347 0 0 1-2.118 2.198h-.003Z"></path>
                  <path fill="#C3A249" d="M31.356 40.922v-1.464a.937.937 0 1 1 1.874-.002v1.463h-1.874v.003ZM32.292 53.422a.938.938 0 0 1-.937-.938v-1.562h1.875v1.562c0 .518-.42.938-.938.938Z"></path>
                  <path fill="#C3A249" d="M32.307 58.435c-.465 0-.935-.03-1.406-.093-4.817-.642-8.516-4.775-8.799-9.83l-.483-8.697c-.054-.974.564-1.842 1.538-2.156.9-.29 1.61-1.033 1.852-1.94.264-.992 1.1-1.659 2.078-1.659h10.41c.978 0 1.813.667 2.078 1.66a2.828 2.828 0 0 0 1.852 1.94c.972.313 1.59 1.178 1.538 2.153l-.5 9.001a10.223 10.223 0 0 1-3.68 7.285 10.083 10.083 0 0 1-6.477 2.337Zm-5.218-22.5c-.144 0-.234.144-.266.268a4.658 4.658 0 0 1-3.088 3.241c-.094.03-.25.12-.241.267l.483 8.696c.232 4.157 3.248 7.555 7.174 8.077 2.349.313 4.635-.337 6.439-1.83a8.336 8.336 0 0 0 3.002-5.945l.5-8.998c.008-.137-.124-.23-.24-.267a4.657 4.657 0 0 1-3.09-3.241c-.032-.124-.122-.268-.266-.268H27.09Z"></path>
                  <path fill="#0A0A0A" d="m48.745 45.938-3.431-.003a.937.937 0 1 1 .002-1.875l3.431.002a2.82 2.82 0 0 0 2.816-2.812v-15a2.812 2.812 0 0 0-2.813-2.813H26.249a2.812 2.812 0 0 0-2.813 2.813v8.127a.938.938 0 0 1-1.875 0V26.25a4.688 4.688 0 0 1 4.688-4.688h22.5a4.688 4.688 0 0 1 4.687 4.688v15a4.7 4.7 0 0 1-4.691 4.688Z"></path>
                  <path fill="#0A0A0A" d="M53.749 53.438h-9.063a.938.938 0 0 1 0-1.876h9.063a2.812 2.812 0 0 0 2.812-2.812v-15a2.812 2.812 0 0 0-2.812-2.813h-1.25v-1.875h1.25a4.688 4.688 0 0 1 4.687 4.688v15a4.688 4.688 0 0 1-4.687 4.688Z"></path>
                  <path fill="#0A0A0A" d="M22.525 27.814H52.47v1.875H22.525v-1.875ZM52.47 35.855h5.029v1.876H52.47v-1.876Z"></path>
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Subscribe to a Plan</p>
              <p className="text-gray-400 text-sm">
                Find the right subscription plan and leverage our expertise to do the research for you - you can unsubscribe any time!
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="40" fill="#0A0A0A"></circle>
                  <path fill="#0A0A0A" d="M34.368 54.107a.96.96 0 1 0 0 1.919h2.143a.96.96 0 1 0 0-1.919h-2.143Z"></path>
                  <path fill="#0A0A0A" d="M46.083 50.623a.96.96 0 0 0-.96.96v3.762a2.74 2.74 0 0 1-2.735 2.736H28.379a2.74 2.74 0 0 1-2.736-2.736v-30.69a2.74 2.74 0 0 1 2.736-2.737h1.501a.956.956 0 0 0-.04.273c0 1.906 1.17 3.09 3.05 3.09h5.098c1.882 0 3.05-1.184 3.05-3.09a.956.956 0 0 0-.04-.273h1.39a2.74 2.74 0 0 1 2.736 2.737v2.395a.96.96 0 1 0 1.918 0v-2.395A4.66 4.66 0 0 0 42.388 20H28.379a4.66 4.66 0 0 0-4.655 4.655v30.69A4.66 4.66 0 0 0 28.38 60h14.008a4.66 4.66 0 0 0 4.655-4.655v-3.762c0-.53-.43-.96-.959-.96ZM39.12 22.191c0 .832-.328 1.172-1.132 1.172h-5.097c-.804 0-1.132-.34-1.132-1.172a.956.956 0 0 0-.04-.273h7.44a.956.956 0 0 0-.04.273Z"></path>
                  <path fill="#C3A249" d="M46.961 29.73a9.285 9.285 0 0 0-5.026 1.472 9.283 9.283 0 0 0-4.289 7.843c0 1.535.38 3.042 1.097 4.386l-1.06 3.706a.96.96 0 0 0 .923 1.223c.071 0 .141-.01.21-.026l.002.002 4.052-.922a9.338 9.338 0 0 0 4.091.946c5.136 0 9.315-4.178 9.315-9.315 0-5.136-4.179-9.315-9.315-9.315Zm0 16.711a7.406 7.406 0 0 1-3.51-.883.955.955 0 0 0-.659-.093c-.003 0-.005 0-.009.002l-2.81.639.724-2.534.004-.017a.956.956 0 0 0-.103-.736 7.385 7.385 0 0 1-1.033-3.774 7.373 7.373 0 0 1 3.406-6.229 7.369 7.369 0 0 1 3.99-1.167c4.078 0 7.396 3.318 7.396 7.396 0 4.078-3.318 7.396-7.396 7.396Z"></path>
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Receive Plays on your Phone</p>
              <p className="text-gray-400 text-sm">
                Plays will be sent directly to your phone via text or email (up to you) the second we upload them
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="40" fill="#0A0A0A"></circle>
                  <g clipPath="url(#b)">
                    <path fill="#0A0A0A" d="M60 34.62C60 26.56 53.441 20 45.38 20c-6.874 0-12.654 4.769-14.209 11.171C24.77 32.725 20 38.506 20 45.38 20 53.44 26.559 60 34.62 60c6.874 0 12.654-4.769 14.209-11.171C55.23 47.275 60 41.494 60 34.62ZM34.62 57.657c-6.769 0-12.276-5.507-12.276-12.276 0-5.432 3.546-10.05 8.444-11.664-.019.3-.03.6-.03.904 0 8.062 6.56 14.621 14.622 14.621.303 0 .605-.01.904-.029-1.614 4.898-6.232 8.444-11.663 8.444ZM46.898 45.38c0 .484-.029.963-.084 1.433a12.224 12.224 0 0 1-9.506-2.95h9.497c.061.497.093 1.003.093 1.517ZM35.23 41.519a12.238 12.238 0 0 1-1.504-3.037h11.046c.634.93 1.143 1.95 1.504 3.037H35.229Zm-2.032-5.38a12.328 12.328 0 0 1-.01-2.952 12.225 12.225 0 0 1 9.507 2.952h-9.498Zm16.015 10.145c.019-.3.03-.6.03-.904 0-8.062-6.56-14.621-14.621-14.621-.304 0-.606.01-.905.029 1.614-4.898 6.232-8.444 11.663-8.444 6.77 0 12.277 5.507 12.277 12.276 0 5.432-3.546 10.05-8.444 11.664Z"></path>
                  </g>
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Tail our Picks</p>
              <p className="text-gray-400 text-sm">
                Join the action and place the bets at your favorite sports book. Let's win more together!
              </p>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div className="mb-16 relative group">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <p className="text-white text-3xl font-bold">About Us</p>
                {editingSection !== 'about' && (
                  <button
                    onClick={() => setEditingSection('about')}
                    className="px-2 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1 border border-slate-700"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit About
                  </button>
                )}
              </div>
              {editingSection === 'about' ? (
                <textarea
                  value={formData.aboutText}
                  onChange={(e) => setFormData(prev => ({ ...prev, aboutText: e.target.value }))}
                  placeholder="About text"
                  className="w-full text-gray-400 text-base bg-slate-800 border border-primary-500 rounded px-3 py-2"
                  rows={8}
                />
              ) : (
                <p className="text-gray-400 text-base leading-relaxed">
                  {formData.aboutText || `${formData.displayName || 'Your store'} uses advanced sports analytics to deliver data-driven picks that win. Our experts analyze player stats, trends, and market shifts to uncover true value plays. We don't guess - we calculate. Get smarter, more confident picks and turn data into profit. ${formData.displayName || 'Your store'}: Where every play brings you closer to victory.`}
                </p>
              )}
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              {editingSection === 'aboutImage' ? (
                <div className="w-full h-full bg-slate-800 border-2 border-primary-500 flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('aboutImage', e.target.files[0])}
                    className="hidden"
                    id="about-image-upload"
                  />
                  <label htmlFor="about-image-upload" className="cursor-pointer text-white px-4 py-2 bg-primary-600 rounded hover:bg-primary-700">
                    {uploading === 'aboutImage' ? 'Uploading...' : 'Upload About Image'}
                  </label>
                </div>
              ) : formData.aboutImage ? (
                <>
                  <Image
                    src={formData.aboutImage}
                    alt="about"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => setEditingSection('aboutImage')}
                    className="absolute top-4 right-4 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-700 z-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Edit Image
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                  <div className="text-6xl font-bold text-primary-400/20">
                    {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                  </div>
                  <button
                    onClick={() => setEditingSection('aboutImage')}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <span className="text-white text-sm px-3 py-2 bg-primary-600 rounded hover:bg-primary-700">Add Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Picks Section */}
        <div id="picks" className="mb-16">
          <p className="text-white text-3xl font-bold mb-6">Recent Picks</p>
          
          {/* Sport Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {(formData.sports && formData.sports.length > 0 ? formData.sports : ['Football', 'College Football', 'Baseball', 'Basketball', 'Golf', 'Soccer']).map((sport) => (
              <button
                key={sport}
                className="px-4 py-2 rounded-full transition-colors flex items-center gap-2 bg-slate-900 border border-slate-800 text-white hover:border-primary-500"
              >
                <span className="text-sm font-medium">{sport}</span>
              </button>
            ))}
          </div>

          {/* Picks Placeholder */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-lg">Picks will appear here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
