'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Implement actual contact form submission
    setTimeout(() => {
      toast.success('Thank you for your message! We will get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">Select a subject</option>
                <option value="support">Support</option>
                <option value="billing">Billing</option>
                <option value="refund">Refund Request</option>
                <option value="dispute">Dispute</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
