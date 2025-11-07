'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import SportIcon from '@/components/SportIcon'

interface Plan {
  _id: string
  name: string
  description?: string
  isFree: boolean
  billingVariants: Array<{
    interval: string
    priceCents: number
  }>
  freeTrialDays: number
}

interface Pick {
  _id: string
  title: string
  sport?: string
  createdAt: string
}

export default function StorePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
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
    fetchPicks()
  }, [])

  // Keyboard shortcuts for better editing experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close edit mode
      if (e.key === 'Escape' && editingSection) {
        setEditingSection(null)
      }
      // Ctrl/Cmd + S to quick save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && editingSection) {
        e.preventDefault()
        // Quick save logic inline to avoid dependency issues
        const quickSave = async () => {
          try {
            if (editingSection === 'info' && (!formData.handle || !formData.displayName)) {
              toast.error('Handle and display name are required')
              return
            }
            await api.put('/creator/storefront', formData)
            toast.success('Changes saved!', { duration: 2000 })
            await fetchStorefront()
          } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save changes')
          }
        }
        quickSave()
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
        // Update form data with fetched storefront data, preserving existing values if not present
        setFormData(prev => ({
          handle: response.data.handle || prev.handle || '',
          displayName: response.data.displayName || prev.displayName || '',
          description: response.data.description || prev.description || '',
          logoImage: response.data.logoImage || prev.logoImage || '',
          bannerImage: response.data.bannerImage || prev.bannerImage || '',
          aboutText: response.data.aboutText || prev.aboutText || '',
          aboutImage: response.data.aboutImage || prev.aboutImage || '',
          sports: response.data.sports || prev.sports || [],
          socialLinks: {
            twitter: response.data.socialLinks?.twitter || prev.socialLinks?.twitter || '',
            instagram: response.data.socialLinks?.instagram || prev.socialLinks?.instagram || '',
            website: response.data.socialLinks?.website || prev.socialLinks?.website || ''
          }
        }))
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
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

  const fetchPicks = async () => {
    try {
      const response = await api.get('/creator/picks')
      setPicks(response.data || [])
    } catch (error) {
      console.error('Error fetching picks:', error)
    }
  }

  const handleSave = async (section?: string) => {
    try {
      // Validate required fields only for info section
      if (section === 'info' && (!formData.handle || !formData.displayName)) {
        toast.error('Handle and display name are required')
        return
      }

      // Ensure we're sending all required fields
      const dataToSend = {
        ...formData,
        handle: formData.handle || storefront?.handle || '',
        displayName: formData.displayName || storefront?.displayName || ''
      }

      const response = await api.put('/creator/storefront', dataToSend)
      setStorefront(response.data)
      toast.success(section ? `${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!` : 'Storefront updated successfully!')
      if (section) {
        setEditingSection(null)
      }
      // Refresh data to get updated storefront
      await fetchStorefront()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to update storefront')
    }
  }

  // Handle auto-save for individual fields (debounced)
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Quick save without closing edit mode
  const handleQuickSave = async () => {
    try {
      // Only validate required fields for info section
      if (editingSection === 'info' && (!formData.handle || !formData.displayName)) {
        toast.error('Handle and display name are required')
        return
      }
      
      // Ensure we're sending all required fields
      const dataToSend = {
        ...formData,
        handle: formData.handle || storefront?.handle || '',
        displayName: formData.displayName || storefront?.displayName || ''
      }
      
      await api.put('/creator/storefront', dataToSend)
      toast.success('Changes saved!', { duration: 2000 })
      await fetchStorefront()
    } catch (error: any) {
      console.error('Quick save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save changes')
    }
  }

  const handleFileUpload = async (field: 'logoImage' | 'bannerImage' | 'aboutImage', file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(field)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // The server returns the full URL already
      const imageUrl = response.data.url

      // Update form data with the uploaded image URL
      setFormData(prev => ({ ...prev, [field]: imageUrl }))
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(null)
    }
  }

  const handleImageUrlChange = (field: 'logoImage' | 'bannerImage' | 'aboutImage', url: string) => {
    setFormData(prev => ({ ...prev, [field]: url }))
  }

  const handleShareLink = () => {
    if (storefront?.handle) {
      const url = `${window.location.origin}/creator/${storefront.handle}`
      navigator.clipboard.writeText(url)
      toast.success('Public link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const publicUrl = storefront?.handle ? `${typeof window !== 'undefined' ? window.location.origin : ''}/creator/${storefront.handle}` : ''

  return (
    <div className="min-h-screen">
      {/* Quick Help Tip */}
      {editingSection && (
        <div className="bg-primary-600/20 border-b border-primary-500/30 px-4 py-2 text-center backdrop-blur-sm">
          <p className="text-sm text-primary-300">
            <span className="font-semibold">Tip:</span> Press <kbd className="px-2 py-1 bg-black/40 rounded text-xs border border-slate-700">Esc</kbd> to cancel or <kbd className="px-2 py-1 bg-black/40 rounded text-xs border border-slate-700">Ctrl+S</kbd> to quick save
          </p>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storefront Preview Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 mb-6 shadow-lg shadow-black/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {formData.logoImage ? (
                <img src={formData.logoImage} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
                  {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white">{formData.displayName || 'Your Store'}</h2>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/creator/${formData.handle}`)}
                className="px-3 py-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-semibold"
              >
                See Picks
              </button>
              {formData.socialLinks?.twitter && (
                <a
                  href={formData.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {plans.length > 0 && (
                <button className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 text-sm font-semibold flex items-center space-x-1">
                  <span>Subscribe</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Banner Image Section */}
        <div className="relative mb-6 rounded-xl overflow-hidden border border-slate-800 group bg-black/20 backdrop-blur-sm shadow-lg shadow-black/20">
          {formData.bannerImage ? (
            <div className="h-80 w-full relative">
              <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingSection('banner')}
                  className="px-3 py-2 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors flex items-center space-x-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Section</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-80 w-full bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setEditingSection('banner')}
                  className="px-3 py-2 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/70 transition-colors flex items-center space-x-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Banner Image</span>
                </button>
              </div>
            </div>
          )}
          {editingSection === 'banner' && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditingSection(null)}>
              <div className="bg-black/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 border border-slate-800 shadow-glow shadow-primary-500/20" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-white font-semibold mb-4">Edit Banner Image</h3>
                
                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('bannerImage', file)
                    }}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary-600 file:to-primary-700 file:text-white hover:file:shadow-glow"
                    disabled={uploading === 'bannerImage'}
                  />
                  {uploading === 'bannerImage' && (
                    <p className="text-sm text-primary-400 mt-2">Uploading...</p>
                  )}
                </div>

                {/* Or URL Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Or Enter Image URL</label>
                  <input
                    type="url"
                    value={formData.bannerImage}
                    onChange={(e) => handleImageUrlChange('bannerImage', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  />
                </div>

                {formData.bannerImage && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-300 mb-2">Preview:</p>
                    <img src={formData.bannerImage} alt="Banner preview" className="w-full rounded-lg object-cover max-h-48 border border-slate-600" />
                  </div>
                )}

                <div className="flex space-x-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleSave('banner')}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Storefront Info Section */}
        <div className={`bg-black/40 backdrop-blur-sm rounded-xl border-2 p-6 mb-6 relative transition-all shadow-lg shadow-black/20 group overflow-hidden ${
          editingSection === 'info' 
            ? 'border-primary-500/50 shadow-glow shadow-primary-500/30' 
            : 'border-slate-800 hover:border-primary-500/30'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <button
            onClick={() => setEditingSection(editingSection === 'info' ? null : 'info')}
            className={`relative z-10 absolute top-4 right-4 px-3 py-2 rounded-lg transition-all flex items-center space-x-2 text-sm font-medium ${
              editingSection === 'info'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30 border border-primary-500/50'
                : 'bg-black/60 text-white hover:bg-black/80 border border-slate-700 hover:border-primary-500/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{editingSection === 'info' ? 'Editing...' : 'Edit Section'}</span>
          </button>

          {editingSection === 'info' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Logo Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('logoImage', file)
                    }}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary-600 file:to-primary-700 file:text-white hover:file:shadow-glow mb-2"
                    disabled={uploading === 'logoImage'}
                  />
                  {uploading === 'logoImage' && (
                    <p className="text-sm text-primary-400 mb-2">Uploading...</p>
                  )}
                  <input
                    type="url"
                    value={formData.logoImage}
                    onChange={(e) => handleImageUrlChange('logoImage', e.target.value)}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Or enter image URL"
                  />
                  {formData.logoImage && (
                    <img src={formData.logoImage} alt="Logo preview" className="mt-2 w-16 h-16 rounded-full object-cover border border-slate-600" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('bannerImage', file)
                    }}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary-600 file:to-primary-700 file:text-white hover:file:shadow-glow mb-2"
                    disabled={uploading === 'bannerImage'}
                  />
                  {uploading === 'bannerImage' && (
                    <p className="text-sm text-primary-400 mb-2">Uploading...</p>
                  )}
                  <input
                    type="url"
                    value={formData.bannerImage}
                    onChange={(e) => handleImageUrlChange('bannerImage', e.target.value)}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Or enter image URL"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Store Handle *</label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="your-store-handle"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">URL: lineup.com/creator/{formData.handle || 'your-handle'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Your Store Name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="Describe your store..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Social Links</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Twitter URL (e.g., https://twitter.com/username)"
                  />
                  <input
                    type="url"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Instagram URL (e.g., https://instagram.com/username)"
                  />
                  <input
                    type="url"
                    value={formData.socialLinks.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, website: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                    placeholder="Website URL"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleSave('info')}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleQuickSave}
                  className="px-4 py-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-medium"
                  title="Save without closing (Ctrl+S)"
                >
                  Quick Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-4 mb-4">
                {formData.logoImage ? (
                  <img src={formData.logoImage} alt="Logo" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold">
                    {formData.displayName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-white">{formData.displayName || 'Your Store'}</h2>
                  <p className="text-gray-400">@{formData.handle || 'your-handle'}</p>
                </div>
              </div>
              {formData.description && (
                <p className="text-gray-300 mb-4">{formData.description}</p>
              )}
              <div className="flex items-center space-x-4 mb-4">
                {plans.length > 0 && (
                  <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                    Subscribe
                    <span className="ml-2 text-sm opacity-75">
                      ${plans[0]?.billingVariants[0]?.priceCents ? (plans[0].billingVariants[0].priceCents / 100).toFixed(2) : '0.00'} per {plans[0]?.billingVariants[0]?.interval || 'month'}
                    </span>
                  </button>
                )}
                {formData.socialLinks?.twitter && (
                  <a
                    href={formData.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
              </div>
              <div className="flex space-x-3">
                {publicUrl && (
                  <>
                    <Link
                      href={publicUrl}
                      target="_blank"
                      className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 flex items-center space-x-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>See Public View</span>
                    </Link>
                    <button
                      onClick={handleShareLink}
                      className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 flex items-center space-x-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share Public Link</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Plans Section */}
        <div id="subscription-plans" className="bg-black/40 backdrop-blur-sm rounded-xl border-2 border-slate-800 hover:border-primary-500/30 p-6 mb-6 relative transition-all shadow-lg shadow-black/20 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <button
            onClick={() => router.push('/creator/dashboard/plans')}
            className="absolute top-4 right-4 px-3 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 flex items-center space-x-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Manage Plans</span>
          </button>
          <h3 className="text-2xl font-bold text-white mb-4">Subscription Plans</h3>
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.slice(0, 1).map((plan) => (
                <div key={plan._id} className="bg-black/60 rounded-lg p-6 border border-slate-800 hover:border-primary-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="mb-4">
                    <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                    {plan.freeTrialDays > 0 && (
                      <p className="text-primary-400 text-sm font-semibold mb-2">{plan.freeTrialDays} day Free Trial</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-600">
                    <span className="text-3xl font-bold text-white">
                      ${plan.billingVariants[0]?.priceCents ? (plan.billingVariants[0].priceCents / 100).toFixed(2) : '0.00'}
                    </span>
                    <span className="text-gray-400">per {plan.billingVariants[0]?.interval || 'month'}</span>
                  </div>
                  {plan.description && (
                    <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                  )}
                  <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-slate-600">
                    <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p className="text-gray-300 text-sm">{formData.displayName || 'Your'} Picks</p>
                  </div>
                  <Link
                    href={`/creator/${formData.handle}/subscribe/${plan._id}`}
                    className="block w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-semibold"
                  >
                    Subscribe
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No subscription plans yet</p>
              <Link
                href="/creator/dashboard/plans/new"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Create Plan
              </Link>
            </div>
          )}
          {plans.length > 1 && (
            <div className="mt-4 text-center">
              <Link
                href="/creator/dashboard/plans"
                className="text-primary-400 hover:text-primary-300 text-sm font-medium"
              >
                View All Plans
              </Link>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-6 mb-6 shadow-lg shadow-black/20 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-center mb-2">
            <p className="text-sm text-gray-400 mb-2">Uneditable</p>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 text-center">How It Works</h3>
          <p className="text-gray-300 text-center mb-6">
            We partner with <span className="font-semibold text-primary-400">Lineup</span> to deliver you our picks in realtime. Join us and other trusted cappers on the premier platform for sports content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Subscribe to a Plan</h4>
              <p className="text-gray-400 text-sm">Find the right subscription plan and leverage our expertise to do the research for you - you can unsubscribe any time!</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Receive Plays on your Phone</h4>
              <p className="text-gray-400 text-sm">Plays will be sent directly to your phone via text or email (up to you) the second we upload them</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Tail our Picks</h4>
              <p className="text-gray-400 text-sm">Join the action and place the bets at your favorite sports book. Let's win more together!</p>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div className={`bg-black/40 backdrop-blur-sm rounded-xl border-2 p-6 mb-6 relative transition-all shadow-lg shadow-black/20 group overflow-hidden ${
          editingSection === 'about' 
            ? 'border-primary-500/50 shadow-glow shadow-primary-500/30' 
            : 'border-slate-800 hover:border-primary-500/30'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <button
            onClick={() => setEditingSection(editingSection === 'about' ? null : 'about')}
            className={`absolute top-4 right-4 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium ${
              editingSection === 'about'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30 border border-primary-500/50'
                : 'bg-black/60 text-white hover:bg-black/80 border border-slate-700 hover:border-primary-500/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{editingSection === 'about' ? 'Editing...' : 'Edit Section'}</span>
          </button>

          {editingSection === 'about' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">About Text</label>
                <textarea
                  value={formData.aboutText}
                  onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="Tell customers about your store, your expertise, and why they should subscribe to your picks..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">About Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('aboutImage', file)
                  }}
                  className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary-600 file:to-primary-700 file:text-white hover:file:shadow-glow mb-2"
                  disabled={uploading === 'aboutImage'}
                />
                {uploading === 'aboutImage' && (
                  <p className="text-sm text-primary-400 mb-2">Uploading...</p>
                )}
                <input
                  type="url"
                  value={formData.aboutImage}
                  onChange={(e) => handleImageUrlChange('aboutImage', e.target.value)}
                  className="w-full px-4 py-2 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
                  placeholder="Or enter image URL"
                />
                {formData.aboutImage && (
                  <img src={formData.aboutImage} alt="About preview" className="mt-2 w-full max-w-md rounded-lg object-cover border border-slate-600" />
                )}
              </div>
              <div className="flex space-x-2 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleSave('about')}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleQuickSave}
                  className="px-4 py-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-medium"
                  title="Save without closing (Ctrl+S)"
                >
                  Quick Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">About Us</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {formData.aboutText || 'Tell your customers about your store, your expertise, and why they should subscribe to your picks.'}
                </p>
              </div>
              {formData.aboutImage ? (
                <div className="rounded-lg overflow-hidden aspect-video">
                  <img src={formData.aboutImage} alt="About" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden aspect-video bg-black/60 border border-slate-800 flex items-center justify-center">
                  <p className="text-gray-400">No image added</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Picks Section */}
        <div id="picks" className="bg-black/40 backdrop-blur-sm rounded-xl border-2 border-slate-800 hover:border-primary-500/30 p-6 relative transition-all shadow-lg shadow-black/20 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">Recent Picks</h3>
            <button
              onClick={() => router.push('/creator/dashboard/picks')}
              className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Manage Picks</span>
            </button>
          </div>
          
          {picks.length > 0 ? (
            <div className="space-y-4">
              {picks.slice(0, 6).map((pick) => (
                <div key={pick._id} className="bg-black/60 rounded-lg p-4 border border-slate-800 hover:border-primary-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-1">{pick.title}</h4>
                      {pick.sport && (
                        <span className="text-xs text-gray-400 bg-slate-600 px-2 py-1 rounded">{pick.sport}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(pick.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No picks yet</p>
              <Link
                href="/creator/dashboard/picks/new"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Create Pick
              </Link>
            </div>
          )}
        </div>

        {/* Picks For Section */}
        <div id="picks-for" className={`bg-black/40 backdrop-blur-sm rounded-xl border-2 p-6 relative transition-all shadow-lg shadow-black/20 group overflow-hidden ${
          editingSection === 'sports' 
            ? 'border-primary-500/50 shadow-glow shadow-primary-500/30' 
            : 'border-slate-800 hover:border-primary-500/30'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <button
            onClick={() => setEditingSection(editingSection === 'sports' ? null : 'sports')}
            className={`absolute top-4 right-4 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium ${
              editingSection === 'sports'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow shadow-primary-500/30 border border-primary-500/50'
                : 'bg-black/60 text-white hover:bg-black/80 border border-slate-700 hover:border-primary-500/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{editingSection === 'sports' ? 'Editing...' : 'Edit Section'}</span>
          </button>

          {editingSection === 'sports' ? (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4">Picks For...</h3>
              <p className="text-gray-400 text-sm mb-6">Select which sports you cover. These will be displayed on your storefront.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[
                  'Football', 'College Football', 'Baseball', 'Basketball', 
                  'College Basketball', 'Golf', 'Soccer', 'Tennis',
                  'Hockey', 'MMA', 'Boxing', 'Racing',
                  'Esports', 'Cricket', 'Rugby', 'Volleyball',
                  'Swimming', 'Track & Field', 'Wrestling', 'Lacrosse',
                  'Softball', 'Table Tennis', 'Badminton', 'Cycling'
                ].map((sport) => {
                  const isSelected = formData.sports.includes(sport)
                  return (
                    <button
                      key={sport}
                      onClick={() => {
                        if (isSelected) {
                          setFormData(prev => ({
                            ...prev,
                            sports: prev.sports.filter(s => s !== sport)
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            sports: [...prev.sports, sport]
                          }))
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                        isSelected
                          ? 'bg-primary-600 border-primary-500 text-white shadow-lg'
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:border-slate-500 hover:bg-slate-600'
                      }`}
                    >
                      <SportIcon sport={sport} className="w-8 h-8" />
                      <span className="text-sm font-medium text-center">{sport}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex space-x-2 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleSave('sports')}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all border border-primary-500/50 font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleQuickSave}
                  className="px-4 py-2 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50 text-sm font-medium"
                  title="Save without closing (Ctrl+S)"
                >
                  Quick Save
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all border border-slate-700 hover:border-primary-500/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Picks For...</h3>
              {formData.sports && formData.sports.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {formData.sports.map((sport) => (
                    <div
                      key={sport}
                      className="px-4 py-2.5 bg-slate-700 text-gray-300 rounded-lg flex items-center space-x-2 border border-slate-600 hover:border-primary-500 transition-colors"
                    >
                      <SportIcon sport={sport} className="w-5 h-5" />
                      <span className="font-medium">{sport}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No sports selected yet</p>
                  <button
                    onClick={() => setEditingSection('sports')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Add Sports
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
