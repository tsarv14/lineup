'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Lineup, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use Lineup for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription Services</h2>
              <p>
                Subscriptions are billed in advance on a recurring basis. You may cancel your subscription at any time. Refunds are subject to our Refund Policy.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Content Disclaimer</h2>
              <p>
                The picks and predictions provided on Lineup are for informational purposes only. We do not guarantee the accuracy of any picks or predictions. All picks are opinions and should not be considered as guaranteed outcomes.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
              <p>
                In no event shall Lineup or its suppliers be liable for any damages arising out of the use or inability to use the service.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Age Restrictions</h2>
              <p>
                You must be 18 years or older (21+ in some jurisdictions) to use Lineup. We reserve the right to verify age and refuse service to anyone under the legal age.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
