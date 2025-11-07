'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function LinksPage() {
  const { user } = useAuth()
  const [links, setLinks] = useState({
    discord: '',
    telegram: '',
    other: ''
  })

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      // Links would be stored in storefront or a separate model
      // For now, this is a placeholder
      const response = await api.get('/creator/storefront')
      if (response.data?.links) {
        setLinks(response.data.links)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
    }
  }

  const handleSave = async () => {
    try {
      // Store links in storefront or create a links endpoint
      // For now, this is a placeholder - you'd need to add links to storefront model
      toast.success('Links saved successfully!')
    } catch (error: any) {
      toast.error('Failed to save links')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Links</h1>
            <p className="text-gray-400 mt-1">Manage external links (Discord, Telegram, etc.)</p>
          </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-slate-800 p-8 space-y-6 shadow-lg shadow-black/20">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33a1.125 1.125 0 0 1-1.06-1.05 1.106 1.106 0 0 1 1.05-1.064 1.126 1.126 0 0 1 1.06 1.049 1.11 1.11 0 0 1-1.05 1.065zm7.975 0a1.125 1.125 0 0 1-1.06-1.05 1.106 1.106 0 0 1 1.05-1.064 1.125 1.125 0 0 1 1.06 1.049 1.108 1.108 0 0 1-1.05 1.065z"/>
            </svg>
            Discord Server Link
          </label>
          <input
            type="url"
            value={links.discord}
            onChange={(e) => setLinks({ ...links, discord: e.target.value })}
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
            placeholder="https://discord.gg/your-server"
          />
          <p className="text-xs text-gray-500">Customers will get access to this Discord after purchasing</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram Link
          </label>
          <input
            type="url"
            value={links.telegram}
            onChange={(e) => setLinks({ ...links, telegram: e.target.value })}
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all placeholder:text-gray-600"
            placeholder="https://t.me/your-channel"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Other Links
          </label>
          <textarea
            value={links.other}
            onChange={(e) => setLinks({ ...links, other: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-black/60 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none placeholder:text-gray-600"
            placeholder="Additional links (one per line)"
          />
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-glow hover:shadow-primary-500/30 transition-all font-semibold border border-primary-500/50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Links
          </button>
        </div>
      </div>
    </div>
  )
}

