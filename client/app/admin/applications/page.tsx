'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface CreatorApplication {
  _id: string
  user?: {
    _id: string
    email: string
    firstName?: string
    lastName?: string
  }
  handle: string
  displayName: string
  email: string
  phoneNumber: string
  socialLinks: {
    twitter?: string
    instagram?: string
    website?: string
    tiktok?: string
    youtube?: string
  }
  experience: string
  whyCreator: string
  sports: string[]
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  rejectionReason?: string
  reviewedBy?: {
    _id: string
    email: string
    firstName?: string
    lastName?: string
  }
  reviewedAt?: string
  createdAt: string
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<CreatorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [editingHandle, setEditingHandle] = useState('')
  const [checkingHandle, setCheckingHandle] = useState(false)
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [handleCheckTimeout, setHandleCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !user.roles?.includes('admin'))) {
      router.push('/')
      return
    }
    if (user && user.roles?.includes('admin')) {
      fetchApplications()
    }
  }, [user, authLoading, router, filter])

  const fetchApplications = async () => {
    try {
      const status = filter === 'all' ? undefined : filter
      const response = await api.get('/applications', {
        params: status ? { status } : {}
      })
      setApplications(response.data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (applicationId: string) => {
    // Validate handle if it was changed
    if (editingHandle !== selectedApplication?.handle) {
      if (!editingHandle || editingHandle.length < 3) {
        toast.error('Handle must be at least 3 characters')
        return
      }
      if (handleAvailable === false) {
        toast.error('Please choose an available handle')
        return
      }
      if (checkingHandle) {
        toast.error('Please wait for handle availability check to complete')
        return
      }
    }

    if (!confirm('Are you sure you want to approve this application?')) return

    setActionLoading(true)
    try {
      await api.put(`/applications/${applicationId}/approve`, {
        handle: editingHandle !== selectedApplication?.handle ? editingHandle : undefined,
        adminNotes: adminNotes || undefined
      })
      toast.success('Application approved successfully!')
      setShowModal(false)
      setSelectedApplication(null)
      setAdminNotes('')
      setEditingHandle('')
      setHandleAvailable(null)
      fetchApplications()
    } catch (error: any) {
      console.error('Error approving application:', error)
      toast.error(error.response?.data?.message || 'Failed to approve application')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    if (!confirm('Are you sure you want to reject this application?')) return

    setActionLoading(true)
    try {
      await api.put(`/applications/${applicationId}/reject`, {
        rejectionReason,
        adminNotes: adminNotes || undefined
      })
      toast.success('Application rejected')
      setShowModal(false)
      setSelectedApplication(null)
      setRejectionReason('')
      setAdminNotes('')
      setEditingHandle('')
      setHandleAvailable(null)
      fetchApplications()
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      toast.error(error.response?.data?.message || 'Failed to reject application')
    } finally {
      setActionLoading(false)
    }
  }

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
      const excludeId = selectedApplication?._id
      const response = await api.get(`/applications/check-handle/${normalizedHandle}`, {
        params: excludeId ? { excludeApplicationId: excludeId } : {}
      })
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
    setEditingHandle(value)
    
    // Clear previous timeout
    if (handleCheckTimeout) {
      clearTimeout(handleCheckTimeout)
    }
    
    // Debounce handle check
    const timeoutId = setTimeout(() => {
      checkHandleAvailability(value)
    }, 500)
    
    setHandleCheckTimeout(timeoutId)
  }

  const openModal = (application: CreatorApplication) => {
    setSelectedApplication(application)
    setAdminNotes(application.adminNotes || '')
    setRejectionReason(application.rejectionReason || '')
    setEditingHandle(application.handle)
    setHandleAvailable(null)
    setShowModal(true)
    // Check initial handle availability
    if (application.handle) {
      checkHandleAvailability(application.handle)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter)

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Creator Applications</h1>
              <p className="text-gray-400">Review and manage creator applications</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
            >
              Back to Admin
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium capitalize ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {status} ({applications.filter(app => status === 'all' ? true : app.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-12 text-center">
            <p className="text-gray-400 text-lg">No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application._id}
                className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 hover:border-primary-500/50 transition-all cursor-pointer"
                onClick={() => openModal(application)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{application.displayName}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>
                        <span className="text-gray-500">Handle:</span>{' '}
                        <span className="text-primary-400">@{application.handle}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span> {application.email}
                      </p>
                      <p>
                        <span className="text-gray-500">Phone:</span> {application.phoneNumber}
                      </p>
                      {application.sports && application.sports.length > 0 && (
                        <p>
                          <span className="text-gray-500">Sports:</span> {application.sports.join(', ')}
                        </p>
                      )}
                      <p>
                        <span className="text-gray-500">Submitted:</span>{' '}
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal(application)
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Application Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedApplication(null)
                    setAdminNotes('')
                    setRejectionReason('')
                    setEditingHandle('')
                    setHandleAvailable(null)
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                  <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Display Name:</span>
                      <span className="text-white font-medium">{selectedApplication.displayName}</span>
                    </div>
                    {/* Handle/URL Slug - Editable */}
                    <div>
                      <label className="block text-gray-400 mb-2">URL Slug (Handle):</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          lineup.com/creator/
                        </span>
                        <input
                          type="text"
                          value={editingHandle}
                          onChange={handleHandleChange}
                          className="w-full pl-40 pr-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="creator-handle"
                        />
                      </div>
                      {editingHandle && (
                        <div className="mt-2">
                          {checkingHandle ? (
                            <p className="text-xs text-gray-400">Checking availability...</p>
                          ) : handleAvailable === true ? (
                            <p className="text-xs text-green-400">✓ This handle is available</p>
                          ) : handleAvailable === false ? (
                            <p className="text-xs text-red-400">✗ This handle is already taken</p>
                          ) : null}
                        </div>
                      )}
                      {editingHandle !== selectedApplication.handle && (
                        <p className="text-xs text-yellow-400 mt-1">
                          ⚠️ Handle will be changed from @{selectedApplication.handle} to @{editingHandle}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Final URL: lineup.com/creator/{editingHandle || selectedApplication.handle}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{selectedApplication.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{selectedApplication.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(selectedApplication.status)}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                {Object.values(selectedApplication.socialLinks || {}).some(link => link) && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Social Media Links</h3>
                    <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                      {selectedApplication.socialLinks.twitter && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Twitter:</span>
                          <a href={selectedApplication.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                            {selectedApplication.socialLinks.twitter}
                          </a>
                        </div>
                      )}
                      {selectedApplication.socialLinks.instagram && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Instagram:</span>
                          <a href={selectedApplication.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                            {selectedApplication.socialLinks.instagram}
                          </a>
                        </div>
                      )}
                      {selectedApplication.socialLinks.website && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Website:</span>
                          <a href={selectedApplication.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                            {selectedApplication.socialLinks.website}
                          </a>
                        </div>
                      )}
                      {selectedApplication.socialLinks.tiktok && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">TikTok:</span>
                          <a href={selectedApplication.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                            {selectedApplication.socialLinks.tiktok}
                          </a>
                        </div>
                      )}
                      {selectedApplication.socialLinks.youtube && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">YouTube:</span>
                          <a href={selectedApplication.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                            {selectedApplication.socialLinks.youtube}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sports */}
                {selectedApplication.sports && selectedApplication.sports.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Sports</h3>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.sports.map((sport) => (
                          <span key={sport} className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm border border-primary-500/30">
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Experience & Background</h3>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedApplication.experience}</p>
                  </div>
                </div>

                {/* Why Creator */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Why They Want to Be a Creator</h3>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedApplication.whyCreator}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Add internal notes about this application..."
                  />
                </div>

                {/* Rejection Reason (if rejecting) */}
                {selectedApplication.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rejection Reason (Required if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Provide a reason for rejection..."
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleApprove(selectedApplication._id)}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedApplication._id)}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

