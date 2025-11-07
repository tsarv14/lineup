'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, including your name, email address, payment information, and date of birth when you create an account or make a purchase.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, process transactions, verify identity (KYC), communicate with you, and comply with legal obligations.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only with service providers who assist us in operating our platform, processing payments, and verifying identity.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information, including encryption at rest and in transit. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p>
                You have the right to access, update, export, or delete your personal information at any time by contacting us or using your account settings. We comply with GDPR, CCPA, and other applicable data protection regulations.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
