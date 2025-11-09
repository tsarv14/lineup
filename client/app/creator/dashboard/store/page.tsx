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
      website: '',
      tiktok: '',
      youtube: ''
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
            website: response.data.socialLinks?.website || '',
            tiktok: response.data.socialLinks?.tiktok || '',
            youtube: response.data.socialLinks?.youtube || ''
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Section - Moved to Top */}
        <div className="relative w-full h-48 md:h-72 mb-8 rounded-lg overflow-hidden group mt-8">
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
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {editingSection === 'banner' ? (
              <>
                <button
                  onClick={() => {
                    handleSave('banner')
                    setEditingSection(null)
                  }}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 border border-primary-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium border border-slate-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingSection('banner')}
                className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Edit Banner
              </button>
            )}
          </div>
        </div>

        {/* Store Name Section - Underneath Banner */}
        <div className="mb-12 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
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
                <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold">
                  {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <div className="flex-1 max-w-md">
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
                    className="text-white text-2xl font-bold bg-slate-800 border border-primary-500 rounded px-3 py-2"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-white text-3xl font-bold">{formData.displayName || 'Your Store Name'}</p>
                  {formData.handle && (
                    <p className="text-gray-400 text-sm mt-1">@{formData.handle}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Edit buttons for logo and info */}
          <div className="flex gap-2 justify-center mt-4">
            {editingSection === 'logo' ? (
              <>
                <button
                  onClick={() => {
                    handleSave('logo')
                    setEditingSection(null)
                  }}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-primary-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingSection('logo')}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Edit Logo
              </button>
            )}
            {editingSection === 'info' ? (
              <>
                <button
                  onClick={() => {
                    handleSave('info')
                    setEditingSection(null)
                  }}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-primary-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingSection('info')}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Info
              </button>
            )}
          </div>
        </div>
        {/* Description Section */}
        <div className="mb-12 bg-slate-900/50 rounded-lg p-8 border border-slate-800">
          <div className="relative">
            {editingSection === 'description' ? (
              <div className="space-y-4">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description for your store..."
                  className="w-full text-white text-lg font-semibold bg-slate-800 border border-primary-500 rounded px-4 py-3 min-h-[100px]"
                  rows={3}
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      handleSave('description')
                      setEditingSection(null)
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 border border-primary-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium border border-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-white text-lg font-semibold mb-4">
                  {formData.description || ''}
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setEditingSection('description')}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Description
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Text Section */}
        <div className="mb-12 bg-slate-900/50 rounded-lg p-8 border border-slate-800">
          <div className="relative">
            {editingSection === 'about' ? (
              <div className="space-y-4">
                <textarea
                  value={formData.aboutText}
                  onChange={(e) => setFormData(prev => ({ ...prev, aboutText: e.target.value }))}
                  placeholder="Tell your story... Add information about your store, your expertise, and what makes you unique."
                  className="w-full text-gray-300 text-base bg-slate-800 border border-primary-500 rounded px-4 py-3 min-h-[200px] leading-relaxed"
                  rows={8}
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      handleSave('about')
                      setEditingSection(null)
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 border border-primary-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium border border-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 text-base leading-relaxed mb-4 whitespace-pre-wrap">
                  {formData.aboutText || ''}
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setEditingSection('about')}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit About
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Links Section - Completely Redesigned */}
        <div className="mb-12 bg-slate-900/50 rounded-lg p-8 border border-slate-800">
          <div className="text-center mb-6">
            <h3 className="text-white text-xl font-semibold mb-2">Connect With Us</h3>
            <p className="text-gray-400 text-sm">Add your social media links to stay connected</p>
          </div>
          
          {editingSection === 'social' ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Twitter/X URL</label>
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full text-white text-sm bg-slate-800 border border-primary-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Instagram URL</label>
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full text-white text-sm bg-slate-800 border border-primary-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                  placeholder="https://yourwebsite.com"
                  className="w-full text-white text-sm bg-slate-800 border border-primary-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">TikTok URL</label>
                <input
                  type="url"
                  value={formData.socialLinks.tiktok}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, tiktok: e.target.value } }))}
                  placeholder="https://tiktok.com/@yourhandle"
                  className="w-full text-white text-sm bg-slate-800 border border-primary-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">YouTube URL</label>
                <input
                  type="url"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                  placeholder="https://youtube.com/@yourhandle"
                  className="w-full text-white text-sm bg-slate-800 border border-primary-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2 justify-center pt-4">
                <button
                  onClick={() => {
                    handleSave('social')
                    setEditingSection(null)
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 border border-primary-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium border border-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {formData.socialLinks?.twitter ? (
                <a
                  href={formData.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
                >
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-6 h-6 text-white group-hover:text-primary-400">
                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
                  </svg>
                  <span className="text-white font-medium group-hover:text-primary-400">Twitter</span>
                </a>
              ) : null}
              {formData.socialLinks?.instagram ? (
                <a
                  href={formData.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
                >
                  <svg className="w-6 h-6 text-white group-hover:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="text-white font-medium group-hover:text-primary-400">Instagram</span>
                </a>
              ) : null}
              {formData.socialLinks?.website ? (
                <a
                  href={formData.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
                >
                  <svg className="w-6 h-6 text-white group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-white font-medium group-hover:text-primary-400">Website</span>
                </a>
              ) : null}
              {formData.socialLinks?.tiktok ? (
                <a
                  href={formData.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
                >
                  <svg className="w-6 h-6 text-white group-hover:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span className="text-white font-medium group-hover:text-primary-400">TikTok</span>
                </a>
              ) : null}
              {formData.socialLinks?.youtube ? (
                <a
                  href={formData.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
                >
                  <svg className="w-6 h-6 text-white group-hover:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="text-white font-medium group-hover:text-primary-400">YouTube</span>
                </a>
              ) : null}
              {(!formData.socialLinks?.twitter && !formData.socialLinks?.instagram && !formData.socialLinks?.website && !formData.socialLinks?.tiktok && !formData.socialLinks?.youtube) && (
                <p className="text-gray-400 text-sm">No social links added yet</p>
              )}
              <div className="w-full flex justify-center mt-4">
                <button
                  onClick={() => setEditingSection('social')}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {(!formData.socialLinks?.twitter && !formData.socialLinks?.instagram && !formData.socialLinks?.website && !formData.socialLinks?.tiktok && !formData.socialLinks?.youtube) ? 'Add Social Links' : 'Edit Social Links'}
                </button>
              </div>
            </div>
          )}
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
                {editingSection === 'about' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleSave('about')
                        setEditingSection(null)
                      }}
                      className="px-2 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium flex items-center gap-1 border border-primary-500"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-2 py-1 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
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
                  {formData.aboutText || ''}
                </p>
              )}
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              {editingSection === 'aboutImage' ? (
                <div className="w-full h-full bg-slate-800 border-2 border-primary-500 flex flex-col items-center justify-center gap-4">
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleSave('aboutImage')
                        setEditingSection(null)
                      }}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 border border-primary-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium border border-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : formData.aboutImage ? (
                <>
                  <Image
                    src={formData.aboutImage}
                    alt="about"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={() => setEditingSection('aboutImage')}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Edit Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                  <div className="text-6xl font-bold text-primary-400/20">
                    {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                  </div>
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => setEditingSection('aboutImage')}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 border border-slate-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Picks Section */}
        <div id="picks" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <p className="text-white text-3xl font-bold">Recent Picks</p>
            {editingSection === 'sports' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleSave('sports')
                    setEditingSection(null)
                  }}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-primary-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-xs font-medium border border-slate-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingSection('sports')}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Sports
              </button>
            )}
          </div>
          
          {/* Sport Filter */}
          {editingSection === 'sports' ? (
            <div className="mb-8 bg-slate-900/50 rounded-lg p-6 border border-slate-800">
              <p className="text-white text-sm font-medium mb-4">Select sports for your picks:</p>
              <div className="flex flex-wrap gap-3">
                {['Football', 'College Football', 'Baseball', 'Basketball', 'Golf', 'Soccer', 'Hockey', 'Tennis', 'MMA', 'Boxing', 'Racing', 'Other'].map((sport) => (
                  <button
                    key={sport}
                    onClick={() => {
                      const currentSports = formData.sports || []
                      if (currentSports.includes(sport)) {
                        setFormData(prev => ({ ...prev, sports: currentSports.filter(s => s !== sport) }))
                      } else {
                        setFormData(prev => ({ ...prev, sports: [...currentSports, sport] }))
                      }
                    }}
                    className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 border text-sm font-medium ${
                      formData.sports?.includes(sport)
                        ? 'bg-primary-600 border-primary-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-gray-300 hover:border-primary-500'
                    }`}
                  >
                    <span>{sport}</span>
                    {formData.sports?.includes(sport) && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 mb-8">
              {formData.sports && formData.sports.length > 0 ? (
                formData.sports.map((sport) => (
                  <button
                    key={sport}
                    className="px-4 py-2 rounded-full transition-colors flex items-center gap-2 bg-slate-900 border border-slate-800 text-white hover:border-primary-500"
                  >
                    <span className="text-sm font-medium">{sport}</span>
                  </button>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No sports selected yet</p>
              )}
            </div>
          )}

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
