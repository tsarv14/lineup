'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Refund Policy</h1>
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Refund Eligibility</h2>
              <p>
                Refunds may be requested within 7 days of purchase for subscription services. One-time purchases are generally non-refundable unless there is a technical issue preventing access or the pick has not yet been resolved.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How to Request a Refund</h2>
              <p>
                To request a refund, please contact our support team through the Contact page or email us directly. Include your order number and reason for the refund request. All refund requests are reviewed within 24-48 hours.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Processing Time</h2>
              <p>
                Refunds are typically processed within 5-10 business days. The refund will be issued to the original payment method used for the purchase.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cancellation</h2>
              <p>
                You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period. You will continue to have access until the period ends. No refunds are provided for partial billing periods.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Disputes</h2>
              <p>
                If you have a dispute regarding a purchase or subscription, please contact our support team. We will review your case and work to resolve the issue fairly and promptly.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
